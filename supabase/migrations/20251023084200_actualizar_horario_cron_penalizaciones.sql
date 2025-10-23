-- Actualizar el horario del cron job de penalizaciones para ejecutarse a las 12:05 AM hora de Venezuela
-- Venezuela está en UTC-4, por lo que 12:05 AM VET = 4:05 AM UTC

-- Primero, desprogramar el cron job existente
SELECT cron.unschedule('registro-diario-de-penalizaciones');

-- Reprogramar con el nuevo horario: 4:05 AM UTC = 12:05 AM Venezuela
-- Se ejecuta 5 minutos después de medianoche en Venezuela para asegurar que el día haya cambiado
SELECT cron.schedule(
  'registro-diario-de-penalizaciones',
  '5 4 * * *',  -- 4:05 AM UTC = 12:05 AM hora de Venezuela (UTC-4)
  $$
    SELECT public.registrar_penalizaciones_diarias();
  $$
);

-- Comentario explicativo
COMMENT ON EXTENSION pg_cron IS 
'Cron job "registro-diario-de-penalizaciones" se ejecuta a las 4:05 AM UTC (12:05 AM Venezuela).
Esto asegura que las penalizaciones se apliquen después de medianoche hora de Venezuela,
penalizando correctamente el día anterior según la zona horaria local.';
