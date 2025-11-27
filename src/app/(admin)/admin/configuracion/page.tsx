import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from './_components/settings-form'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: setting } = await supabase
    .from('configuracion_app')
    .select('valor')
    .eq('clave', 'monto_penalizacion')
    .single()

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
          <h1 className="font-display text-2xl font-bold text-slate-900">Configuración General</h1>
          <p className="text-sm text-slate-500">Gestiona los parámetros globales de la aplicación.</p>
        </div>
      </div>
      <SettingsForm initialPenaltyAmount={setting?.valor || '0'} />
    </div>
  )
}
