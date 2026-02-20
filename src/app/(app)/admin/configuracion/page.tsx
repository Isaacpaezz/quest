import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from './_components/settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('grupo_activo_id')
    .eq('id', user.id)
    .single()

  const grupoId = perfil?.grupo_activo_id
  if (!grupoId) redirect('/perfil')

  const { data: settings } = await supabase
    .from('configuracion_app')
    .select('clave, valor')
    .eq('grupo_id', grupoId)

  const settingsMap: Record<string, string> = {}
  settings?.forEach(s => {
    settingsMap[s.clave] = s.valor
  })

  return <SettingsForm settings={settingsMap} />
}
