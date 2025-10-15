-- Primero, eliminamos las políticas existentes para evitar errores.
DROP POLICY IF EXISTS "Los administradores pueden leer todos los perfiles" ON public.perfiles;
DROP POLICY IF EXISTS "Los administradores pueden leer todos los planes de lectura" ON public.planes_lectura;
DROP POLICY IF EXISTS "Los usuarios autenticados pueden leer los capítulos diarios" ON public.capitulos_diarios;
DROP POLICY IF EXISTS "Los usuarios pueden leer su propio progreso" ON public.progreso_usuario;
DROP POLICY IF EXISTS "Los administradores pueden leer todo el progreso" ON public.progreso_usuario;

-- --- NUEVO CONJUNTO DE POLÍTICAS ---

-- Política de la tabla 'perfiles'
-- Cualquiera que haya iniciado sesión puede ver la lista de todos los perfiles/usuarios.
CREATE POLICY "Los usuarios autenticados pueden ver todos los perfiles"
ON public.perfiles FOR SELECT
TO authenticated
USING (true);

-- Política de la tabla 'planes_lectura'
-- Cualquiera que haya iniciado sesión puede ver todos los planes de lectura.
-- ESTA ES LA REGLA QUE SOLUCIONARÁ TU PROBLEMA Y CUMPLE CON EL REQUISITO.
CREATE POLICY "Los usuarios autenticados pueden ver todos los planes de lectura"
ON public.planes_lectura FOR SELECT
TO authenticated
USING (true);

-- Política de la tabla 'capitulos_diarios'
-- Se mantiene igual, ya que es abierta para todos los usuarios logueados.
CREATE POLICY "Los usuarios autenticados pueden leer los capítulos diarios"
ON public.capitulos_diarios FOR SELECT
TO authenticated
USING (true);

-- Política de la tabla 'progreso_usuario'
-- ¡La regla clave! Cualquiera que haya iniciado sesión puede ver el progreso de TODOS los demás.
CREATE POLICY "Los usuarios autenticados pueden ver todo el progreso"
ON public.progreso_usuario FOR SELECT
TO authenticated
USING (true);

-- --- POLÍTICAS DE MODIFICACIÓN (INSERT, UPDATE, DELETE) ---
-- Por ahora, solo los administradores podrán modificar. Estas políticas son cruciales.

CREATE POLICY "Los administradores pueden crear, actualizar y eliminar planes"
ON public.planes_lectura FOR ALL -- Cubre INSERT, UPDATE, DELETE
TO authenticated
USING ((SELECT rol FROM public.perfiles WHERE id = auth.uid()) = 'admin')
WITH CHECK ((SELECT rol FROM public.perfiles WHERE id = auth.uid()) = 'admin');
