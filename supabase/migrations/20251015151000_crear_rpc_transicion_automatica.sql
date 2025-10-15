CREATE OR REPLACE FUNCTION public.transicion_automatica_de_plan()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  plan_activo_finalizado_id bigint;
  plan_proximo_id bigint;
BEGIN
  -- 1. Buscar si hay un plan activo que ya terminó.
  -- Usamos `CURRENT_DATE - 1` para asegurarnos de que el día completo haya pasado.
  SELECT id INTO plan_activo_finalizado_id
  FROM public.planes_lectura
  WHERE estado = 'activo' AND fecha_fin < CURRENT_DATE
  LIMIT 1;

  -- 2. Si se encontró un plan activo y finalizado, marcarlo como inactivo.
  IF plan_activo_finalizado_id IS NOT NULL THEN
    UPDATE public.planes_lectura
    SET estado = 'inactivo'
    WHERE id = plan_activo_finalizado_id;

    -- 3. Ahora, buscar el plan que estaba en cola para ser el siguiente.
    SELECT id INTO plan_proximo_id
    FROM public.planes_lectura
    WHERE estado = 'proximo'
    LIMIT 1;
    
    -- 4. Si se encontró un plan próximo, activarlo.
    IF plan_proximo_id IS NOT NULL THEN
      UPDATE public.planes_lectura
      SET estado = 'activo'
      WHERE id = plan_proximo_id;
    END IF;
  END IF;
END;
$$;
