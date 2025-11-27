import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './_components/dashboard-client'
import { getTodayInVenezuela } from '@/lib/utils'

/**
 * Página principal del Dashboard.
 * Muestra la "Misión del Día" del usuario, que consiste en la lectura bíblica
 * y el tiempo de oración asignados por el plan de lectura activo.
 */
export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // 1. Obtener la misión de hoy (capítulo y tiempo de oración)
  const today = getTodayInVenezuela() // Formato YYYY-MM-DD en zona horaria de Venezuela

  const { data: dailyMission } = await supabase
    .from('planes_lectura')
    .select(`
      minutos_oracion_requeridos,
      capitulos_diarios (
        id,
        referencia_capitulo
      )
    `)
    .eq('estado', 'activo') // Usamos 'estado' en lugar de 'esta_activo'
    .eq('capitulos_diarios.fecha_lectura', today)
    .single()

  // 2. Obtener el progreso del usuario para la misión de hoy
  const { data: userProgress } = await supabase
    .from('progreso_usuario')
    .select('lectura_completada, oracion_completada, segundos_oracion_acumulados, lectura_completada_en, oracion_completada_en')
    .eq('usuario_id', user.id)
    .eq('fecha_progreso', today)
    .single()

  return (
    <DashboardClient dailyMission={dailyMission} userProgress={userProgress} />
  )
}
