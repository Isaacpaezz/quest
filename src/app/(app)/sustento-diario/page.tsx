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

  // 3. Obtener estadísticas de comunidad: quiénes leyeron HOY (zona Venezuela)
  // Construimos rango ISO para el día en zona Venezuela y filtramos por `creado_en`.
  const startOfDayIso = new Date(`${today}T00:00:00-04:00`).toISOString()
  const endOfDayIso = new Date(`${today}T23:59:59.999-04:00`).toISOString()

  const { data: readers } = await supabase
    .from('actividad_comunidad')
    .select('usuario_id, perfiles ( nombre_usuario ), creado_en')
    .eq('tipo_actividad', 'lectura_completada')
    .gte('creado_en', startOfDayIso)
    .lte('creado_en', endOfDayIso)
    .order('creado_en', { ascending: false })
    .limit(500)

  const { data: prayers } = await supabase
    .from('actividad_comunidad')
    .select('usuario_id, perfiles ( nombre_usuario ), creado_en')
    .eq('tipo_actividad', 'oracion_completada')
    .gte('creado_en', startOfDayIso)
    .lte('creado_en', endOfDayIso)
    .order('creado_en', { ascending: false })
    .limit(500)

  const readersArray = Array.isArray(readers) ? (readers as unknown[]) : []
  const readerIds = Array.from(new Set(readersArray.map(r => (r as Record<string, unknown>)['usuario_id'] as string)))
  const readersCount = readerIds.length
  const firstReaderName = readersArray.length > 0
    ? (Array.isArray((readersArray[0] as Record<string, unknown>)['perfiles'])
        ? ((readersArray[0] as Record<string, unknown>)['perfiles'] as Record<string, unknown>[])[0]?.['nombre_usuario'] as string
        : ((readersArray[0] as Record<string, unknown>)['perfiles'] as Record<string, unknown>)?.['nombre_usuario'] as string)
    : null

  const prayersArray = Array.isArray(prayers) ? (prayers as unknown[]) : []
  const prayerIds = Array.from(new Set(prayersArray.map(r => (r as Record<string, unknown>)['usuario_id'] as string)))
  const prayersCount = prayerIds.length
  const firstPrayerName = prayersArray.length > 0
    ? (Array.isArray((prayersArray[0] as Record<string, unknown>)['perfiles'])
        ? ((prayersArray[0] as Record<string, unknown>)['perfiles'] as Record<string, unknown>[])[0]?.['nombre_usuario'] as string
        : ((prayersArray[0] as Record<string, unknown>)['perfiles'] as Record<string, unknown>)?.['nombre_usuario'] as string)
    : null

  return (
    <DashboardClient
      dailyMission={dailyMission}
      userProgress={userProgress}
      readingStats={{ count: readersCount, firstReaderName }}
      prayerStats={{ count: prayersCount, firstPrayerName }}
    />
  )
}
