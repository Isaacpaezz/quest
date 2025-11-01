-- Crear RPC para obtener todas las suscripciones push, ignorando RLS
-- Seguridad: SECURITY DEFINER para ejecutar con privilegios del propietario
-- Permisos: se otorga EXECUTE al rol 'authenticated'

create or replace function public.get_all_push_subscriptions()
returns table (subscription jsonb, usuario_id uuid)
security definer
set search_path = public
language sql
stable
as $$
  select s.subscription, s.usuario_id
  from public.suscripciones_push s;
$$;

-- Asegurar que solo roles autenticados puedan ejecutar
revoke all on function public.get_all_push_subscriptions() from public;
grant execute on function public.get_all_push_subscriptions() to authenticated;

comment on function public.get_all_push_subscriptions() is 'Devuelve todas las suscripciones push (subscription, usuario_id). SECURITY DEFINER para bypass RLS.';
