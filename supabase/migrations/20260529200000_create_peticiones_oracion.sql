-- =====================================================
-- MÓDULO: Peticiones de Oración
-- Fecha: 2026-05-29
-- Descripción: Tablas para peticiones de oración, intercesiones,
--              actualizaciones y integración con el feed.
--              Solo cambios aditivos — sin DROP ni DELETE.
-- =====================================================

-- ══════════════════════════════════════════════════════════════════════
-- 1. ENUMS
-- ══════════════════════════════════════════════════════════════════════

CREATE TYPE public.categoria_peticion AS ENUM (
  'salud',
  'familia',
  'trabajo',
  'espiritual',
  'urgente',
  'otro'
);

CREATE TYPE public.estado_peticion AS ENUM (
  'activa',
  'respondida',
  'archivada'
);

CREATE TYPE public.tipo_actualizacion AS ENUM (
  'progreso',
  'resuelto',
  'testimonio'
);

-- Extend tipo_actividad enum with new petition activity types
ALTER TYPE public.tipo_actividad ADD VALUE IF NOT EXISTS 'peticion_compartida';
ALTER TYPE public.tipo_actividad ADD VALUE IF NOT EXISTS 'peticion_respondida';

-- ══════════════════════════════════════════════════════════════════════
-- 2. TABLE: peticiones_oracion
-- ══════════════════════════════════════════════════════════════════════

CREATE TABLE public.peticiones_oracion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  grupo_id uuid REFERENCES public.grupos(id) ON DELETE SET NULL,
  titulo text NOT NULL CHECK (char_length(titulo) >= 3 AND char_length(titulo) <= 120),
  descripcion text CHECK (char_length(descripcion) <= 500),
  categoria public.categoria_peticion NOT NULL DEFAULT 'otro',
  visibilidad text NOT NULL DEFAULT 'group' CHECK (visibilidad IN ('private', 'group')),
  estado public.estado_peticion NOT NULL DEFAULT 'activa',
  oraciones_count int NOT NULL DEFAULT 0,
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz,
  respondida_en timestamptz
);

COMMENT ON TABLE public.peticiones_oracion IS 'Peticiones de oración de los usuarios';
COMMENT ON COLUMN public.peticiones_oracion.oraciones_count IS 'Contador de intercesiones (actualizado por trigger)';

-- Indexes for common queries
CREATE INDEX idx_peticiones_oracion_usuario ON public.peticiones_oracion(usuario_id);
CREATE INDEX idx_peticiones_oracion_grupo_estado ON public.peticiones_oracion(grupo_id, estado) WHERE estado = 'activa';
CREATE INDEX idx_peticiones_oracion_creado ON public.peticiones_oracion(creado_en DESC);

-- ══════════════════════════════════════════════════════════════════════
-- 3. TABLE: oraciones_por_peticion (intercessions)
-- ══════════════════════════════════════════════════════════════════════

CREATE TABLE public.oraciones_por_peticion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  peticion_id uuid NOT NULL REFERENCES public.peticiones_oracion(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  creado_en timestamptz NOT NULL DEFAULT now(),
  -- Lifetime uniqueness: one prayer per user per petition
  CONSTRAINT oraciones_por_peticion_unica UNIQUE (peticion_id, usuario_id)
);

COMMENT ON TABLE public.oraciones_por_peticion IS 'Intercesiones: cada usuario puede orar una vez por petición (lifetime)';

CREATE INDEX idx_oraciones_por_peticion_peticion ON public.oraciones_por_peticion(peticion_id);
CREATE INDEX idx_oraciones_por_peticion_usuario ON public.oraciones_por_peticion(usuario_id);

-- ══════════════════════════════════════════════════════════════════════
-- 4. TABLE: actualizaciones_peticion
-- ══════════════════════════════════════════════════════════════════════

CREATE TABLE public.actualizaciones_peticion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  peticion_id uuid NOT NULL REFERENCES public.peticiones_oracion(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
  tipo public.tipo_actualizacion NOT NULL DEFAULT 'progreso',
  texto text NOT NULL CHECK (char_length(texto) <= 300),
  testimonio_texto text CHECK (char_length(testimonio_texto) <= 1000),
  testimonio_publico boolean NOT NULL DEFAULT false,
  creado_en timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.actualizaciones_peticion IS 'Actualizaciones y testimonios sobre peticiones de oración';

CREATE INDEX idx_actualizaciones_peticion_peticion ON public.actualizaciones_peticion(peticion_id);
CREATE INDEX idx_actualizaciones_peticion_creado ON public.actualizaciones_peticion(creado_en DESC);

-- ══════════════════════════════════════════════════════════════════════
-- 5. TRIGGERS: oraciones_count cached counter
-- ══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_oraciones_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.peticiones_oracion
    SET oraciones_count = oraciones_count + 1
    WHERE id = NEW.peticion_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.peticiones_oracion
    SET oraciones_count = GREATEST(oraciones_count - 1, 0)
    WHERE id = OLD.peticion_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_oraciones_count
  AFTER INSERT OR DELETE ON public.oraciones_por_peticion
  FOR EACH ROW
  EXECUTE FUNCTION public.update_oraciones_count();

-- ══════════════════════════════════════════════════════════════════════
-- 6. TRIGGER: auto-set grupo_id on insert
-- ══════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.set_peticion_grupo_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If visibilidad is 'group' and grupo_id is null, set it from user's active group
  IF NEW.visibilidad = 'group' AND NEW.grupo_id IS NULL THEN
    SELECT grupo_activo_id INTO NEW.grupo_id
    FROM public.perfiles
    WHERE id = NEW.usuario_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_set_peticion_grupo_id
  BEFORE INSERT ON public.peticiones_oracion
  FOR EACH ROW
  EXECUTE FUNCTION public.set_peticion_grupo_id();

-- ══════════════════════════════════════════════════════════════════════
-- 7. RLS POLICIES
-- ══════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE public.peticiones_oracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oraciones_por_peticion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actualizaciones_peticion ENABLE ROW LEVEL SECURITY;

-- ─── peticiones_oracion policies ───

-- SELECT: Owner can see own petitions; group members can see group-visible petitions
CREATE POLICY "Users can view own petitions"
  ON public.peticiones_oracion FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Group members can view group petitions"
  ON public.peticiones_oracion FOR SELECT
  USING (
    visibilidad = 'group'
    AND grupo_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.miembros_grupo
      WHERE usuario_id = auth.uid() AND grupo_id = peticiones_oracion.grupo_id
    )
  );

