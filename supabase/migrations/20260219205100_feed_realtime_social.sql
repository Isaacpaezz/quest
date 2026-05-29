-- Sub-fase 3H: Feed Realtime + Social
-- 1. Reacciones múltiples en comunidad_likes
-- 2. Habilitar Realtime en actividad_comunidad
-- 3. Agregar 'victoria' al enum tipo_actividad

-- ══════════════════════════════════════════════════════════════════════
-- 1. REACCIONES MÚLTIPLES
-- ══════════════════════════════════════════════════════════════════════

-- Agregar columna tipo_reaccion para soportar múltiples tipos de reacciones
ALTER TABLE public.comunidad_likes 
  ADD COLUMN tipo_reaccion TEXT NOT NULL DEFAULT 'like'
  CHECK (tipo_reaccion IN ('like', 'prayer', 'fire', 'lightning'));

-- Actualizar constraint unique: ahora permite una reacción por tipo por usuario por actividad
ALTER TABLE public.comunidad_likes DROP CONSTRAINT unique_like_per_user;
ALTER TABLE public.comunidad_likes ADD CONSTRAINT unique_reaction_per_user 
  UNIQUE (actividad_id, user_id, tipo_reaccion);

-- ══════════════════════════════════════════════════════════════════════
-- 2. REALTIME
-- ══════════════════════════════════════════════════════════════════════

-- Habilitar Realtime para la tabla de actividades del feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.actividad_comunidad;

-- Replica identity FULL requerida para que Realtime envíe la fila completa
ALTER TABLE public.actividad_comunidad REPLICA IDENTITY FULL;

-- ══════════════════════════════════════════════════════════════════════
-- 3. VICTORIAS EN FEED
-- ══════════════════════════════════════════════════════════════════════

-- Agregar tipo 'victoria' para publicar logros al feed automáticamente
ALTER TYPE public.tipo_actividad ADD VALUE IF NOT EXISTS 'victoria';
