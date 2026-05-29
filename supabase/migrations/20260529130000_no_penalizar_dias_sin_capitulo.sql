-- BUG FIX: No penalizar días sin capítulo asignado (gap entre planes)
--
-- Problema: Cuando un plan terminaba y el siguiente aún no estaba creado,
-- los usuarios eran penalizados por no completar lectura/oración en días
-- donde literalmente no había nada que completar.
--
-- Fix: Agregar check que saltee la penalización si ayer no existía ningún
-- capítulo asignado en los planes del grupo.

CREATE OR REPLACE FUNCTION public.registrar_penalizaciones_diarias()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
  v_timezone text;
  v_monto numeric;
  v_fecha_ayer date;
  v_hora_local int;
  v_grupos_procesados int := 0;
  v_dias_libres jsonb;
  v_dow int;
  v_tiene_capitulo boolean;
BEGIN
  IF NOT pg_try_advisory_lock(hashtext('penalizaciones_diarias')) THEN
    RAISE NOTICE 'Otra instancia ya está ejecutándose. Saliendo.';
    RETURN;
  END IF;

  FOR rec IN
    SELECT id FROM public.grupos WHERE activo = true ORDER BY random()
  LOOP
    SELECT valor INTO v_timezone
    FROM public.configuracion_app
    WHERE clave = 'timezone' AND grupo_id = rec.id;

    v_timezone := COALESCE(v_timezone, 'America/Caracas');

    v_hora_local := EXTRACT(HOUR FROM (NOW() AT TIME ZONE v_timezone));
    IF v_hora_local != 0 THEN
      CONTINUE;
    END IF;

    SELECT valor::numeric INTO v_monto
    FROM public.configuracion_app
    WHERE clave = 'monto_penalizacion' AND grupo_id = rec.id;

    IF v_monto IS NULL OR v_monto <= 0 THEN
      CONTINUE;
    END IF;

    v_fecha_ayer := ((NOW() AT TIME ZONE v_timezone)::date) - 1;

    SELECT valor::jsonb INTO v_dias_libres
    FROM public.configuracion_app
    WHERE clave = 'dias_libres' AND grupo_id = rec.id;

    v_dias_libres := COALESCE(v_dias_libres, '[]'::jsonb);
    v_dow := EXTRACT(DOW FROM v_fecha_ayer);

    IF v_dias_libres @> to_jsonb(v_dow) THEN
      CONTINUE;
    END IF;

    -- FIX: Skip penalty if yesterday had no chapter assigned in any plan of this group
    SELECT EXISTS(
      SELECT 1
      FROM public.capitulos_diarios cd
      JOIN public.planes_lectura pl ON pl.id = cd.plan_id
      WHERE pl.grupo_id = rec.id
        AND cd.fecha_lectura = v_fecha_ayer
    ) INTO v_tiene_capitulo;

    IF NOT v_tiene_capitulo THEN
      CONTINUE;
    END IF;

    INSERT INTO public.penalizaciones (usuario_id, fecha_incumplimiento, monto, grupo_id)
    SELECT
      mg.usuario_id,
      v_fecha_ayer,
      v_monto,
      rec.id
    FROM public.miembros_grupo mg
    WHERE mg.grupo_id = rec.id
      AND NOT EXISTS (
        SELECT 1
        FROM public.progreso_usuario pu
        WHERE pu.usuario_id = mg.usuario_id
          AND pu.fecha_progreso = v_fecha_ayer
          AND pu.lectura_completada = TRUE
          AND pu.oracion_completada = TRUE
      )
    ON CONFLICT (usuario_id, fecha_incumplimiento) DO NOTHING;

    v_grupos_procesados := v_grupos_procesados + 1;
    PERFORM pg_sleep(0.1);
  END LOOP;

  PERFORM pg_advisory_unlock(hashtext('penalizaciones_diarias'));
  RAISE NOTICE 'Penalizaciones completadas. Grupos procesados: %', v_grupos_procesados;
END;
$$;

COMMENT ON FUNCTION public.registrar_penalizaciones_diarias() IS
'Registra penalizaciones diarias por incumplimiento de lectura y oración.
FIX: No penaliza días sin capítulo asignado (gap entre planes de lectura).
Se ejecuta cada hora vía cron, pero solo procesa cuando la hora local es 0 (medianoche).';
