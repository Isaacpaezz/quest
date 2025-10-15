CREATE OR REPLACE FUNCTION public.registrar_penalizaciones_diarias()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  monto_penalizacion numeric;
  fecha_de_ayer date;
BEGIN
  -- Obtener el monto de la penalización desde la configuración.
  SELECT valor::numeric INTO monto_penalizacion
  FROM public.configuracion_app
  WHERE clave = 'monto_penalizacion';

  -- Si no hay un monto configurado, no hacer nada.
  IF monto_penalizacion IS NULL OR monto_penalizacion <= 0 THEN
    RETURN;
  END IF;
  
  -- Establecer la fecha a verificar (el día de ayer).
  fecha_de_ayer := CURRENT_DATE - 1;

  -- Insertar penalizaciones para todos los usuarios que no cumplieron.
  -- Esta es una única consulta eficiente en lugar de un bucle.
  INSERT INTO public.penalizaciones (usuario_id, fecha_incumplimiento, monto)
  SELECT
    p.id,
    fecha_de_ayer,
    monto_penalizacion
  FROM public.perfiles p
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.progreso_usuario pu
    WHERE pu.usuario_id = p.id
      AND pu.fecha_progreso = fecha_de_ayer
      AND pu.lectura_completada = TRUE
      AND pu.oracion_completada = TRUE
  )
  ON CONFLICT (usuario_id, fecha_incumplimiento) DO NOTHING; -- No crear duplicados si el cron se ejecuta más de una vez.
END;
$$;