-- INSERT: Authenticated users can create petitions
CREATE POLICY "Users can create petitions"
  ON public.peticiones_oracion FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- UPDATE: Only owner can update
CREATE POLICY "Users can update own petitions"
  ON public.peticiones_oracion FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- DELETE: Only owner can delete (soft delete via estado preferred)
CREATE POLICY "Users can delete own petitions"
  ON public.peticiones_oracion FOR DELETE
  USING (auth.uid() = usuario_id);

-- ─── oraciones_por_peticion policies ───

-- SELECT: Petition owner can see who prayed; group members can see intercessions on group petitions
CREATE POLICY "Petition owner can view intercessions"
  ON public.oraciones_por_peticion FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.peticiones_oracion
      WHERE id = oraciones_por_peticion.peticion_id AND usuario_id = auth.uid()
    )
  );

CREATE POLICY "Group members can view intercessions on group petitions"
  ON public.oraciones_por_peticion FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.peticiones_oracion p
      JOIN public.miembros_grupo mg ON mg.grupo_id = p.grupo_id
      WHERE p.id = oraciones_por_peticion.peticion_id
        AND p.visibilidad = 'group'
        AND mg.usuario_id = auth.uid()
    )
  );

-- INSERT: Authenticated users can pray for petitions
CREATE POLICY "Users can pray for petitions"
  ON public.oraciones_por_peticion FOR INSERT
  WITH CHECK (auth.uid() = usuario_id);

-- DELETE: Not allowed (lifetime uniqueness — no un-praying)

-- ─── actualizaciones_peticion policies ───

-- SELECT: Owner can see own updates; group members can see updates on group petitions
CREATE POLICY "Petition owner can view updates"
  ON public.actualizaciones_peticion FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.peticiones_oracion
      WHERE id = actualizaciones_peticion.peticion_id AND usuario_id = auth.uid()
    )
  );

CREATE POLICY "Group members can view updates on group petitions"
  ON public.actualizaciones_peticion FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.peticiones_oracion p
      JOIN public.miembros_grupo mg ON mg.grupo_id = p.grupo_id
      WHERE p.id = actualizaciones_peticion.peticion_id
        AND p.visibilidad = 'group'
        AND mg.usuario_id = auth.uid()
    )
  );

-- INSERT: Only petition creator can add updates
CREATE POLICY "Petition creator can add updates"
  ON public.actualizaciones_peticion FOR INSERT
  WITH CHECK (
    auth.uid() = usuario_id
    AND EXISTS (
      SELECT 1 FROM public.peticiones_oracion
      WHERE id = actualizaciones_peticion.peticion_id AND usuario_id = auth.uid()
    )
  );

-- ══════════════════════════════════════════════════════════════════════
-- 8. REALTIME
-- ══════════════════════════════════════════════════════════════════════

-- Enable Realtime for peticiones_oracion (new petitions appear in community wall)
ALTER PUBLICATION supabase_realtime ADD TABLE public.peticiones_oracion;
ALTER TABLE public.peticiones_oracion REPLICA IDENTITY FULL;

-- ══════════════════════════════════════════════════════════════════════
-- 9. XP CONFIG INSERTS (default values)
-- ══════════════════════════════════════════════════════════════════════

-- These are global defaults (grupo_id = NULL). Groups can override.
-- Using INSERT with ON CONFLICT to avoid duplicates if migration is re-run.
INSERT INTO public.configuracion_app (clave, valor, grupo_id)
VALUES
  ('xp_intercesion', '5', '00000000-0000-0000-0000-000000000000'),
  ('xp_peticion_compartida', '10', '00000000-0000-0000-0000-000000000000'),
  ('xp_testimonio', '20', '00000000-0000-0000-0000-000000000000'),
  ('xp_intercesion_daily_cap', '50', '00000000-0000-0000-0000-000000000000')
ON CONFLICT (clave, grupo_id) DO NOTHING;

-- =====================================================
-- MIGRACIÓN COMPLETADA ✅
-- =====================================================
-- Cambios realizados:
-- ✅ 3 enums nuevos (categoria_peticion, estado_peticion, tipo_actualizacion)
-- ✅ 2 valores nuevos en tipo_actividad (peticion_compartida, peticion_respondida)
-- ✅ 3 tablas nuevas (peticiones_oracion, oraciones_por_peticion, actualizaciones_peticion)
-- ✅ Trigger para contador de oraciones (oraciones_count)
-- ✅ Trigger para auto-set grupo_id
-- ✅ RLS habilitado con políticas de seguridad
-- ✅ Realtime habilitado en peticiones_oracion
-- ✅ XP config defaults insertados
-- ✅ Solo cambios aditivos — sin DROP, DELETE ni TRUNCATE
-- =====================================================
