-- Fix transicion_automatica_de_plan: add advisory lock for concurrency control.
-- Without this, concurrent executions could race on plan state transitions.
-- Additive only — CREATE OR REPLACE, no DROP, no DELETE.

CREATE OR REPLACE FUNCTION public.transicion_automatica_de_plan()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
  v_timezone text;
  v_fecha_actual date;
  v_plan_activo_id bigint;
  v_plan_proximo_id bigint;
  lock_acquired boolean;
BEGIN
  -- Advisory lock: si otra instancia ya está corriendo, salir inmediatamente
  SELECT pg_try_advisory_lock(hashtext('transicion_plan')) INTO lock_acquired;
  IF NOT lock_acquired THEN
    RAISE NOTICE 'transicion_automatica_de_plan: otra instancia ya está ejecutándose. Saliendo.';
    RETURN;
  END IF;

  BEGIN
    -- Iterate over all active groups
    FOR rec IN
      SELECT id FROM public.grupos WHERE activo = true
    LOOP
      -- Read timezone for this group
      SELECT valor INTO v_timezone
      FROM public.configuracion_app
      WHERE clave = 'timezone' AND grupo_id = rec.id;

      v_timezone := COALESCE(v_timezone, 'America/Caracas');

      -- Current date in the group's timezone
      v_fecha_actual := (NOW() AT TIME ZONE v_timezone)::date;

      -- Find active plan for this group whose fecha_fin has passed
      SELECT id INTO v_plan_activo_id
      FROM public.planes_lectura
      WHERE estado = 'activo'
        AND grupo_id = rec.id
        AND fecha_fin < v_fecha_actual
      LIMIT 1;

      IF v_plan_activo_id IS NOT NULL THEN
        -- Mark the plan as completed
        UPDATE public.planes_lectura
        SET estado = 'completado'
        WHERE id = v_plan_activo_id;

        -- Find the next scheduled plan for this group
        SELECT id INTO v_plan_proximo_id
        FROM public.planes_lectura
        WHERE estado = 'proximo'
          AND grupo_id = rec.id
        LIMIT 1;

        -- Activate the next plan if it exists
        IF v_plan_proximo_id IS NOT NULL THEN
          UPDATE public.planes_lectura
          SET estado = 'activo'
          WHERE id = v_plan_proximo_id;
        END IF;
      END IF;
    END LOOP;

  EXCEPTION WHEN OTHERS THEN
    -- Always release the advisory lock on error
    PERFORM pg_advisory_unlock(hashtext('transicion_plan'));
    RAISE;
  END;

  -- Release advisory lock on normal exit
  PERFORM pg_advisory_unlock(hashtext('transicion_plan'));
END;
$$;

COMMENT ON FUNCTION public.transicion_automatica_de_plan() IS
'Transición automática de planes de lectura basada en fechas.
Itera sobre todos los grupos activos y lee la timezone de cada grupo
desde configuracion_app (clave=''timezone''). Usa NOW() AT TIME ZONE tz
para determinar el día actual de cada grupo.
Marca planes activos como completados cuando fecha_fin < fecha actual.
Activa el siguiente plan programado (estado proximo) si existe.
Fallback: America/Caracas si el grupo no tiene timezone configurada.
Advisory lock: evita ejecuciones simultáneas (exception-safe).';
