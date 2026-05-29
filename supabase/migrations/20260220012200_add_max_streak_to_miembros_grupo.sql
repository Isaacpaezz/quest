-- Add max_streak column to miembros_grupo for per-group max streak tracking
ALTER TABLE public.miembros_grupo
  ADD COLUMN max_streak integer NOT NULL DEFAULT 0;

-- Backfill: copy perfiles.max_streak → miembros_grupo.max_streak
-- for Tiempo con Dios group (the original group where all streaks were accrued)
UPDATE public.miembros_grupo mg
SET max_streak = p.max_streak
FROM public.perfiles p
WHERE mg.usuario_id = p.id
  AND mg.grupo_id = '21efefd8-f647-40d1-98cf-380069e6d7b4';
