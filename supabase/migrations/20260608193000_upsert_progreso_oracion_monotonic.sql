create or replace function public.upsert_progreso_oracion_monotonic(
  p_usuario_id uuid,
  p_fecha_progreso date,
  p_capitulo_id bigint,
  p_segundos_oracion_acumulados integer,
  p_oracion_completada boolean,
  p_oracion_completada_en timestamptz default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null or auth.uid() <> p_usuario_id then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  insert into public.progreso_usuario (
    usuario_id,
    fecha_progreso,
    capitulo_id,
    segundos_oracion_acumulados,
    oracion_completada,
    oracion_completada_en
  ) values (
    p_usuario_id,
    p_fecha_progreso,
    p_capitulo_id,
    greatest(p_segundos_oracion_acumulados, 0),
    p_oracion_completada,
    case when p_oracion_completada then coalesce(p_oracion_completada_en, now()) else null end
  )
  on conflict (usuario_id, fecha_progreso)
  do update set
    capitulo_id = excluded.capitulo_id,
    segundos_oracion_acumulados = greatest(
      public.progreso_usuario.segundos_oracion_acumulados,
      excluded.segundos_oracion_acumulados
    ),
    oracion_completada = public.progreso_usuario.oracion_completada or excluded.oracion_completada,
    oracion_completada_en = coalesce(
      public.progreso_usuario.oracion_completada_en,
      case when excluded.oracion_completada then excluded.oracion_completada_en else null end
    );
end;
$$;

revoke all on function public.upsert_progreso_oracion_monotonic(uuid, date, bigint, integer, boolean, timestamptz) from public;
grant execute on function public.upsert_progreso_oracion_monotonic(uuid, date, bigint, integer, boolean, timestamptz) to authenticated;
