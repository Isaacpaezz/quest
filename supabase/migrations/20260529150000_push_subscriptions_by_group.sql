-- RPC para obtener suscripciones push de miembros de un grupo específico
-- SECURITY DEFINER para bypass RLS (igual que get_all_push_subscriptions)
-- JOIN con miembros_grupo para filtrar por grupo_id

create or replace function public.get_group_push_subscriptions(p_grupo_id uuid)
returns table (subscription jsonb, usuario_id uuid)
security definer
set search_path = public
language sql
stable
as $$
  select s.subscription, s.usuario_id
  from public.suscripciones_push s
  inner join public.miembros_grupo mg on mg.usuario_id = s.usuario_id
  where mg.grupo_id = p_grupo_id;
$$;

-- Permisos: solo roles autenticados
revoke all on function public.get_group_push_subscriptions(uuid) from public;
grant execute on function public.get_group_push_subscriptions(uuid) to authenticated;

comment on function public.get_group_push_subscriptions(uuid) is 'Devuelve suscripciones push de miembros de un grupo específico. SECURITY DEFINER para bypass RLS.';
