import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FeedClient } from './_components/feed-client'
import { getTodayInVenezuela } from '@/lib/utils'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Obtener actividades con contadores de likes y comentarios
  const { data: activities } = await supabase
    .from('actividad_comunidad')
    .select(`
      id, creado_en, tipo_actividad, referencia_contenido, resumen_actividad,
      likes_count, comentarios_count, usuario_id,
      perfiles ( nombre_usuario )
    `)
    .order('creado_en', { ascending: false })
    .limit(100)

  // Obtener los likes del usuario actual
  const { data: userLikes } = await supabase
    .from('comunidad_likes')
    .select('actividad_id')
    .eq('user_id', user.id)

  // Crear un Set con los IDs de actividades que el usuario ha dado like
  const likedActivityIds = new Set(userLikes?.map(like => like.actividad_id) || [])

  // CALCULAR HÉROES DEL DÍA (usuarios que completaron lectura Y oración hoy)
  const today = getTodayInVenezuela() // Formato YYYY-MM-DD
  const todayActivities = (activities || []).filter(activity => {
    // Convertir timestamp UTC a fecha en Venezuela
    const activityDate = new Date(activity.creado_en)
    const venezuelaTime = new Date(activityDate.toLocaleString('en-US', { timeZone: 'America/Caracas' }))
    const year = venezuelaTime.getFullYear()
    const month = String(venezuelaTime.getMonth() + 1).padStart(2, '0')
    const day = String(venezuelaTime.getDate()).padStart(2, '0')
    const activityDateStr = `${year}-${month}-${day}`
    return activityDateStr === today
  })

  // Agrupar por usuario y verificar si completaron ambas misiones
  function extractNombrePerfil(perfiles: unknown): string | undefined {
    if (!perfiles) return undefined
    if (Array.isArray(perfiles)) {
      const first = perfiles[0]
      if (first && typeof first === 'object' && 'nombre_usuario' in (first as Record<string, unknown>)) {
        return (first as Record<string, unknown>)['nombre_usuario'] as string
      }
      return undefined
    }
    if (typeof perfiles === 'object' && perfiles !== null && 'nombre_usuario' in (perfiles as Record<string, unknown>)) {
      return (perfiles as Record<string, unknown>)['nombre_usuario'] as string
    }
    return undefined
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
  type Activity = NonNullable<typeof activities>[number];
  const groupedActivities: Record<string, Activity[]> = (activities || []).reduce((acc, activity) => {
    // Convertir timestamp UTC a fecha en Venezuela
    const activityDate = new Date(activity.creado_en);
    const venezuelaDate = new Date(activityDate.toLocaleString('en-US', { timeZone: 'America/Caracas' }));
    const year = venezuelaDate.getFullYear();
    const month = String(venezuelaDate.getMonth() + 1).padStart(2, '0');
    const day = String(venezuelaDate.getDate()).padStart(2, '0');
    const date = `${year}-${month}-${day}`;
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(activity);
    return acc;
  }, {} as Record<string, Activity[]>);

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <FeedClient
        groupedActivities={groupedActivities}
        likedActivityIds={likedActivityIds}
        currentUserId={user.id}
        todaysHeroes={todaysHeroes}
      />
    </div>
  )
}
