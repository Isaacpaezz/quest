import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CommunityClient } from './_components/community-client'

export default async function CommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  // Obtener todos los datos en paralelo
  const [profilesRes, progressTodayRes, penaltiesRes] = await Promise.all([
    supabase.from('perfiles').select('*'),
    supabase.from('progreso_usuario').select('*').eq('fecha_progreso', today),
    supabase.from('penalizaciones').select('*').eq('estado', 'pendiente'),
  ])

  const pendingPenalties = penaltiesRes.data || []
  
  // NUEVO: Obtener los registros de progreso correspondientes a los días de penalización
  const penaltyDates = pendingPenalties.map(p => p.fecha_incumplimiento);
  const penaltyUserIds = pendingPenalties.map(p => p.usuario_id);
  
  const { data: historicProgressData } = await supabase
    .from('progreso_usuario')
    .select('*')
    .in('fecha_progreso', penaltyDates)
    .in('usuario_id', penaltyUserIds)

  // Combinar los datos en el servidor
  const communityData = (profilesRes.data || []).map((profile: any) => {
    const todayProgress = progressTodayRes.data?.find((p: any) => p.usuario_id === profile.id)
    const userPenalties = pendingPenalties.filter((p: any) => p.usuario_id === profile.id)

    // Enriquecer cada penalización con su motivo
    const enrichedPenalties = userPenalties.map((penalty: any) => {
      const progressRecord = historicProgressData?.find((hp: any) => 
        hp.usuario_id === penalty.usuario_id && hp.fecha_progreso === penalty.fecha_incumplimiento
      )
      
      let motivo = 'Ambas tareas'
      if (progressRecord) {
        if (!progressRecord.lectura_completada && progressRecord.oracion_completada) {
          motivo = 'Lectura'
        } else if (progressRecord.lectura_completada && !progressRecord.oracion_completada) {
          motivo = 'Oración'
        }
      }
      return { ...penalty, motivo }
    })

    const totalDeuda = enrichedPenalties.reduce((acc: any, p: any) => acc + (parseFloat(p.monto) - parseFloat(p.monto_pagado || '0')), 0)

    return {
      ...profile,
      progresoHoy: {
        lectura_completada: todayProgress?.lectura_completada || false,
        oracion_completada: todayProgress?.oracion_completada || false,
      },
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
        <h1 className="text-3xl font-bold text-foreground">Pulso de la Comunidad</h1>
        <p className="text-muted-foreground">Aquí seguimos juntos nuestra senda, con transparencia y apoyo mutuo.</p>
      </header>
      <CommunityClient communityData={communityData} />
    </div>
  )
}
