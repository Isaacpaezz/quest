-- Fix: get_group_push_subscriptions debe verificar que el caller sea miembro del grupo
-- Antes, cualquier usuario autenticado podía consultar suscripciones push de cualquier grupo

drop function if exists public.get_group_push_subscriptions(uuid);

create or replace function public.get_group_push_subscriptions(p_grupo_id uuid)
returns table (subscription jsonb, usuario_id uuid)
security definer
set search_path = public
language sql
stable
as $$
  -- Verificar que el caller sea miembro del grupo
  select s.subscription, s.usuario_id
  from public.suscripciones_push s
  inner join public.miembros_grupo mg on mg.usuario_id = s.usuario_id
  where mg.grupo_id = p_grupo_id
    and exists (
      select 1 from public.miembros_grupo
      where usuario_id = auth.uid() and grupo_id = p_grupo_id
    );
$$;

-- Permisos: solo roles autenticados
revoke all on function public.get_group_push_subscriptions(uuid) from public;
grant execute on function public.get_group_push_subscriptions(uuid) to authenticated;

comment on function public.get_group_push_subscriptions(uuid) is 'Devuelve suscripciones push de miembros de un grupo específico. Solo miembros del grupo pueden ejecutarla.';
