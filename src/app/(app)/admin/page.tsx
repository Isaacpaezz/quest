import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminDashboardClient } from './_components/admin-dashboard-client'
import { getToday } from '@/lib/utils'
import { calculateStreak } from '@/lib/streak'
import { getDiasLibres, getDatesWithoutPlan, getTimezone } from '@/lib/grupo-helpers'

export default async function AdminDashboardPage() {
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

  // Fetch all needed data in parallel
  const [membersResult, planResult, debtsResult, membersData, grupoData] = await Promise.all([
    supabase.from('miembros_grupo').select('*', { count: 'exact', head: true }).eq('grupo_id', grupoId),
    supabase.from('planes_lectura').select('nombre_libro').eq('grupo_id', grupoId).eq('estado', 'activo').single(),
    (async () => {
      const { data } = await supabase
        .from('penalizaciones')
        .select('monto, monto_pagado')
        .eq('estado', 'pendiente')
        .eq('grupo_id', grupoId)
      const total = (data ?? []).reduce((sum, p) => sum + (Number(p.monto) - Number(p.monto_pagado || 0)), 0)
      return { total }
    })(),
    // Fetch full members for XP/racha stats + alerts
    supabase
      .from('miembros_grupo')
      .select('usuario_id, xp, nivel')
      .eq('grupo_id', grupoId),
    // Fetch grupo info for invite code
    supabase.from('grupos').select('codigo_invitacion').eq('id', grupoId).single(),
  ])

  // Calculate XP promedio
  const members = membersData.data ?? []
  const avgXp = members.length > 0
    ? Math.round(members.reduce((sum, m) => sum + (m.xp || 0), 0) / members.length)
    : 0

  // Calculate rachas: get streaks for all group members
  const memberIds = members.map(m => m.usuario_id).filter(Boolean) as string[]

  let avgStreak = 0
  type AlertItem = { type: 'streak_danger' | 'high_debt'; name: string; value: string }
  const alerts: AlertItem[] = []

  if (memberIds.length > 0) {
    // Get each member's streak and profiles
    const [profilesRes, progressRes, debtsPerUser] = await Promise.all([
      supabase.from('perfiles').select('id, nombre_usuario').in('id', memberIds),
      // Get progress scoped to THIS GROUP's plans via capitulos_diarios → planes_lectura
      supabase
        .from('progreso_usuario')
        .select('usuario_id, fecha_progreso, lectura_completada, oracion_completada, capitulos_diarios!inner(planes_lectura!inner(grupo_id))')
        .in('usuario_id', memberIds)
        .eq('capitulos_diarios.planes_lectura.grupo_id', grupoId)
        .order('fecha_progreso', { ascending: false }),
      // Get debts per user for alerts
      supabase
        .from('penalizaciones')
        .select('usuario_id, monto, monto_pagado')
        .eq('estado', 'pendiente')
        .eq('grupo_id', grupoId),
    ])

    const profiles = profilesRes.data ?? []
    const profileMap = Object.fromEntries(profiles.map(p => [p.id, p.nombre_usuario]))
    const progress = progressRes.data ?? []

    // Calculate streak per user (consecutive dates, skipping free days)
    const tz = await getTimezone(supabase)
    const today = getToday(tz)
    const diasLibres = await getDiasLibres(supabase, grupoId)
    const excludedDates = await getDatesWithoutPlan(supabase, today, grupoId)
    const streakMap: Record<string, number> = {}
    for (const uid of memberIds) {
      const userProgress = progress.filter(p => p.usuario_id === uid)
      streakMap[uid] = calculateStreak(userProgress, today, diasLibres, excludedDates, tz)
    }

    const streakValues = Object.values(streakMap)
    avgStreak = streakValues.length > 0
      ? Math.round(streakValues.reduce((a, b) => a + b, 0) / streakValues.length)
      : 0

    // Alerts: members with streak >=3 who haven't completed today
    for (const uid of memberIds) {
      const streak = streakMap[uid] || 0
      if (streak >= 3) {
        // Check if they haven't completed today
        const completedToday = progress.some(p => p.usuario_id === uid && p.fecha_progreso === today)
        if (!completedToday) {
          alerts.push({
            type: 'streak_danger',
            name: profileMap[uid] || 'Usuario',
            value: `${streak} días`,
          })
        }
      }
    }

    // Alerts: users with high debt
    const debtMap: Record<string, number> = {}
    for (const d of (debtsPerUser.data ?? [])) {
      const uid = d.usuario_id
      debtMap[uid] = (debtMap[uid] || 0) + (Number(d.monto) - Number(d.monto_pagado || 0))
    }
    for (const [uid, debt] of Object.entries(debtMap)) {
      if (debt >= 10) {
        alerts.push({
          type: 'high_debt',
          name: profileMap[uid] || 'Usuario',
          value: `$${debt.toFixed(2)}`,
        })
      }
    }
  }

  return (
    <AdminDashboardClient
      totalMembers={membersResult.count ?? 0}
      activePlan={planResult.data?.nombre_libro ?? 'Ninguno'}
      totalDebt={debtsResult.total}
      avgXp={avgXp}
      avgStreak={avgStreak}
      alerts={alerts}
      inviteCode={grupoData.data?.codigo_invitacion ?? null}
    />
  )
}
