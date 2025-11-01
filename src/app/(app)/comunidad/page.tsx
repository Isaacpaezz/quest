import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CommunityClient } from './_components/community-client'
import { Tables } from '@/types/database'
import { CommunityMember } from '@/types/definitions'
import { getTodayInVenezuela } from '@/lib/utils'

export default async function CommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = getTodayInVenezuela()

  // Obtener todos los datos en paralelo, incluyendo rachas
  const [profilesRes, progressTodayRes, penaltiesRes, streaksRes] = await Promise.all([
    supabase.from('perfiles').select('*'),
    supabase.from('progreso_usuario').select('*').eq('fecha_progreso', today),
    supabase.from('penalizaciones').select('*').eq('estado', 'pendiente'),
    supabase.rpc('get_all_user_streaks'), // Obtener rachas de todos los usuarios
  ])

  const pendingPenalties = penaltiesRes.data as Tables<'penalizaciones'>[] || []
  const streaksData = streaksRes.data || []
  
  const penaltyDates = pendingPenalties.map(p => p.fecha_incumplimiento);
  const penaltyUserIds = pendingPenalties.map(p => p.usuario_id);
  
  const { data: historicProgressData } = await supabase
    .from('progreso_usuario')
    .select('*')
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

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Progreso</h1>
        <p className="text-muted-foreground">Crecemos, con transparencia y apoyo.</p>
      </header>
      <CommunityClient communityData={communityData} />
    </div>
  )
}
