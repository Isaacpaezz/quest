import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PlanManagementClient } from './_components/plan-management-client'

export default async function PlanesPage() {
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

  const { data: planes } = await supabase
    .from('planes_lectura')
    .select('*')
    .eq('grupo_id', grupoId)
    .order('fecha_inicio', { ascending: true })

  // Fetch totalMiembros once (same for every plan in this group)
  const { count: totalMiembros } = await supabase
    .from('miembros_grupo')
    .select('*', { count: 'exact', head: true })
    .eq('grupo_id', grupoId)

  const planesConProgreso = await Promise.all(
    (planes ?? []).map(async (plan) => {
      const { count: totalCapitulos } = await supabase
        .from('capitulos_diarios')
        .select('*', { count: 'exact', head: true })
        .eq('plan_id', plan.id)

      const { count: progresoCompletado } = await supabase
        .from('progreso_usuario')
        .select('*, capitulos_diarios!inner(*)', { count: 'exact', head: true })
        .eq('capitulos_diarios.plan_id', plan.id)
        .eq('lectura_completada', true)

      return {
        ...plan,
        totalCapitulos: totalCapitulos ?? 0,
        progresoCompletado: progresoCompletado ?? 0,
        totalMiembros: totalMiembros ?? 1,
      }
    })
  )

  return <PlanManagementClient planes={planesConProgreso} />
}
