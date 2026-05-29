import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BadgesClient } from './_components/badges-client'

export default async function BadgesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch badges, user badges, profile (with max_streak), and current streak
    const [badgesRes, userBadgesRes, perfilRes, streaksRes] = await Promise.all([
        supabase.from('badges').select('id, nombre, descripcion, icono, criterio').order('nombre'),
        supabase.from('usuario_badges').select('badge_id, desbloqueado_en').eq('usuario_id', user.id),
        supabase.from('perfiles').select('id, nombre_usuario, xp, nivel, max_streak, grupo_activo_id').eq('id', user.id).single(),
        supabase.rpc('get_all_user_streaks'),
    ])

    let maxStreak = perfilRes.data?.max_streak || 0
    const currentStreak = (streaksRes.data || []).find((s: { user_id: string }) => s.user_id === user.id)?.streak_count || 0

    // Override with group XP/nivel/max_streak if user has active group
    let perfilData = perfilRes.data
    if (perfilData?.grupo_activo_id) {
        const { data: miembro } = await supabase
            .from('miembros_grupo')
            .select('xp, nivel, max_streak')
            .eq('usuario_id', user.id)
            .eq('grupo_id', perfilData.grupo_activo_id)
            .single()
        if (miembro) {
            perfilData = { ...perfilData, xp: miembro.xp, nivel: miembro.nivel }
            maxStreak = miembro.max_streak || 0
        }
    }

    // Auto-award streak badges based on max_streak
    const allBadges = badgesRes.data || []
    const unlockedBadgeIds = new Set((userBadgesRes.data || []).map(ub => ub.badge_id))

    for (const badge of allBadges) {
        if (unlockedBadgeIds.has(badge.id)) continue
        const criterio = badge.criterio as { tipo?: string; valor?: number } | null
        if (!criterio) continue

        if (criterio.tipo === 'racha' && typeof criterio.valor === 'number' && maxStreak >= criterio.valor) {
            await supabase.from('usuario_badges').insert({
                usuario_id: user.id,
                badge_id: badge.id,
            })
            unlockedBadgeIds.add(badge.id)
        }
    }

    // Refresh user badges after potential unlocks
    const { data: refreshedUserBadges } = await supabase
        .from('usuario_badges')
        .select('badge_id, desbloqueado_en')
        .eq('usuario_id', user.id)

    const unlockedDates = new Map((refreshedUserBadges || []).map(ub => [ub.badge_id, ub.desbloqueado_en]))

    const badgesConEstado = allBadges.map(badge => ({
        ...badge,
        desbloqueado: unlockedBadgeIds.has(badge.id),
        desbloqueado_en: unlockedDates.get(badge.id) || null,
    }))

    return (
        <div>
            <BadgesClient
                badges={badgesConEstado}
                perfil={perfilData}
                maxStreak={maxStreak}
                currentStreak={currentStreak}
            />
        </div>
    )
}
