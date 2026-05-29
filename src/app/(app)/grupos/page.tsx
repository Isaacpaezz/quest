import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GruposClient } from './_components/grupos-client'

export const metadata = {
    title: 'Grupos | Quest',
    description: 'Gestiona tus grupos en Quest',
}

export default async function GruposPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Obtener perfil con grupo activo
    const { data: perfil } = await supabase
        .from('perfiles')
        .select('grupo_activo_id')
        .eq('id', user.id)
        .single()

    // Obtener grupos del usuario con info
    const { data: membresías } = await supabase
        .from('miembros_grupo')
        .select(`
      grupo_id,
      rol,
      unido_en,
      grupos (
        id,
        nombre,
        descripcion,
        codigo_invitacion,
        max_miembros,
        creador_id,
        activo,
        created_at
      )
    `)
        .eq('usuario_id', user.id)

    // Obtener count de miembros por grupo en paralelo
    const grupoIds = membresías?.map(m => m.grupo_id).filter((id): id is string => id !== null) || []

    const memberCounts: Record<string, number> = {}
    if (grupoIds.length > 0) {
        const { data: counts } = await supabase
            .from('miembros_grupo')
            .select('grupo_id')
            .in('grupo_id', grupoIds)

        if (counts) {
            for (const c of counts) {
                if (c.grupo_id) {
                    memberCounts[c.grupo_id] = (memberCounts[c.grupo_id] || 0) + 1
                }
            }
        }
    }

    // Mapear a estructura limpia para el client
    const grupos = (membresías || [])
        .filter(m => m.grupos)
        .map(m => {
            const g = m.grupos as unknown as {
                id: string
                nombre: string
                descripcion: string | null
                codigo_invitacion: string | null
                max_miembros: number | null
                creador_id: string | null
                activo: boolean | null
                created_at: string | null
            }
            return {
                id: g.id,
                nombre: g.nombre,
                descripcion: g.descripcion,
                codigo_invitacion: g.codigo_invitacion,
                max_miembros: g.max_miembros,
                creador_id: g.creador_id,
                activo: g.activo ?? true,
                miRol: m.rol ?? 'miembro',
                miembrosCount: memberCounts[g.id] || 0,
                esActivo: perfil?.grupo_activo_id === g.id,
                created_at: g.created_at,
            }
        })

    return (
        <div className="container mx-auto p-4 sm:p-8">
            <GruposClient
                grupos={grupos}
                grupoActivoId={perfil?.grupo_activo_id || null}
                userId={user.id}
            />
        </div>
    )
}
