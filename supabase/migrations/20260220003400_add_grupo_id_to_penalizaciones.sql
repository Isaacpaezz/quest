-- Add grupo_id column to penalizaciones for group-scoped penalties
ALTER TABLE public.penalizaciones
  ADD COLUMN grupo_id uuid REFERENCES public.grupos(id);

-- Backfill: assign grupo_id based on user's membership
UPDATE public.penalizaciones p
SET grupo_id = (
  SELECT mg.grupo_id
  FROM public.miembros_grupo mg
  WHERE mg.usuario_id = p.usuario_id
  LIMIT 1
)
WHERE p.grupo_id IS NULL;

-- Update the registrar_penalizaciones_diarias function to include grupo_id
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
