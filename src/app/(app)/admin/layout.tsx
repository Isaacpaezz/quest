import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Admin layout: auth guard only.
 * The parent (app) layout provides GlassHeader, PillNav, and quest-bg.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: perfil } = await supabase
        .from('perfiles')
        .select('grupo_activo_id')
        .eq('id', user.id)
        .single()

    if (!perfil?.grupo_activo_id) redirect('/home')

    const { data: miembro } = await supabase
        .from('miembros_grupo')
        .select('rol')
        .eq('usuario_id', user.id)
        .eq('grupo_id', perfil.grupo_activo_id)
        .single()

    if (miembro?.rol !== 'admin') redirect('/home')

    return <>{children}</>
}

