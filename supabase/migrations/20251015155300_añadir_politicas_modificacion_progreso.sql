-- Esta política permite a los usuarios realizar CUALQUIER acción (INSERT, UPDATE, DELETE)
-- sobre una fila de la tabla 'progreso_usuario' si y solo si el 'usuario_id' de esa
-- fila coincide con su propio ID de autenticación.

CREATE POLICY "Los usuarios pueden crear y actualizar su propio progreso"
ON public.progreso_usuario FOR ALL -- 'ALL' cubre INSERT, UPDATE, y DELETE
TO authenticated
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

-- La cláusula 'USING' se aplica a las filas existentes (para SELECT, UPDATE, DELETE).
-- La cláusula 'WITH CHECK' se aplica a las nuevas filas (para INSERT, UPDATE).
-- Usar ambas con la misma condición es la forma más segura de definir la propiedad.
