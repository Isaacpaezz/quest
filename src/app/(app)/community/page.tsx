import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CommunityClient } from './_components/community-client'
import { Tables } from '@/types/database'
import { CommunityMember } from '@/types/definitions'
import { getToday } from '@/lib/utils'
import { getMiembrosGrupoActivo, getTimezone } from '@/lib/grupo-helpers'

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

  // Obtener todos los datos en paralelo, incluyendo rachas — filtrado por grupo
  const [profilesRes, progressTodayRes, penaltiesRes, streaksRes] = await Promise.all([
    supabase.from('perfiles').select('id, nombre_usuario, xp, nivel, max_streak, rol, creado_en, grupo_activo_id').in('id', miembros),
    supabase.from('progreso_usuario').select('usuario_id, fecha_progreso, lectura_completada, oracion_completada, segundos_oracion_acumulados').eq('fecha_progreso', today),
    supabase.from('penalizaciones').select('id, usuario_id, fecha_incumplimiento, monto, monto_pagado, estado').eq('estado', 'pendiente'),
    supabase.rpc('get_all_user_streaks'), // Obtener rachas de todos los usuarios
  ])

  const pendingPenalties = penaltiesRes.data as Tables<'penalizaciones'>[] || []
  const streaksData = streaksRes.data || []

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
    const userStreak = streaksData.find((s: { user_id: string }) => s.user_id === profile.id)

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
      progresoHoy: {
        lectura_completada: todayProgress?.lectura_completada || false,
        oracion_completada: todayProgress?.oracion_completada || false,
      },
      streak: userStreak?.streak_count || 0, // Añadir racha del usuario
      deuda: {
        total: totalDeuda,
        dias_pendientes: enrichedPenalties.length,
        penalizaciones: enrichedPenalties
      }
    }
  })
  // Compute the all-time highest streak from perfiles.max_streak
  const allProfiles = profilesRes.data || []
  const bestProfile = allProfiles.reduce((best: typeof allProfiles[0] | null, p) => {
    if (!best || (p.max_streak || 0) > (best.max_streak || 0)) return p
    return best
  }, null)

  let highestStreak: { nombre_usuario: string; streak: number } | null = null
  if (bestProfile && (bestProfile.max_streak || 0) > 0) {
    highestStreak = {
      nombre_usuario: bestProfile.nombre_usuario,
      streak: bestProfile.max_streak || 0,
    }
  }

  return (
    <div>
      <CommunityClient communityData={communityData} highestStreak={highestStreak} nombreGrupo={nombreGrupo} />
    </div>
  )
}
