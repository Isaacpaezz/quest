import { createClient } from '@/lib/supabase/server'
import { PenaltiesClient } from './_components/penalties-client'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default async function PenaltiesManagementPage() {
  const supabase = await createClient()
  const { data: penalties } = await supabase
    .from('penalizaciones')
    .select(`id, monto, monto_pagado, perfiles (id, nombre_usuario)`)
    .eq('estado', 'pendiente')

  // Procesar los datos para agrupar por usuario
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    <div className="mx-auto max-w-2xl space-y-6 pb-24">
      <div className="flex items-center gap-4 px-4 pt-8">
        <Link 
          href="/perfil" 
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition-colors hover:bg-slate-50"
        >
          <ChevronLeft className="h-6 w-6 text-slate-600" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Gestión de Penalizaciones</h1>
          <p className="text-sm text-slate-500">Aplica pagos parciales o totales a las deudas de la comunidad.</p>
        </div>
      </div>
      <PenaltiesClient users={Object.values(usersWithDebt)} />
    </div>
  )
}
