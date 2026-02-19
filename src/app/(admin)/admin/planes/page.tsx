import { createClient } from '@/lib/supabase/server'
import { PlanManagementClient } from './_components/plan-management-client'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default async function PlanManagementPage() {
  const supabase = await createClient()
  const { data: planes, error } = await supabase.from('planes_lectura').select('id, nombre_libro, fecha_inicio, fecha_fin, estado, minutos_oracion_requeridos').order('fecha_inicio', { ascending: false })

  if (error) {
    console.error('Error fetching plans:', error)
  }

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
          <h1 className="font-display text-2xl font-bold text-slate-900">Gestión de Planes de Lectura</h1>
          <p className="text-sm text-slate-500">Crea, programa y gestiona los planes de lectura para la comunidad.</p>
        </div>
      </div>
      <PlanManagementClient planes={planes || []} />
    </div>
  )
}
