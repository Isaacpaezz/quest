-- Esta política permite a un usuario autenticado insertar una fila
-- en la tabla de actividad, siempre y cuando esté reclamando esa
-- actividad para sí mismo (el usuario_id de la nueva fila debe ser su propio id).
CREATE POLICY "Los usuarios pueden crear sus propias actividades"
ON public.actividad_comunidad FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = usuario_id);
