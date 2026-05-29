-- Add grupo_id to actividad_comunidad for group-scoped feed
-- This column is already used in code but was never created in the database

ALTER TABLE public.actividad_comunidad
ADD COLUMN IF NOT EXISTS grupo_id UUID REFERENCES public.grupos(id) ON DELETE SET NULL;

-- Index for efficient group-scoped queries
CREATE INDEX IF NOT EXISTS idx_actividad_comunidad_grupo_id 
ON public.actividad_comunidad(grupo_id);

-- Backfill existing activities with their user's active group
UPDATE public.actividad_comunidad ac
SET grupo_id = p.grupo_activo_id
FROM public.perfiles p
WHERE ac.usuario_id = p.id
  AND ac.grupo_id IS NULL;

-- Update RLS policies to respect grupo_id
DROP POLICY IF EXISTS "Users can view activities from their group" ON public.actividad_comunidad;
CREATE POLICY "Users can view activities from their group"
ON public.actividad_comunidad FOR SELECT
USING (
  grupo_id IN (
    SELECT grupo_id FROM public.miembros_grupo 
    WHERE usuario_id = auth.uid()
  )
);

-- Allow users to insert activities for their own group
DROP POLICY IF EXISTS "Users can insert activities for their group" ON public.actividad_comunidad;
CREATE POLICY "Users can insert activities for their group"
ON public.actividad_comunidad FOR INSERT
WITH CHECK (
  usuario_id = auth.uid()
  AND grupo_id IN (
    SELECT grupo_id FROM public.miembros_grupo 
    WHERE usuario_id = auth.uid()
  )
);
