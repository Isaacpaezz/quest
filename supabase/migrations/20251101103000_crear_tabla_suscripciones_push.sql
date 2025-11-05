-- Crear la tabla para almacenar la información de suscripción push de cada usuario.
-- El campo 'subscription' es de tipo JSONB para almacenar el objeto que nos da el navegador.
-- Se establece una restricción UNIQUE en 'usuario_id' para asegurar que cada usuario
-- solo pueda tener una suscripción activa a la vez.
CREATE TABLE public.suscripciones_push (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL UNIQUE REFERENCES public.perfiles(id) ON DELETE CASCADE,
  subscription jsonb NOT NULL,
  creado_en timestamptz NOT NULL DEFAULT now()
);

-- Habilitar la Seguridad a Nivel de Fila (RLS) en la nueva tabla.
ALTER TABLE public.suscripciones_push ENABLE ROW LEVEL SECURITY;

-- Crear políticas de seguridad:
-- Esta política permite a un usuario crear, leer, actualizar o eliminar
-- SU PROPIA fila de suscripción, pero no la de nadie más.
-- Esto es crucial para la seguridad y la privacidad.
CREATE POLICY "Los usuarios pueden gestionar su propia suscripción"
ON public.suscripciones_push FOR ALL -- 'ALL' cubre INSERT, SELECT, UPDATE, DELETE
TO authenticated
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);
