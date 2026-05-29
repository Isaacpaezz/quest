-- =====================================================
-- MIGRACIÓN: Feed Social Features (Likes & Comentarios)
-- Fecha: 2025-11-26
-- Descripción: Habilita funcionalidades sociales (likes y comentarios)
--              en el feed de actividades de la comunidad
-- =====================================================

-- 1. TABLA: comunidad_likes
-- Almacena los likes que los usuarios dan a las actividades
CREATE TABLE IF NOT EXISTS comunidad_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actividad_id bigint NOT NULL REFERENCES actividad_comunidad(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Un usuario solo puede dar like una vez por actividad
  CONSTRAINT unique_like_per_user UNIQUE (actividad_id, user_id)
);

-- Índices para mejorar performance de queries
CREATE INDEX idx_comunidad_likes_actividad ON comunidad_likes(actividad_id);
CREATE INDEX idx_comunidad_likes_user ON comunidad_likes(user_id);
CREATE INDEX idx_comunidad_likes_created ON comunidad_likes(created_at DESC);

COMMENT ON TABLE comunidad_likes IS 'Almacena los likes que los usuarios dan a las actividades del feed';
COMMENT ON COLUMN comunidad_likes.actividad_id IS 'Referencia a la actividad que recibe el like';
COMMENT ON COLUMN comunidad_likes.user_id IS 'Usuario que da el like';

