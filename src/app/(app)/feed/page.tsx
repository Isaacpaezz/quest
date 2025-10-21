import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FeedClient } from './_components/feed-client'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: activities } = await supabase
    .from('actividad_comunidad')
    .select(`
      id, creado_en, tipo_actividad, referencia_contenido, resumen_actividad,
      perfiles ( nombre_usuario )
    `)
    .order('creado_en', { ascending: false })
    .limit(100) // Aumentamos el límite para tener más datos para agrupar

  // PROCESAMIENTO DE DATOS: Agrupar por fecha
  type Activity = NonNullable<typeof activities>[number];
  const groupedActivities: Record<string, Activity[]> = (activities || []).reduce((acc, activity) => {
    const date = new Date(activity.creado_en).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(activity);
    return acc;
  }, {} as Record<string, Activity[]>);

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Feed</h1>
        <p className="text-muted-foreground">Nuestra comunidad en tiempo real.</p>
      </header>
      <FeedClient groupedActivities={groupedActivities} />
    </div>
  )
}
