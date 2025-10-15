-- Eliminar todas las políticas existentes para empezar de cero
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON public.perfiles;
DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON public.perfiles;
DROP POLICY IF EXISTS "Los administradores pueden ver todos los perfiles" ON public.perfiles;

-- Política simple: Los usuarios pueden ver su propio perfil
CREATE POLICY "Los usuarios pueden ver su propio perfil"
  ON public.perfiles
  FOR SELECT
  USING (auth.uid() = id);

-- Política simple: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON public.perfiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Política para insertar: Solo las funciones con SECURITY DEFINER pueden insertar
-- Esto evita que usuarios normales creen perfiles manualmente
CREATE POLICY "Solo funciones seguras pueden insertar perfiles"
  ON public.perfiles
  FOR INSERT
  WITH CHECK (false); -- Nadie puede insertar directamente, solo a través de funciones RPC

-- Nota: Los administradores pueden ver todos los perfiles a través de la función RPC
-- que tiene SECURITY DEFINER y no está sujeta a las políticas RLS
