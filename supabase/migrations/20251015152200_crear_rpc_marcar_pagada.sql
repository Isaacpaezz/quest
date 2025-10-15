CREATE OR REPLACE FUNCTION public.marcar_penalizacion_pagada(
  penalizacion_id_param bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.penalizaciones
  SET estado = 'pagada'
  WHERE id = penalizacion_id_param;
END;
$$;
