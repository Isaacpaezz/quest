-- Crear el tipo ENUM para el estado de los planes
CREATE TYPE plan_estado AS ENUM ('inactivo', 'activo', 'proximo');

-- Eliminar la columna booleana esta_activo
ALTER TABLE public.planes_lectura DROP COLUMN IF EXISTS esta_activo;

-- Añadir la nueva columna estado con el tipo ENUM
ALTER TABLE public.planes_lectura 
ADD COLUMN estado plan_estado NOT NULL DEFAULT 'inactivo';