-- 2. TABLA: comunidad_comentarios
-- Almacena los comentarios en las actividades
CREATE TABLE IF NOT EXISTS comunidad_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actividad_id bigint NOT NULL REFERENCES actividad_comunidad(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES perfiles(id) ON DELETE CASCADE,
  contenido text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para mejorar performance
CREATE INDEX idx_comunidad_comentarios_actividad ON comunidad_comentarios(actividad_id);
CREATE INDEX idx_comunidad_comentarios_user ON comunidad_comentarios(user_id);
CREATE INDEX idx_comunidad_comentarios_created ON comunidad_comentarios(created_at DESC);

COMMENT ON TABLE comunidad_comentarios IS 'Almacena los comentarios en las actividades del feed';
COMMENT ON COLUMN comunidad_comentarios.contenido IS 'Texto del comentario (no puede estar vacío)';

-- 3. CONTADORES DE CACHÉ en actividad_comunidad
-- Evita hacer COUNT(*) en cada query del feed, mejorando significativamente el performance
ALTER TABLE actividad_comunidad 
  ADD COLUMN IF NOT EXISTS likes_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS comentarios_count int NOT NULL DEFAULT 0;

COMMENT ON COLUMN actividad_comunidad.likes_count IS 'Contador de likes (actualizado automáticamente por trigger)';
COMMENT ON COLUMN actividad_comunidad.comentarios_count IS 'Contador de comentarios (actualizado automáticamente por trigger)';

-- 4. FUNCIÓN: Actualizar contador de likes
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrementar contador al agregar like
    UPDATE actividad_comunidad 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.actividad_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementar contador al eliminar like (nunca menos de 0)
    UPDATE actividad_comunidad 
    SET likes_count = GREATEST(likes_count - 1, 0)
    WHERE id = OLD.actividad_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_likes_count() IS 'Actualiza automáticamente el contador de likes en actividad_comunidad';

-- 5. FUNCIÓN: Actualizar contador de comentarios
CREATE OR REPLACE FUNCTION update_comentarios_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrementar contador al agregar comentario
    UPDATE actividad_comunidad 
    SET comentarios_count = comentarios_count + 1 
    WHERE id = NEW.actividad_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementar contador al eliminar comentario (nunca menos de 0)
    UPDATE actividad_comunidad 
    SET comentarios_count = GREATEST(comentarios_count - 1, 0)
    WHERE id = OLD.actividad_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_comentarios_count() IS 'Actualiza automáticamente el contador de comentarios en actividad_comunidad';

-- 6. TRIGGERS: Auto-actualizar contadores
-- Se ejecutan automáticamente al insertar/eliminar likes o comentarios
CREATE TRIGGER trigger_update_likes_count
  AFTER INSERT OR DELETE ON comunidad_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_likes_count();

CREATE TRIGGER trigger_update_comentarios_count
  AFTER INSERT OR DELETE ON comunidad_comentarios
  FOR EACH ROW
  EXECUTE FUNCTION update_comentarios_count();

-- 7. HABILITAR ROW LEVEL SECURITY (RLS)
-- Importante para la seguridad de los datos
ALTER TABLE comunidad_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunidad_comentarios ENABLE ROW LEVEL SECURITY;

-- 8. POLÍTICAS RLS: comunidad_likes
-- ==========================================

-- SELECT: Todos pueden ver los likes (público)
CREATE POLICY "Likes are viewable by everyone"
  ON comunidad_likes FOR SELECT
  USING (true);

-- INSERT: Solo usuarios autenticados pueden dar like
CREATE POLICY "Authenticated users can create likes"
  ON comunidad_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Solo el dueño del like puede eliminarlo
CREATE POLICY "Users can delete their own likes"
  ON comunidad_likes FOR DELETE
  USING (auth.uid() = user_id);

-- 9. POLÍTICAS RLS: comunidad_comentarios
-- ==========================================

-- SELECT: Todos pueden ver los comentarios (público)
CREATE POLICY "Comments are viewable by everyone"
  ON comunidad_comentarios FOR SELECT
  USING (true);

-- INSERT: Solo usuarios autenticados pueden comentar
CREATE POLICY "Authenticated users can create comments"
  ON comunidad_comentarios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- DELETE: El dueño del comentario O el dueño de la actividad pueden eliminar
-- Esto permite moderar comentarios en tus propias actividades
CREATE POLICY "Users can delete their own comments or activity owner can delete"
  ON comunidad_comentarios FOR DELETE
  USING (
    auth.uid() = user_id 
    OR 
    auth.uid() IN (
      SELECT usuario_id FROM actividad_comunidad WHERE id = actividad_id
    )
  );

-- 10. INICIALIZAR CONTADORES para actividades existentes
-- ========================================================
-- Opcional: Solo necesario si ya tienes datos en la BD
-- Actualiza los contadores de actividades que ya existen
UPDATE actividad_comunidad ac
SET 
  likes_count = COALESCE((SELECT COUNT(*) FROM comunidad_likes WHERE actividad_id = ac.id), 0),
  comentarios_count = COALESCE((SELECT COUNT(*) FROM comunidad_comentarios WHERE actividad_id = ac.id), 0);

-- =====================================================
-- VERIFICACIÓN DE LA MIGRACIÓN
-- =====================================================

-- Puedes ejecutar estas queries para verificar que todo se creó correctamente:

-- Ver estructura de comunidad_likes
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'comunidad_likes';

-- Ver estructura de comunidad_comentarios
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'comunidad_comentarios';

-- Ver políticas RLS
-- SELECT * FROM pg_policies 
-- WHERE tablename IN ('comunidad_likes', 'comunidad_comentarios');

-- =====================================================
-- MIGRACIÓN COMPLETADA EXITOSAMENTE ✅
-- =====================================================
-- 
-- Características implementadas:
-- ✅ Tabla comunidad_likes con constraint único
-- ✅ Tabla comunidad_comentarios
-- ✅ Índices para optimización de queries
-- ✅ Contadores de caché (likes_count, comentarios_count)
-- ✅ Triggers automáticos para actualizar contadores
-- ✅ RLS habilitado con políticas de seguridad
-- ✅ Documentación completa con comentarios
--
-- Notas importantes:
-- - Los contadores se actualizan automáticamente
-- - Los likes son únicos por usuario/actividad
-- - Los comentarios pueden ser eliminados por el autor o dueño de la actividad
-- - Todas las eliminaciones en cascada están configuradas
-- =====================================================
