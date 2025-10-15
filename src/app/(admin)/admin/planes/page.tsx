import { createClient } from '@/lib/supabase/server'
import { PlanManagementClient } from './_components/plan-management-client'

export default async function PlanManagementPage() {
  const supabase = await createClient()
  const { data: planes, error } = await supabase.from('planes_lectura').select('*').order('fecha_inicio', { ascending: false })

  if (error) {
    console.error('Error fetching plans:', error)
    // Manejar el error adecuadamente en una app real
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Gestión de Planes de Lectura</h1>
      <p className="mt-2 text-muted-foreground">
        Crea, programa y gestiona los planes de lectura para la comunidad.
      </p>
      <div className="mt-8">
        <PlanManagementClient planes={planes || []} />
      </div>
    </div>
  )
}
