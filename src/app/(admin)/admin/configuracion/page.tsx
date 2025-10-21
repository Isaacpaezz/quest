import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from './_components/settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: setting } = await supabase
    .from('configuracion_app')
    .select('valor')
    .eq('clave', 'monto_penalizacion')
    .single()

  return (
    <div>
      <h1 className="text-2xl font-bold">Configuración General</h1>
      <p className="mt-2 text-muted-foreground">
        Gestiona los parámetros globales de la aplicación.
      </p>
      <div className="mt-8">
        <SettingsForm initialPenaltyAmount={setting?.valor || '0'} />
      </div>
    </div>
  )
}
