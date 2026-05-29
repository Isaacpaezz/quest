import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FeedClient } from './_components/feed-client'
import { getToday, formatDateInTimezone } from '@/lib/utils'
import type { FeedActivity } from './types'
import { getMiembrosGrupoActivo, getTimezone } from '@/lib/grupo-helpers'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Obtener miembros del grupo activo para scoping
  const { grupoId, miembros } = await getMiembrosGrupoActivo(supabase)

  // Obtener actividades filtradas por grupo activo
  let activitiesQuery = supabase
    .from('actividad_comunidad')
    .select(`
      id, creado_en, tipo_actividad, referencia_contenido, resumen_actividad,
      likes_count, comentarios_count, usuario_id,
      perfiles ( nombre_usuario )
    `)
    .order('creado_en', { ascending: false })
    .limit(100)

  if (grupoId) {
    activitiesQuery = activitiesQuery.eq('grupo_id', grupoId)
  } else {
    activitiesQuery = activitiesQuery.in('usuario_id', miembros)
  }

  const { data: activities } = await activitiesQuery

  // Obtener las reacciones del usuario actual
  const { data: userReactions } = await supabase
    .from('comunidad_likes')
    .select('actividad_id, tipo_reaccion')
    .eq('user_id', user.id)

  // Create a map: activityId -> Set of reaction types the user has given
  const userReactionsMap: Record<number, string[]> = {}
  for (const reaction of userReactions || []) {
    if (!userReactionsMap[reaction.actividad_id]) {
      userReactionsMap[reaction.actividad_id] = []
    }
    userReactionsMap[reaction.actividad_id].push(reaction.tipo_reaccion)
  }

  // Backward-compatible Set for likes
  const likedActivityIds = new Set(
    (userReactions || [])
      .filter(r => r.tipo_reaccion === 'like')
      .map(r => r.actividad_id)
  )

  // CALCULAR HÉROES DEL DÍA (usuarios que completaron lectura Y oración hoy)
  const tz = await getTimezone(supabase)
  const today = getToday(tz) // Formato YYYY-MM-DD
  const feedActivities = (activities || []) as FeedActivity[]
  const todayActivities = feedActivities.filter(activity => {
    const activityDate = new Date(activity.creado_en)
    const activityDateStr = formatDateInTimezone(activityDate, tz)
    return activityDateStr === today
  })

  // Agrupar por usuario y verificar si completaron ambas misiones
  function extractNombrePerfil(perfiles: FeedActivity['perfiles']): string | undefined {
    if (!perfiles) return undefined
    if (Array.isArray(perfiles)) {
      return perfiles[0]?.nombre_usuario
    }
    return perfiles.nombre_usuario
  }

  const userMissions = todayActivities.reduce((acc, activity) => {
    const userId = activity.usuario_id
    if (!acc[userId]) {
      acc[userId] = {
        nombre_usuario: extractNombrePerfil(activity.perfiles) ?? 'Alguien',
        lectura: false,
        oracion: false
      }
    }
    if (activity.tipo_actividad === 'lectura_completada') {
      acc[userId].lectura = true
    } else if (activity.tipo_actividad === 'oracion_completada') {
      acc[userId].oracion = true
    }
    return acc
  }, {} as Record<string, { nombre_usuario: string; lectura: boolean; oracion: boolean }>)

  // Filtrar solo los héroes (completaron ambas)
  const todaysHeroes = Object.entries(userMissions)
    .filter(([_, missions]) => missions.lectura && missions.oracion)
    .map(([userId, data]) => ({
      id: userId,
      nombre_usuario: data.nombre_usuario
    }))

  // PROCESAMIENTO DE DATOS: Agrupar por fecha en zona horaria de Venezuela
  const groupedActivities: Record<string, FeedActivity[]> = feedActivities.reduce((acc, activity) => {
    const activityDate = new Date(activity.creado_en);
    const date = formatDateInTimezone(activityDate, tz);
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(activity);
    return acc;
  }, {} as Record<string, FeedActivity[]>);

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <FeedClient
        groupedActivities={groupedActivities}
        likedActivityIds={likedActivityIds}
        userReactionsMap={userReactionsMap}
        currentUserId={user.id}
        todaysHeroes={todaysHeroes}
        memberIds={miembros}
        timezone={tz}
        grupoId={grupoId}
      />
    </div>
  )
}
