-- Habilitar la extensión pg_cron si no está ya habilitada
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Agendar la función 'transicion_automatica_de_plan' para que se ejecute
-- todos los días a la 1:05 AM UTC.
-- El formato cron '5 1 * * *' significa:
-- minuto 5, hora 1, cualquier día del mes, cualquier mes, cualquier día de la semana.
-- Usamos las funciones de seguridad de Supabase para desprogramar cualquier
-- tarea anterior con el mismo nombre y evitar duplicados.
SELECT cron.schedule(
  'transicion-diaria-de-planes',
  '5 1 * * *',
  $$
    SELECT public.transicion_automatica_de_plan();
  $$
);
