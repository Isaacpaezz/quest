CREATE OR REPLACE FUNCTION public.programar_plan_siguiente(
  plan_id_a_programar bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Paso 1: Asegurarse de que ningún otro plan esté marcado como 'próximo'.
  -- Esto garantiza que solo haya un plan en la cola.
  UPDATE public.planes_lectura
  SET estado = 'inactivo'
  WHERE estado = 'próximo';

  -- Paso 2: Marcar el plan seleccionado como 'próximo'.
  UPDATE public.planes_lectura
  SET estado = 'próximo'
  WHERE id = plan_id_a_programar;
END;
$$;
