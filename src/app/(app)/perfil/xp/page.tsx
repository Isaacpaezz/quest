import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { XpHistoryClient } from './_components/xp-history-client'

export const metadata = {
    title: 'Historial XP — Quest',
}

export default async function XpHistoryPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const [profileRes, historyRes] = await Promise.all([
        supabase.from('perfiles')
            .select('xp, nivel, grupo_activo_id')
            .eq('id', user.id)
            .single(),
        supabase.from('historial_xp')
            .select('id, cantidad, motivo, referencia_id, created_at')
            .eq('usuario_id', user.id)
            .order('created_at', { ascending: false })
            .limit(100),
    ])

    // Override with group XP if user has active group
    let xp = profileRes.data?.xp ?? 0
    let nivel = profileRes.data?.nivel ?? 1
    if (profileRes.data?.grupo_activo_id) {
        const { data: miembro } = await supabase
            .from('miembros_grupo')
            .select('xp, nivel')
            .eq('usuario_id', user.id)
            .eq('grupo_id', profileRes.data.grupo_activo_id)
            .single()
        if (miembro) {
            xp = miembro.xp
            nivel = miembro.nivel
        }
    }

    return (
        <XpHistoryClient
            xp={xp}
            nivel={nivel}
            history={historyRes.data ?? []}
        />
    )
}
