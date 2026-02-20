import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HistoryClient } from './_components/history-client'
import { getMiembrosGrupoActivo } from '@/lib/grupo-helpers'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { grupoId } = await getMiembrosGrupoActivo(supabase)

  // Fetch progress data AND reading plans in parallel
  let planesQuery = supabase
    .from('planes_lectura')
    .select('id, nombre_libro, fecha_inicio, fecha_fin, estado, minutos_oracion_requeridos, grupo_id')
    .order('fecha_fin', { ascending: false })

  if (grupoId) {
    planesQuery = planesQuery.eq('grupo_id', grupoId)
  }

  const [progressRes, planesRes, memberCountRes] = await Promise.all([
    supabase
      .from('progreso_usuario')
      .select('fecha_progreso, lectura_completada, oracion_completada')
      .eq('usuario_id', user.id)
      .order('fecha_progreso', { ascending: false }),
    planesQuery,
    grupoId
      ? supabase.from('miembros_grupo').select('*', { count: 'exact', head: true }).eq('grupo_id', grupoId)
      : Promise.resolve({ count: 1 }),
  ])

  const planes = planesRes.data || []
  const totalMiembros = memberCountRes.count ?? 1

  // For each plan, calculate community progress AND individual progress
  const planesConProgreso = await Promise.all(
    planes.map(async (plan) => {
      const [capRes, communityRes, individualRes] = await Promise.all([
        // Total chapters in the plan
        supabase
          .from('capitulos_diarios')
          .select('*', { count: 'exact', head: true })
          .eq('plan_id', plan.id),
        // Community: total completed reads across ALL members
        supabase
          .from('progreso_usuario')
          .select('*, capitulos_diarios!inner(*)', { count: 'exact', head: true })
          .eq('capitulos_diarios.plan_id', plan.id)
          .eq('lectura_completada', true),
        // Individual: this user's completed reads
        supabase
          .from('progreso_usuario')
          .select('*, capitulos_diarios!inner(*)', { count: 'exact', head: true })
          .eq('capitulos_diarios.plan_id', plan.id)
          .eq('usuario_id', user.id)
          .eq('lectura_completada', true),
      ])

      const totalCapitulos = capRes.count ?? 0
      const communityCompleted = communityRes.count ?? 0
      const individualCompleted = individualRes.count ?? 0

      const communityTotal = totalCapitulos * totalMiembros
      const communityProgress = communityTotal > 0 ? Math.round((communityCompleted / communityTotal) * 100) : 0
      const individualProgress = totalCapitulos > 0 ? Math.round((individualCompleted / totalCapitulos) * 100) : 0

      return {
        ...plan,
        communityProgress,
        individualProgress,
        totalCapitulos,
      }
    })
  )

  return (
    <div>
      <HistoryClient
        progressData={progressRes.data || []}
        planes={planesConProgreso}
      />
    </div>
  )
}
