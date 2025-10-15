import { createClient } from '@/lib/supabase/server'
import { PenaltiesClient } from './_components/penalties-client'

export default async function PenaltiesManagementPage() {
  const supabase = await createClient()
  
  // Obtenemos todas las penalizaciones pendientes y el nombre de usuario asociado
  // gracias a las relaciones de Supabase.
  const { data: penalties, error } = await supabase
    .from('penalizaciones')
    .select(`
      id,
      fecha_incumplimiento,
      monto,
      estado,
      perfiles ( nombre_usuario )
    `)
    .eq('estado', 'pendiente')
    .order('fecha_incumplimiento', { ascending: true })

  if (error) {
    console.error("Error fetching penalties:", error)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Gestión de Penalizaciones</h1>
      <p className="mt-2 text-muted-foreground">
        Aquí puedes ver y gestionar todas las penalizaciones pendientes de la comunidad.
      </p>
      <div className="mt-8">
        <PenaltiesClient penalties={penalties || []} />
      </div>
    </div>
  )
}
