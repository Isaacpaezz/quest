ALTER TABLE public.progreso_usuario
ADD COLUMN lectura_completada_en timestamptz,
ADD COLUMN oracion_completada_en timestamptz;
