-- Actualizar el horario del cron job de transición de planes para ejecutarse después de medianoche en Venezuela
-- BUG: El cron se ejecutaba a 1:05 AM UTC = 9:05 PM Venezuela, 3 horas ANTES de medianoche
-- FIX: Ahora se ejecutará a 4:05 AM UTC = 12:05 AM Venezuela (5 minutos después de medianoche)

-- Desprogramar el cron job existente
SELECT cron.unschedule('transicion-diaria-de-planes');

-- Reprogramar con el nuevo horario: 4:05 AM UTC = 12:05 AM Venezuela
-- Se ejecuta 5 minutos después de medianoche en Venezuela para asegurar que el día haya cambiado
SELECT cron.schedule(
  'transicion-diaria-de-planes',
  '5 4 * * *',  -- 4:05 AM UTC = 12:05 AM hora de Venezuela (UTC-4)
  $$
    SELECT public.transicion_automatica_de_plan();
  $$
);

-- Comentario explicativo
COMMENT ON EXTENSION pg_cron IS 
'Cron job "transicion-diaria-de-planes" se ejecuta a las 4:05 AM UTC (12:05 AM Venezuela).
Esto asegura que las transiciones de planes se hagan después de medianoche hora de Venezuela,
marcando planes como completados correctamente según la zona horaria local.
Previamente se ejecutaba a 1:05 AM UTC (9:05 PM Venezuela), causando transiciones prematuras.';
