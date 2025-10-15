-- Función RPC para crear un perfil de usuario con privilegios de administrador
-- Esta función ignora las políticas RLS y puede crear perfiles directamente
CREATE OR REPLACE FUNCTION public.admin_crear_perfil(
  user_id UUID,
  username TEXT,
  user_role TEXT DEFAULT 'admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Verificar si el perfil ya existe
  IF EXISTS (SELECT 1 FROM public.perfiles WHERE id = user_id) THEN
    UPDATE public.perfiles
    SET rol = user_role
    WHERE id = user_id
    RETURNING to_jsonb(perfiles.*) INTO result;
    
    RETURN jsonb_build_object(
      'success', true,
      'action', 'updated',
      'profile', result
    );
  ELSE
    -- Insertar nuevo perfil
    INSERT INTO public.perfiles (id, nombre_usuario, rol, creado_en)
    VALUES (user_id, username, user_role, now())
    RETURNING to_jsonb(perfiles.*) INTO result;
    
    RETURN jsonb_build_object(
      'success', true,
      'action', 'created',
      'profile', result
    );
  END IF;
EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Función RPC para actualizar el rol de un usuario con privilegios de administrador
CREATE OR REPLACE FUNCTION public.admin_actualizar_rol(
  user_id UUID,
  user_role TEXT DEFAULT 'admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Actualizar el rol del usuario
  UPDATE public.perfiles
  SET rol = user_role
  WHERE id = user_id
  RETURNING to_jsonb(perfiles.*) INTO result;
  
  IF result IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Perfil no encontrado',
      'user_id', user_id
    );
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'profile', result
  );
EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Crear políticas RLS básicas para la tabla perfiles
-- Permitir a los usuarios ver y actualizar su propio perfil
DROP POLICY IF EXISTS "Los usuarios pueden ver su propio perfil" ON public.perfiles;
CREATE POLICY "Los usuarios pueden ver su propio perfil"
  ON public.perfiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Los usuarios pueden actualizar su propio perfil" ON public.perfiles;
CREATE POLICY "Los usuarios pueden actualizar su propio perfil"
  ON public.perfiles
  FOR UPDATE
  USING (auth.uid() = id);

-- Permitir a los administradores ver todos los perfiles
DROP POLICY IF EXISTS "Los administradores pueden ver todos los perfiles" ON public.perfiles;
CREATE POLICY "Los administradores pueden ver todos los perfiles"
  ON public.perfiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.perfiles
      WHERE id = auth.uid() AND rol = 'admin'
    )
  );
