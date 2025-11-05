-- Corregir la función de transición automática de planes para usar zona horaria de Venezuela
-- BUG: La función usaba CURRENT_DATE (UTC) lo que causaba que los planes se marcaran como
-- completados 4 horas antes de que terminara el día en Venezuela.

CREATE OR REPLACE FUNCTION public.transicion_automatica_de_plan()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  plan_activo_finalizado_id bigint;
  plan_proximo_id bigint;
  fecha_actual_venezuela date;
BEGIN
  -- Obtener la fecha actual en zona horaria de Venezuela (America/Caracas, UTC-4)
  fecha_actual_venezuela := (NOW() AT TIME ZONE 'America/Caracas')::date;

  -- Buscar un plan activo cuya fecha de fin sea MENOR que hoy en Venezuela
  SELECT id INTO plan_activo_finalizado_id
  FROM public.planes_lectura
  WHERE estado = 'activo' AND fecha_fin < fecha_actual_venezuela
  LIMIT 1;

  IF plan_activo_finalizado_id IS NOT NULL THEN
    -- Marcar el plan como 'completado'
    UPDATE public.planes_lectura
    SET estado = 'completado'
    WHERE id = plan_activo_finalizado_id;

    -- Buscar el siguiente plan programado (estado 'proximo')
    SELECT id INTO plan_proximo_id
    FROM public.planes_lectura
    WHERE estado = 'proximo'
    LIMIT 1;
    
    -- Si existe un plan próximo, activarlo
    IF plan_proximo_id IS NOT NULL THEN
      UPDATE public.planes_lectura
      SET estado = 'activo'
      WHERE id = plan_proximo_id;
    END IF;
  END IF;
END;
$$;

-- Comentario explicativo
COMMENT ON FUNCTION public.transicion_automatica_de_plan() IS 
'Transición automática de planes de lectura basada en fechas.
Marca planes activos como completados cuando su fecha_fin < fecha actual en Venezuela.
Activa el siguiente plan programado (estado proximo) si existe.
Usa zona horaria de Venezuela (America/Caracas, UTC-4) para determinar el día actual.
Debe ejecutarse después de las 12:00 AM hora de Venezuela para hacer transiciones correctamente.';
