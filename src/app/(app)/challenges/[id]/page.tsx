import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { RetoDetalleClient } from './_components/reto-detalle-client'

export default async function RetoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Obtener detalle del reto con participantes y sus perfiles
  const { data: reto } = await supabase
    .from('retos')
    .select(`
      *,
      reto_participantes (
        id,
        usuario_id,
        progreso,
        completado,
        completado_en,
        estado,
        perfiles:usuario_id (nombre_usuario, nivel, xp)
      ),
      creador:creador_id (nombre_usuario)
    `)
    .eq('id', id)
    .single()

  if (!reto) notFound()

  return (
    <RetoDetalleClient reto={reto} userId={user.id} />
  )
}
