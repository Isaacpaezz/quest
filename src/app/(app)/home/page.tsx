import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from './_components/dashboard-client'
import { getToday } from '@/lib/utils'
import { getMiembrosGrupoActivo, getTimezone, getDiasLibres } from '@/lib/grupo-helpers'
import { calculateStreak } from '@/lib/streak'

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
  const tz = await getTimezone(supabase)
  const today = getToday(tz)

  // Obtener grupo activo para filtrar planes
  const { grupoId: grupoIdForPlan } = await getMiembrosGrupoActivo(supabase)

  let dailyMissionQuery = supabase
    .from('planes_lectura')
    .select(`
      minutos_oracion_requeridos,
      capitulos_diarios (
        id,
        referencia_capitulo
      )
    `)
    .eq('estado', 'activo')
    .eq('capitulos_diarios.fecha_lectura', today)

  if (grupoIdForPlan) {
    dailyMissionQuery = dailyMissionQuery.eq('grupo_id', grupoIdForPlan)
  }

  const { data: dailyMission } = await dailyMissionQuery.single()

  // 2. Obtener el progreso del usuario para la misión de hoy
  const { data: userProgress } = await supabase
    .from('progreso_usuario')
    .select('lectura_completada, oracion_completada, segundos_oracion_acumulados, lectura_completada_en, oracion_completada_en')
    .eq('usuario_id', user.id)
    .eq('fecha_progreso', today)
    .single()

  // 3. Obtener estadísticas de comunidad: quiénes leyeron HOY (zona Venezuela)
  // Filtrar por miembros del grupo activo
  const startOfDayIso = new Date(`${today}T00:00:00-04:00`).toISOString()
  const endOfDayIso = new Date(`${today}T23:59:59.999-04:00`).toISOString()

  const { grupoId, miembros: memberIds } = await getMiembrosGrupoActivo(supabase)

  let readersQuery = supabase
    .from('actividad_comunidad')
    .select('usuario_id, perfiles ( nombre_usuario ), creado_en')
    .eq('tipo_actividad', 'lectura_completada')
    .gte('creado_en', startOfDayIso)
    .lte('creado_en', endOfDayIso)
    .order('creado_en', { ascending: false })
    .limit(500)

  let prayersQuery = supabase
    .from('actividad_comunidad')
    .select('usuario_id, perfiles ( nombre_usuario ), creado_en')
    .eq('tipo_actividad', 'oracion_completada')
    .gte('creado_en', startOfDayIso)
    .lte('creado_en', endOfDayIso)
    .order('creado_en', { ascending: false })
    .limit(500)

  // Filtrar por grupo activo usando grupo_id
  if (grupoId) {
    readersQuery = readersQuery.eq('grupo_id', grupoId)
    prayersQuery = prayersQuery.eq('grupo_id', grupoId)
  } else if (memberIds.length > 0) {
    readersQuery = readersQuery.in('usuario_id', memberIds)
    prayersQuery = prayersQuery.in('usuario_id', memberIds)
  }

  const { data: readers } = await readersQuery
  const { data: prayers } = await prayersQuery

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

  // 4. Calculate streak: count consecutive days with progress before today (scoped to active group)
  let streakCount = 0
  let recentProgressQuery = supabase
    .from('progreso_usuario')
    .select('fecha_progreso, lectura_completada, oracion_completada, capitulo_id, capitulos_diarios!inner(plan_id, planes_lectura!inner(grupo_id))')
    .eq('usuario_id', user.id)
    .order('fecha_progreso', { ascending: false })
    .limit(60)

  if (grupoIdForPlan) {
    recentProgressQuery = recentProgressQuery.eq('capitulos_diarios.planes_lectura.grupo_id', grupoIdForPlan)
  }

  const { data: recentProgress } = await recentProgressQuery

  if (recentProgress) {
    const diasLibres = await getDiasLibres(supabase, grupoIdForPlan)
    streakCount = calculateStreak(recentProgress, today, diasLibres)
  }

  // Update max_streak: global (perfiles) + per-group (miembros_grupo)
  if (streakCount > 0) {
    const [{ data: profile }, { data: miembro }] = await Promise.all([
      supabase.from('perfiles').select('max_streak').eq('id', user.id).single(),
      grupoIdForPlan
        ? supabase.from('miembros_grupo').select('id, max_streak').eq('usuario_id', user.id).eq('grupo_id', grupoIdForPlan).single()
        : Promise.resolve({ data: null }),
    ])

    // Global max streak (all-time across all groups)
    if (profile && streakCount > (profile.max_streak || 0)) {
      await supabase.from('perfiles').update({ max_streak: streakCount }).eq('id', user.id)
    }

    // Per-group max streak
    if (miembro && streakCount > (miembro.max_streak || 0)) {
      await supabase.from('miembros_grupo').update({ max_streak: streakCount }).eq('id', miembro.id)
    }
  }

  // 5. Weekly progress: get Mon-Sun of current week
  const todayDate = new Date(`${today}T12:00:00-04:00`)
  const dayOfWeek = todayDate.getDay() // 0=Sun, 1=Mon...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(todayDate)
  monday.setDate(todayDate.getDate() + mondayOffset)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const mondayStr = fmt(monday)
  const sundayStr = fmt(sunday)

  // Get chapter IDs for the active group's plan to scope weekly progress
  let weekProgressQuery = supabase
    .from('progreso_usuario')
    .select('fecha_progreso, lectura_completada, oracion_completada, capitulo_id, capitulos_diarios!inner(plan_id, planes_lectura!inner(grupo_id))')
    .eq('usuario_id', user.id)
    .gte('fecha_progreso', mondayStr)
    .lte('fecha_progreso', sundayStr)

  if (grupoIdForPlan) {
    weekProgressQuery = weekProgressQuery.eq('capitulos_diarios.planes_lectura.grupo_id', grupoIdForPlan)
  }

  const { data: weekProgress } = await weekProgressQuery

  const DAYS_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
  const weeklyProgressData = DAYS_LABELS.map((label, i) => {
    const dayDate = new Date(monday)
    dayDate.setDate(monday.getDate() + i)
    const dateStr = fmt(dayDate)
    const prog = weekProgress?.find(p => p.fecha_progreso === dateStr)
    return {
      day: label,
      reading: prog?.lectura_completada ?? false,
      prayer: prog?.oracion_completada ?? false,
    }
  })

  // 6. Plan chapter counts (total + completed by this user)
  let totalChapters = 0
  let completedChapters = 0

  let planQuery = supabase
    .from('planes_lectura')
    .select('id')
    .eq('estado', 'activo')

  if (grupoIdForPlan) {
    planQuery = planQuery.eq('grupo_id', grupoIdForPlan)
  }

  const { data: planData } = await planQuery.single()

  if (planData) {
    // Total chapters in the plan
    const { count: total } = await supabase
      .from('capitulos_diarios')
      .select('id', { count: 'exact', head: true })
      .eq('plan_id', planData.id)

    totalChapters = total ?? 0

    // Get all chapter IDs for this plan
    const { data: planChapters } = await supabase
      .from('capitulos_diarios')
      .select('id')
      .eq('plan_id', planData.id)

    if (planChapters && planChapters.length > 0) {
      const { count: completed } = await supabase
        .from('progreso_usuario')
        .select('id', { count: 'exact', head: true })
        .eq('usuario_id', user.id)
        .eq('lectura_completada', true)
        .in('capitulo_id', planChapters.map(c => c.id))

      completedChapters = completed ?? 0
    }
  }

  // 7. Fetch user retos for home section
  const { data: userRetosData } = await supabase
    .from('reto_participantes')
    .select(`
      usuario_id,
      progreso,
      completado,
      estado,
      retos:reto_id (
        id,
        titulo,
        descripcion,
        tipo,
        criterio,
        recompensa_xp,
        fecha_inicio,
        fecha_fin,
        creador_id,
        creador:creador_id (nombre_usuario),
        reto_participantes (
          usuario_id,
          progreso,
          completado,
          estado
        )
      )
    `)
    .eq('usuario_id', user.id)

  type RetoFromJoin = {
    id: string
    titulo: string
    descripcion: string | null
    tipo: string
    criterio: { action?: string; count?: number } | null
    recompensa_xp: number | null
    fecha_inicio: string
    fecha_fin: string
    creador_id: string | null
    creador: { nombre_usuario: string } | null
    reto_participantes: {
      usuario_id: string | null
      progreso: number | null
      completado: boolean | null
      estado: string | null
    }[]
  }

  const allRetos: RetoFromJoin[] = (userRetosData || [])
    .map(r => r.retos as unknown as RetoFromJoin)
    .filter(Boolean)

  const pendientesRetos = allRetos.filter(r =>
    r.reto_participantes.some(p => p.usuario_id === user.id && p.estado === 'pendiente')
  )
  const activosRetos = allRetos.filter(r =>
    r.reto_participantes.some(p => p.usuario_id === user.id && p.estado === 'aceptado') &&
    r.fecha_inicio <= today && r.fecha_fin >= today
  )
  const proximosRetos = allRetos.filter(r =>
    r.reto_participantes.some(p => p.usuario_id === user.id && p.estado === 'aceptado') &&
    r.fecha_inicio > today
  )

  return (
    <DashboardClient
      dailyMission={dailyMission}
      userProgress={userProgress}
      readingStats={{ count: readersCount, firstReaderName }}
      prayerStats={{ count: prayersCount, firstPrayerName }}
      streak={streakCount}
      weeklyProgress={weeklyProgressData}
      totalChapters={totalChapters}
      completedChapters={completedChapters}
      userId={user.id}
      pendientesRetos={pendientesRetos}
      activosRetos={activosRetos}
      proximosRetos={proximosRetos}
    />
  )
}
