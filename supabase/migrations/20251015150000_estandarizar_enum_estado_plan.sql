-- Primero, corregimos la función RPC para que use los valores sin tilde.
CREATE OR REPLACE FUNCTION public.programar_plan_siguiente(
  plan_id_a_programar bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Paso 1: Usar 'proximo' (sin tilde)
  UPDATE public.planes_lectura
  SET estado = 'inactivo'
  WHERE estado = 'proximo';

  -- Paso 2: Usar 'proximo' (sin tilde)
  UPDATE public.planes_lectura
  SET estado = 'proximo'
  WHERE id = plan_id_a_programar;
END;
$$;


-- Segundo, corregimos el tipo ENUM en sí.
ALTER TYPE public.plan_estado RENAME TO plan_estado_viejo;

CREATE TYPE public.plan_estado AS ENUM ('inactivo', 'activo', 'proximo');

ALTER TABLE public.planes_lectura 
ALTER COLUMN estado DROP DEFAULT,
ALTER COLUMN estado TYPE public.plan_estado USING estado::text::public.plan_estado,
ALTER COLUMN estado SET DEFAULT 'inactivo';

DROP TYPE public.plan_estado_viejo;
