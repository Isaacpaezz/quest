-- Add cached AI-guided prayer text for community petitions.
-- Additive only: no data deletion, object drops, or destructive changes.

alter table public.peticiones_oracion
  add column if not exists oracion_guia text,
  add column if not exists oracion_guia_generada_en timestamptz,
  add column if not exists oracion_guia_context_hash text;

comment on column public.peticiones_oracion.oracion_guia is
  'Cached guided prayer text generated from petition context.';

comment on column public.peticiones_oracion.oracion_guia_generada_en is
  'Timestamp when the cached guided prayer was generated.';

comment on column public.peticiones_oracion.oracion_guia_context_hash is
  'Hash of title, description, category, and updates used for cache invalidation.';
