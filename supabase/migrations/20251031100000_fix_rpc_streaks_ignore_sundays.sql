-- Corregir la función RPC para que ignore los domingos en el cálculo de rachas.
-- La lógica anterior rompía la racha si había un salto de más de un día.
-- Esta versión permite un salto de 2 días si el día anterior a la pausa fue un sábado.

CREATE OR REPLACE FUNCTION public.get_all_user_streaks()
RETURNS TABLE (
  user_id uuid,
  streak_count int
)
LANGUAGE sql
AS $$
WITH daily_completions AS (
  -- 1. Obtenemos solo los días en que cada usuario completó AMBAS tareas
  SELECT
    usuario_id,
    fecha_progreso::date AS completion_date
  FROM public.progreso_usuario
  WHERE lectura_completada = true AND oracion_completada = true
  GROUP BY usuario_id, fecha_progreso
),
streaks AS (
  -- 2. Identificamos el inicio de una nueva racha, ignorando los domingos
  SELECT
    usuario_id,
    completion_date,
    -- Si la diferencia con el día anterior es mayor a 1, es una nueva racha,
    -- a menos que el día anterior fuera sábado (permite saltar el domingo).
    CASE
      WHEN completion_date - LAG(completion_date, 1, completion_date) OVER (PARTITION BY usuario_id ORDER BY completion_date) > 1
           AND EXTRACT(ISODOW FROM LAG(completion_date, 1, completion_date) OVER (PARTITION BY usuario_id ORDER BY completion_date)) != 6 THEN 1
      ELSE 0
    END AS is_new_streak
  FROM daily_completions
),
streak_groups AS (
  -- 3. Asignamos un ID a cada grupo de racha
  SELECT
    usuario_id,
    completion_date,
    SUM(is_new_streak) OVER (PARTITION BY usuario_id ORDER BY completion_date) AS streak_group
  FROM streaks
),
latest_streaks AS (
  -- 4. Contamos la longitud de cada racha y nos quedamos con la más reciente de cada usuario
  SELECT
    usuario_id,
    COUNT(*) AS streak,
    MAX(completion_date) as last_completion_date,
    ROW_NUMBER() OVER(PARTITION BY usuario_id ORDER BY MAX(completion_date) DESC) as rn
  FROM streak_groups
  GROUP BY usuario_id, streak_group
)
-- 5. Filtramos para obtener la racha actual de cada usuario
SELECT
  p.id AS user_id,
  -- Si la última misión completada fue antes de ayer (y no fue sábado), la racha es 0.
  CASE
    WHEN ls.last_completion_date >= (NOW() AT TIME ZONE 'America/Caracas')::date - INTERVAL '1 day' THEN ls.streak::int
    -- Permitir que la racha continúe si el último día fue viernes y hoy es lunes
    WHEN EXTRACT(ISODOW FROM (NOW() AT TIME ZONE 'America/Caracas')::date) = 1 AND ls.last_completion_date = (NOW() AT TIME ZONE 'America/Caracas')::date - INTERVAL '3 days' THEN ls.streak::int
    ELSE 0
  END AS streak_count
FROM public.perfiles p
LEFT JOIN latest_streaks ls ON p.id = ls.usuario_id AND ls.rn = 1;
$$;

-- Comentario explicativo
COMMENT ON FUNCTION public.get_all_user_streaks() IS 
'Calcula la racha actual de días consecutivos para todos los usuarios, ignorando los domingos.
Una racha se cuenta cuando el usuario completa AMBAS tareas (lectura y oración).
Un salto de sábado a lunes no rompe la racha.
Usa zona horaria de Venezuela (America/Caracas) para determinar si la racha sigue activa.
Si la última misión completada fue antes de ayer (y no fue sábado), la racha se resetea a 0.
Retorna: user_id (uuid) y streak_count (int) para cada usuario.';
