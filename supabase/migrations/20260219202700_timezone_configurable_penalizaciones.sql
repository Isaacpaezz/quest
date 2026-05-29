-- Sub-fase 3G: Timezone Configurable
-- 1. Fix PK para soportar configuración por grupo
-- 2. Reescribir registrar_penalizaciones_diarias con timezone + scoping por grupo
-- 3. Cron cada hora (solo procesa grupos donde es medianoche local)
-- 4. Optimizado: advisory lock, orden aleatorio, micro-pausas
-- 5. Seed timezone para grupos existentes

-- Fix PK: (clave) → (clave, grupo_id)
UPDATE public.configuracion_app SET grupo_id = grupo_id WHERE grupo_id IS NOT NULL;
ALTER TABLE public.configuracion_app ALTER COLUMN grupo_id SET NOT NULL;
ALTER TABLE public.configuracion_app DROP CONSTRAINT configuracion_app_pkey;
ALTER TABLE public.configuracion_app ADD PRIMARY KEY (clave, grupo_id);

-- Reescribir función de penalizaciones
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
BEGIN
  -- Advisory lock: si otra instancia ya está corriendo, salir inmediatamente
  IF NOT pg_try_advisory_lock(hashtext('penalizaciones_diarias')) THEN
    RAISE NOTICE 'Otra instancia ya está ejecutándose. Saliendo.';
    RETURN;
  END IF;

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

    -- Domingos son días libres
    IF EXTRACT(ISODOW FROM v_fecha_ayer) = 7 THEN
      CONTINUE;
    END IF;

    -- Penalizar solo miembros de este grupo que no cumplieron ayer
    INSERT INTO public.penalizaciones (usuario_id, fecha_incumplimiento, monto)
    SELECT
      mg.usuario_id,
      v_fecha_ayer,
      v_monto
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

  -- Liberar el advisory lock
  PERFORM pg_advisory_unlock(hashtext('penalizaciones_diarias'));

  RAISE NOTICE 'Penalizaciones completadas. Grupos procesados: %', v_grupos_procesados;
END;
$$;

COMMENT ON FUNCTION public.registrar_penalizaciones_diarias() IS
'Registra penalizaciones diarias por grupo. Corre cada hora via pg_cron.
Optimizaciones:
- Advisory lock: evita ejecuciones simultáneas
- Orden aleatorio: distribuye carga entre grupos de la misma timezone
- pg_sleep(0.1): micro-pausa entre grupos para no saturar
- ON CONFLICT DO NOTHING: evita duplicados
Solo procesa grupos donde es medianoche local (hora 0).';

-- Reprogramar cron: cada hora al minuto 5
SELECT cron.unschedule('registro-diario-de-penalizaciones');
SELECT cron.schedule(
  'registro-diario-de-penalizaciones',
  '5 * * * *',
  $$
    SELECT public.registrar_penalizaciones_diarias();
  $$
);

-- Seed timezone para grupos existentes
INSERT INTO public.configuracion_app (clave, valor, grupo_id)
SELECT 'timezone', 'America/Caracas', g.id
FROM public.grupos g
WHERE g.activo = true
  AND NOT EXISTS (
    SELECT 1 FROM public.configuracion_app ca
    WHERE ca.clave = 'timezone' AND ca.grupo_id = g.id
  );
