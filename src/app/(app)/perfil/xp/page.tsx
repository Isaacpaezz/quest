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
            .select('xp, nivel')
            .eq('id', user.id)
            .single(),
        supabase.from('historial_xp')
            .select('id, cantidad, motivo, referencia_id, created_at')
            .eq('usuario_id', user.id)
            .order('created_at', { ascending: false })
            .limit(100),
    ])

    return (
        <XpHistoryClient
            xp={profileRes.data?.xp ?? 0}
            nivel={profileRes.data?.nivel ?? 1}
            history={historyRes.data ?? []}
        />
    )
}
