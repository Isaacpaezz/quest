import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CommunityClient } from './_components/community-client'

export default async function CommunityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const today = new Date().toISOString().split('T')[0]

  // Obtener todos los datos en paralelo para máxima eficiencia
  const [profilesRes, progressRes, penaltiesRes] = await Promise.all([
    supabase.from('perfiles').select('*'),
    supabase.from('progreso_usuario').select('*').eq('fecha_progreso', today),
    supabase.from('penalizaciones').select('*').eq('estado', 'pendiente'),
  ])

  // Combinar los datos en el servidor para simplificar el cliente
  const communityData = profilesRes.data?.map(profile => {
    const todayProgress = progressRes.data?.find(p => p.usuario_id === profile.id)
    const userPenalties = penaltiesRes.data?.filter(p => p.usuario_id === profile.id) || []
    
    const totalDeuda = userPenalties.reduce((acc, p) => acc + parseFloat(p.monto), 0)

    return {
      ...profile,
      progresoHoy: {
        lectura_completada: todayProgress?.lectura_completada || false,
        oracion_completada: todayProgress?.oracion_completada || false,
      },
      deuda: {
        total: totalDeuda,
        dias_pendientes: userPenalties.length,
      }
    }
  }) || []

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Pulso de la Comunidad</h1>
        <p className="text-muted-foreground">Aquí seguimos juntos nuestra senda, con transparencia y apoyo mutuo.</p>
      </header>
      <CommunityClient communityData={communityData} />
    </div>
  )
}
