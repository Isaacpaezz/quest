import { createClient } from '@/lib/supabase/server'
import { PenaltiesClient } from './_components/penalties-client'

export default async function PenaltiesManagementPage() {
  const supabase = await createClient()
  const { data: penalties, error } = await supabase
    .from('penalizaciones')
    .select(`id, monto, monto_pagado, perfiles (id, nombre_usuario)`)
    .eq('estado', 'pendiente')

  // Procesar los datos para agrupar por usuario
  const usersWithDebt = (penalties || []).reduce((acc: any, penalty: any) => {
    const userId = penalty.perfiles.id
    if (!acc[userId]) {
      acc[userId] = {
        usuario_id: userId,
        nombre_usuario: penalty.perfiles.nombre_usuario,
        dias_pendientes: 0,
        deuda_total: 0,
      }
    }
    acc[userId].dias_pendientes += 1
    acc[userId].deuda_total += (parseFloat(penalty.monto) - parseFloat(penalty.monto_pagado || 0))
    return acc
  }, {})

  return (
    <div>
      <h1 className="text-2xl font-bold">Gestión de Penalizaciones</h1>
      <p className="mt-2 text-muted-foreground">Aplica pagos parciales o totales a las deudas de la comunidad.</p>
      <div className="mt-8">
        <PenaltiesClient users={Object.values(usersWithDebt)} />
      </div>
    </div>
  )
}
