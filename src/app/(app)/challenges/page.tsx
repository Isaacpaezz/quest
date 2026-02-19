import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RetosClient } from './_components/retos-client'

export default async function RetosPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const [retosRes, perfilRes] = await Promise.all([
        supabase
            .from('retos')
            .select(`
                *,
                reto_participantes (
                    usuario_id,
                    progreso,
                    completado,
                    estado,
                    perfiles:usuario_id (nombre_usuario)
                )
            `)
            .order('created_at', { ascending: false }),
        supabase
            .from('perfiles')
            .select('id, nombre_usuario, xp, nivel')
            .eq('id', user.id)
            .single(),
    ])

    // Only show retos where user is a participant
    const userRetos = (retosRes.data || []).filter(r =>
        r.reto_participantes.some((p: { usuario_id: string | null }) => p.usuario_id === user.id)
    )

    return (
        <RetosClient
            retos={userRetos}
            userId={user.id}
            perfil={perfilRes.data}
        />
    )
}
