CREATE TYPE capitulo_diario_type AS (
  fecha_lectura date,
  referencia_capitulo text
);

CREATE OR REPLACE FUNCTION public.crear_plan_con_capitulos(
  nombre_libro_param text,
  fecha_inicio_param timestamptz,
  fecha_fin_param timestamptz,
  minutos_oracion_requeridos_param integer,
  capitulos_param jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  nuevo_plan_id bigint;
  capitulo capitulo_diario_type;
BEGIN
  -- Insertar el nuevo plan y obtener su ID
  INSERT INTO public.planes_lectura (nombre_libro, fecha_inicio, fecha_fin, minutos_oracion_requeridos)
  VALUES (nombre_libro_param, fecha_inicio_param, fecha_fin_param, minutos_oracion_requeridos_param)
  RETURNING id INTO nuevo_plan_id;

  -- Insertar todos los capítulos diarios asociados con el nuevo plan_id
  INSERT INTO public.capitulos_diarios (plan_id, fecha_lectura, referencia_capitulo)
  SELECT
    nuevo_plan_id,
    (c->>'fecha_lectura')::date,
    c->>'referencia_capitulo'
  FROM jsonb_array_elements(capitulos_param) AS c;
END;
$$;
