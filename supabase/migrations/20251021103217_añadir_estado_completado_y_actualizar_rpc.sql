-- Renombrar el tipo ENUM existente
ALTER TYPE public.plan_estado RENAME TO plan_estado_viejo;

-- Crear el nuevo tipo ENUM con el estado 'completado'
CREATE TYPE public.plan_estado AS ENUM ('inactivo', 'activo', 'proximo', 'completado');

-- Alterar la tabla para usar el nuevo tipo
ALTER TABLE public.planes_lectura 
ALTER COLUMN estado DROP DEFAULT,
ALTER COLUMN estado TYPE public.plan_estado USING estado::text::public.plan_estado,
ALTER COLUMN estado SET DEFAULT 'inactivo';

-- Eliminar el tipo viejo
DROP TYPE public.plan_estado_viejo;

-- ACTUALIZAR LA FUNCIÓN DEL CRON JOB
-- Ahora, cuando un plan activo termina, se marcará como 'completado'.
CREATE OR REPLACE FUNCTION public.transicion_automatica_de_plan()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  plan_activo_finalizado_id bigint;
  plan_proximo_id bigint;
BEGIN
  SELECT id INTO plan_activo_finalizado_id
  FROM public.planes_lectura
  WHERE estado = 'activo' AND fecha_fin < CURRENT_DATE
  LIMIT 1;

  IF plan_activo_finalizado_id IS NOT NULL THEN
    -- CAMBIO CLAVE: De 'inactivo' a 'completado'
    UPDATE public.planes_lectura
    SET estado = 'completado'
    WHERE id = plan_activo_finalizado_id;

    SELECT id INTO plan_proximo_id
    FROM public.planes_lectura
    WHERE estado = 'proximo'
    LIMIT 1;
    
    IF plan_proximo_id IS NOT NULL THEN
      UPDATE public.planes_lectura
      SET estado = 'activo'
      WHERE id = plan_proximo_id;
    END IF;
  END IF;
END;
$$;
