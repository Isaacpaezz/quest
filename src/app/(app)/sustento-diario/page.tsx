import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './_components/dashboard-client'

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
  const today = new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD

  const { data: dailyMission, error: missionError } = await supabase
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
  const { data: userProgress, error: progressError } = await supabase
    .from('progreso_usuario')
    .select('lectura_completada, oracion_completada, segundos_oracion_acumulados')
    .eq('usuario_id', user.id)
    .eq('fecha_progreso', today)
    .single()

  return (
    <>
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">Sustento Diario</h1>
        <p className="text-muted-foreground">Espacio para crecer y conectar con Dios.</p>
      </header>
      <DashboardClient dailyMission={dailyMission} userProgress={userProgress} />
    </>
  )
}
