import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CommunityClient } from './_components/community-client'
import { Tables } from '@/types/database'
import { CommunityMember } from '@/types/definitions'
import { getToday } from '@/lib/utils'
import { getMiembrosGrupoActivo, getTimezone, getDiasLibres, getDatesWithoutPlan } from '@/lib/grupo-helpers'
import { calculateStreak } from '@/lib/streak'

export default async function CommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const tz = await getTimezone(supabase)
  const today = getToday(tz)

  // Obtener miembros del grupo activo para scoping
  const { miembros, grupoId } = await getMiembrosGrupoActivo(supabase)

  // Obtener nombre del grupo activo
  let nombreGrupo = 'Mi Comunidad'
  if (grupoId) {
    const { data: grupo } = await supabase.from('grupos').select('nombre').eq('id', grupoId).single()
    if (grupo) nombreGrupo = grupo.nombre
  }

  // Obtener todos los datos en paralelo — rachas scoped al grupo activo
  const [profilesRes, miembrosXpRes, progressTodayRes, penaltiesRes, streakProgressRes] = await Promise.all([
    supabase.from('perfiles').select('id, nombre_usuario, xp, nivel, max_streak, rol, creado_en, grupo_activo_id').in('id', miembros),
    grupoId
      ? supabase.from('miembros_grupo').select('usuario_id, xp, nivel').eq('grupo_id', grupoId)
      : Promise.resolve({ data: null }),
    supabase.from('progreso_usuario').select('usuario_id, fecha_progreso, lectura_completada, oracion_completada, segundos_oracion_acumulados').eq('fecha_progreso', today),
    supabase.from('penalizaciones').select('id, usuario_id, fecha_incumplimiento, monto, monto_pagado, estado').eq('estado', 'pendiente'),
    // Group-scoped progress for streak calculation (via capitulos_diarios → planes_lectura)
    grupoId
      ? supabase
        .from('progreso_usuario')
        .select('usuario_id, fecha_progreso, lectura_completada, oracion_completada, capitulos_diarios!inner(planes_lectura!inner(grupo_id))')
        .in('usuario_id', miembros)
        .eq('capitulos_diarios.planes_lectura.grupo_id', grupoId)
        .order('fecha_progreso', { ascending: false })
      : supabase
        .from('progreso_usuario')
        .select('usuario_id, fecha_progreso, lectura_completada, oracion_completada')
        .in('usuario_id', miembros)
        .order('fecha_progreso', { ascending: false }),
  ])

  // Build a map of group XP per user (use group XP for rankings, not global)
  const miembrosXpMap = new Map<string, { xp: number; nivel: number }>()
  if (miembrosXpRes?.data) {
    for (const m of miembrosXpRes.data) {
      if (m.usuario_id) miembrosXpMap.set(m.usuario_id, { xp: m.xp, nivel: m.nivel })
    }
  }

  const pendingPenalties = penaltiesRes.data as Tables<'penalizaciones'>[] || []
  const streakProgress = streakProgressRes.data ?? []

  // Calculate group-scoped streaks using shared utility
  const diasLibres = await getDiasLibres(supabase, grupoId)
  const excludedDates = await getDatesWithoutPlan(supabase, today, grupoId)
  const streakMap: Record<string, number> = {}
  for (const uid of miembros) {
    const userProgress = streakProgress.filter(p => p.usuario_id === uid)
    streakMap[uid] = calculateStreak(userProgress, today, diasLibres, excludedDates)
  }

  const penaltyDates = pendingPenalties.map(p => p.fecha_incumplimiento);
  const penaltyUserIds = pendingPenalties.map(p => p.usuario_id);

  const { data: historicProgressData } = await supabase
    .from('progreso_usuario')
    .select('usuario_id, fecha_progreso, lectura_completada, oracion_completada')
    .in('fecha_progreso', penaltyDates)
    .in('usuario_id', penaltyUserIds)

  const communityData: CommunityMember[] = (profilesRes.data || []).map((profile): CommunityMember => {
    const todayProgress = (progressTodayRes.data || []).find(p => p.usuario_id === profile.id)
    const userPenalties = pendingPenalties.filter(p => p.usuario_id === profile.id)
    const userStreak = streakMap[profile.id] ?? 0

    const enrichedPenalties = userPenalties.map(penalty => {
      const progressRecord = (historicProgressData || []).find(hp =>
        hp.usuario_id === penalty.usuario_id && hp.fecha_progreso === penalty.fecha_incumplimiento
      )

      let motivo = 'Ambas tareas'
      if (progressRecord) {
        if (!progressRecord.lectura_completada && progressRecord.oracion_completada) motivo = 'Lectura'
        else if (progressRecord.lectura_completada && !progressRecord.oracion_completada) motivo = 'Oración'
      }
      return { ...penalty, motivo }
    })

    const totalDeuda = enrichedPenalties.reduce((acc, p) => acc + (p.monto - (p.monto_pagado || 0)), 0)

    return {
      ...profile,
      // Override with group-specific XP for rankings (fall back to global if no group data)
      xp: miembrosXpMap.get(profile.id)?.xp ?? profile.xp,
      nivel: miembrosXpMap.get(profile.id)?.nivel ?? profile.nivel,
      progresoHoy: {
        lectura_completada: todayProgress?.lectura_completada || false,
        oracion_completada: todayProgress?.oracion_completada || false,
      },
      streak: userStreak, // Group-scoped streak
      deuda: {
        total: totalDeuda,
        dias_pendientes: enrichedPenalties.length,
        penalizaciones: enrichedPenalties
      }
    }
  })
  // Compute the all-time highest streak from miembros_grupo.max_streak (per-group)
  const { data: miembrosMaxStreak } = grupoId
    ? await supabase.from('miembros_grupo').select('usuario_id, max_streak').eq('grupo_id', grupoId)
    : { data: null }

  const allProfiles = profilesRes.data || []
  const profileMap = new Map(allProfiles.map(p => [p.id, p]))

  let highestStreak: { nombre_usuario: string; streak: number } | null = null
  for (const m of miembrosMaxStreak || []) {
    if ((m.max_streak || 0) > (highestStreak?.streak || 0)) {
      const profile = profileMap.get(m.usuario_id!)
      if (profile) {
        highestStreak = { nombre_usuario: profile.nombre_usuario, streak: m.max_streak || 0 }
      }
    }
  }

  return (
    <div>
      <CommunityClient communityData={communityData} highestStreak={highestStreak} nombreGrupo={nombreGrupo} />
    </div>
  )
}
