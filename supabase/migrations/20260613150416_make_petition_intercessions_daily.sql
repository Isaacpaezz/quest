-- Prayer petition intercessions are daily: a user may pray once per petition per app day.

ALTER TABLE public.oraciones_por_peticion
  ADD COLUMN IF NOT EXISTS fecha_oracion date;

UPDATE public.oraciones_por_peticion
SET fecha_oracion = (creado_en AT TIME ZONE 'America/Caracas')::date
WHERE fecha_oracion IS NULL;

ALTER TABLE public.oraciones_por_peticion
  ALTER COLUMN fecha_oracion SET NOT NULL,
  ALTER COLUMN fecha_oracion SET DEFAULT ((now() AT TIME ZONE 'America/Caracas')::date);

ALTER TABLE public.oraciones_por_peticion
  DROP CONSTRAINT IF EXISTS oraciones_por_peticion_unica;

ALTER TABLE public.oraciones_por_peticion
  ADD CONSTRAINT oraciones_por_peticion_unica
  UNIQUE (peticion_id, usuario_id, fecha_oracion);

COMMENT ON TABLE public.oraciones_por_peticion IS 'Intercesiones: cada usuario puede orar una vez por petición por día';
COMMENT ON COLUMN public.oraciones_por_peticion.fecha_oracion IS 'App/group calendar date when the intercession was recorded';

CREATE INDEX IF NOT EXISTS idx_oraciones_por_peticion_usuario_fecha
  ON public.oraciones_por_peticion(usuario_id, fecha_oracion DESC);

CREATE INDEX IF NOT EXISTS idx_oraciones_por_peticion_peticion_fecha
  ON public.oraciones_por_peticion(peticion_id, fecha_oracion DESC);
