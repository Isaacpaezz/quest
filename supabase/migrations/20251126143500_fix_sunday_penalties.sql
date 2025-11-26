-- 1. Eliminar penalizaciones existentes que caigan en domingo
-- ISODOW: 1=Lunes, ..., 7=Domingo
DELETE FROM public.penalizaciones 
WHERE EXTRACT(ISODOW FROM fecha_incumplimiento) = 7;

-- 2. Actualizar la función para evitar crear nuevas penalizaciones en domingo
CREATE OR REPLACE FUNCTION public.registrar_penalizaciones_diarias()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  monto_penalizacion numeric;
  fecha_de_ayer date;
  fecha_actual_venezuela timestamptz;
BEGIN
  -- Obtener el monto de la penalización desde la configuración.
  SELECT valor::numeric INTO monto_penalizacion
  FROM public.configuracion_app
  WHERE clave = 'monto_penalizacion';

  -- Si no hay un monto configurado, no hacer nada.
  IF monto_penalizacion IS NULL OR monto_penalizacion <= 0 THEN
    RETURN;
  END IF;
  
  -- Obtener la fecha actual en zona horaria de Venezuela (America/Caracas, UTC-4)
  fecha_actual_venezuela := NOW() AT TIME ZONE 'America/Caracas';
  
  -- Establecer la fecha a verificar (el día de ayer en Venezuela)
  fecha_de_ayer := (fecha_actual_venezuela::date) - 1;

  -- Si el día de ayer fue domingo (ISODOW = 7), no aplicar penalizaciones.
  -- Los domingos son días de descanso y no cuentan para deuda.
  IF EXTRACT(ISODOW FROM fecha_de_ayer) = 7 THEN
    RETURN;
  END IF;

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

-- Comentario explicativo actualizado
COMMENT ON FUNCTION public.registrar_penalizaciones_diarias() IS 
'Registra penalizaciones diarias para usuarios que no completaron sus tareas.
Usa zona horaria de Venezuela (America/Caracas, UTC-4) para calcular el día anterior.
Ignora los domingos (ISODOW=7) ya que son días libres de penalización.
Debe ejecutarse después de las 12:00 AM hora de Venezuela para penalizar el día anterior correctamente.';
