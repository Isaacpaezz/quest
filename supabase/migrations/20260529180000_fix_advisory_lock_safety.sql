-- Fix registrar_penalizaciones_diarias: wrap body in BEGIN/EXCEPTION/END
-- so pg_advisory_unlock is always called even if an exception occurs mid-loop.
-- Additive only — CREATE OR REPLACE, no DROP, no DELETE.

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
  lock_acquired boolean;
BEGIN
  -- Advisory lock: si otra instancia ya está corriendo, salir inmediatamente
  SELECT pg_try_advisory_lock(hashtext('penalizaciones_diarias')) INTO lock_acquired;
  IF NOT lock_acquired THEN
    RAISE NOTICE 'Otra instancia ya está ejecutándose. Saliendo.';
    RETURN;
  END IF;

  BEGIN
    -- Iterar por grupos en orden aleatorio para distribuir la carga
    FOR rec IN
      SELECT id FROM public.grupos WHERE activo = true ORDER BY random()
    LOOP
      -- Obtener timezone del grupo
      SELECT valor INTO v_timezone
      FROM public.configuracion_app
      WHERE clave = 'timezone' AND grupo_id = rec.id;

      v_timezone := COALESCE(v_timezone, 'America/Caracas');

      -- Solo procesar si es hora 0 (12:00-12:59 AM) en la timezone del grupo
      v_hora_local := EXTRACT(HOUR FROM (NOW() AT TIME ZONE v_timezone));
      IF v_hora_local != 0 THEN
        CONTINUE;
      END IF;

      -- Obtener monto de penalización del grupo
      SELECT valor::numeric INTO v_monto
      FROM public.configuracion_app
      WHERE clave = 'monto_penalizacion' AND grupo_id = rec.id;

      IF v_monto IS NULL OR v_monto <= 0 THEN
        CONTINUE;
      END IF;

      -- Calcular "ayer" en la timezone del grupo
      v_fecha_ayer := ((NOW() AT TIME ZONE v_timezone)::date) - 1;

      -- Verificar días libres configurables
      SELECT valor::jsonb INTO v_dias_libres
      FROM public.configuracion_app
      WHERE clave = 'dias_libres' AND grupo_id = rec.id;

      v_dias_libres := COALESCE(v_dias_libres, '[]'::jsonb);
      v_dow := EXTRACT(DOW FROM v_fecha_ayer);

      IF v_dias_libres @> to_jsonb(v_dow) THEN
        CONTINUE;
      END IF;

      -- Penalizar solo miembros de este grupo que no cumplieron ayer
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

      -- Micro-pausa entre grupos para no saturar (100ms)
      PERFORM pg_sleep(0.1);
    END LOOP;

  EXCEPTION WHEN OTHERS THEN
    -- Always release the advisory lock on error
    PERFORM pg_advisory_unlock(hashtext('penalizaciones_diarias'));
    RAISE;
  END;

  -- Liberar el advisory lock en el camino normal
  PERFORM pg_advisory_unlock(hashtext('penalizaciones_diarias'));

  RAISE NOTICE 'Penalizaciones completadas. Grupos procesados: %', v_grupos_procesados;
END;
$$;

COMMENT ON FUNCTION public.registrar_penalizaciones_diarias() IS
'Registra penalizaciones diarias por grupo. Corre cada hora via pg_cron.
Optimizaciones:
- Advisory lock: evita ejecuciones simultáneas (ahora exception-safe)
- Orden aleatorio: distribuye carga entre grupos de la misma timezone
- pg_sleep(0.1): micro-pausa entre grupos para no saturar
- ON CONFLICT DO NOTHING: evita duplicados
- Días libres configurables por grupo
Solo procesa grupos donde es medianoche local (hora 0).';
