import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { HistoryClient } from './_components/history-client'
import { getTodayInVenezuela } from '@/lib/utils'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch progress data AND completed reading plans in parallel
  const [progressRes, planesRes] = await Promise.all([
    supabase
      .from('progreso_usuario')
      .select('fecha_progreso, lectura_completada, oracion_completada')
      .eq('usuario_id', user.id)
      .order('fecha_progreso', { ascending: false }),
    supabase
      .from('planes_lectura')
      .select('*')
      .eq('estado', 'completado')
      .order('fecha_fin', { ascending: false }),
  ])

  return (
    <div>
      <HistoryClient
        progressData={progressRes.data || []}
        planes={planesRes.data || []}
      />
    </div>
  )
}
