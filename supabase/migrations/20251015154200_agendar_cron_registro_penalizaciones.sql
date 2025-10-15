-- Agendar la función 'registrar_penalizaciones_diarias' para que se ejecute
-- todos los días a las 2:05 AM UTC.
-- Se ejecuta después de la transición de planes para asegurar consistencia.
SELECT cron.schedule(
  'registro-diario-de-penalizaciones',
  '5 2 * * *',
  $$
    SELECT public.registrar_penalizaciones_diarias();
  $$
);
