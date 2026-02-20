import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PenaltiesClient } from './_components/penalties-client'

export default async function PenaltiesManagementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('grupo_activo_id')
    .eq('id', user.id)
    .single()

  const grupoId = perfil?.grupo_activo_id
  if (!grupoId) redirect('/perfil')

  // Fetch penalties and group members in parallel
  const [penaltiesRes, membersRes] = await Promise.all([
    supabase
      .from('penalizaciones')
      .select(`id, monto, monto_pagado, perfiles!inner (id, nombre_usuario)`)
      .eq('estado', 'pendiente')
      .eq('grupo_id', grupoId),
    supabase
      .from('miembros_grupo')
      .select('usuario_id')
      .eq('grupo_id', grupoId),
  ])

  const penalties = penaltiesRes.data ?? []
  const memberIds = (membersRes.data ?? []).map(m => m.usuario_id).filter(Boolean) as string[]

  // Build debt summary per user
  const usersMap: Record<string, { usuario_id: string; nombre_usuario: string; dias_pendientes: number; deuda_total: number }> = {}
  for (const penalty of penalties) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const perfilData = (penalty as any).perfiles as { id: string; nombre_usuario: string } | null
    const userId = perfilData?.id
    if (!userId) continue
    if (!usersMap[userId]) {
      usersMap[userId] = {
        usuario_id: userId,
        nombre_usuario: perfilData?.nombre_usuario ?? 'Sin nombre',
        dias_pendientes: 0,
        deuda_total: 0,
      }
    }
    usersMap[userId].dias_pendientes += 1
    usersMap[userId].deuda_total += (Number(penalty.monto) - Number(penalty.monto_pagado || 0))
  }
  const usersWithDebt = Object.values(usersMap)

  // Fetch profiles for all group members (for the manual penalty dropdown)
  let allMembers: { id: string; nombre_usuario: string }[] = []
  if (memberIds.length > 0) {
    const { data: profiles } = await supabase
      .from('perfiles')
      .select('id, nombre_usuario')
      .in('id', memberIds)
    allMembers = (profiles ?? []).map(p => ({
      id: p.id,
      nombre_usuario: p.nombre_usuario ?? 'Sin nombre',
    }))
  }

  return <PenaltiesClient users={usersWithDebt} allMembers={allMembers} />
}
