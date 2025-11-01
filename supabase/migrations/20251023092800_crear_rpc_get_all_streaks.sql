-- Crear función RPC para calcular las rachas actuales de todos los usuarios
-- Esta función calcula cuántos días consecutivos cada usuario ha completado ambas tareas (lectura y oración)
-- Usa zona horaria de Venezuela para determinar si la racha sigue activa

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
  -- 2. Identificamos el inicio de una nueva racha
  SELECT
    usuario_id,
    completion_date,
    -- Si la diferencia con el día anterior es mayor a 1, es una nueva racha
    CASE
      WHEN completion_date - LAG(completion_date, 1, completion_date) OVER (PARTITION BY usuario_id ORDER BY completion_date) > 1 THEN 1
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
  -- Si la última misión completada fue antes de ayer, la racha es 0.
  CASE
    WHEN ls.last_completion_date >= (NOW() AT TIME ZONE 'America/Caracas')::date - INTERVAL '1 day' THEN ls.streak::int
    ELSE 0
  END AS streak_count
FROM public.perfiles p
LEFT JOIN latest_streaks ls ON p.id = ls.usuario_id AND ls.rn = 1;
$$;

-- Comentario explicativo
COMMENT ON FUNCTION public.get_all_user_streaks() IS 
'Calcula la racha actual de días consecutivos para todos los usuarios.
Una racha se cuenta solo cuando el usuario completa AMBAS tareas (lectura y oración) en un día.
Usa zona horaria de Venezuela (America/Caracas) para determinar si la racha sigue activa.
Si la última misión completada fue antes de ayer, la racha se resetea a 0.
Retorna: user_id (uuid) y streak_count (int) para cada usuario.';
