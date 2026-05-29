import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MiembrosClient } from './_components/miembros-client'
import { calculateStreak } from '@/lib/streak'
import { getToday } from '@/lib/utils'
import { getDiasLibres, getDatesWithoutPlan, getTimezone } from '@/lib/grupo-helpers'

export default async function MiembrosPage() {
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

    // Fetch members, grupo info, progress (for streaks), and debts in parallel
    const [rawMiembrosRes, grupoRes, progressRes, debtsRes] = await Promise.all([
        supabase
            .from('miembros_grupo')
            .select('id, rol, xp, nivel, unido_en, usuario_id')
            .eq('grupo_id', grupoId)
            .order('xp', { ascending: false }),
        supabase.from('grupos').select('codigo_invitacion').eq('id', grupoId).single(),
        supabase
            .from('progreso_usuario')
            .select('usuario_id, fecha_progreso, lectura_completada, oracion_completada, capitulos_diarios!inner(planes_lectura!inner(grupo_id))')
            .eq('capitulos_diarios.planes_lectura.grupo_id', grupoId)
            .order('fecha_progreso', { ascending: false }),
        supabase
            .from('penalizaciones')
            .select('usuario_id, monto, monto_pagado')
            .eq('estado', 'pendiente')
            .eq('grupo_id', grupoId),
    ])

    const rawMiembros = rawMiembrosRes.data ?? []
    const progress = progressRes.data ?? []
    const debts = debtsRes.data ?? []
    const memberIds = rawMiembros.map(m => m.usuario_id).filter(Boolean) as string[]

    // Calculate streaks per user (consecutive dates, skipping free days)
    const tz = await getTimezone(supabase)
    const today = getToday(tz)
    const diasLibres = await getDiasLibres(supabase, grupoId)
    const excludedDates = await getDatesWithoutPlan(supabase, today, grupoId)
    const streakMap: Record<string, number> = {}
    for (const uid of memberIds) {
        const userProgress = progress.filter(p => p.usuario_id === uid)
        streakMap[uid] = calculateStreak(userProgress, today, diasLibres, excludedDates, tz)
    }

    // Calculate debts per user
    const debtMap: Record<string, number> = {}
    for (const d of debts) {
        debtMap[d.usuario_id] = (debtMap[d.usuario_id] || 0) + (Number(d.monto) - Number(d.monto_pagado || 0))
    }

    // Fetch profile names
    const miembros = await Promise.all(
        rawMiembros.map(async (m) => {
            let nombre_usuario = 'Sin nombre'
            if (m.usuario_id) {
                const { data: p } = await supabase
                    .from('perfiles')
                    .select('nombre_usuario')
                    .eq('id', m.usuario_id)
                    .single()
                nombre_usuario = p?.nombre_usuario ?? 'Sin nombre'
            }
            return {
                ...m,
                perfiles: { nombre_usuario },
                racha: streakMap[m.usuario_id ?? ''] ?? 0,
                deuda: debtMap[m.usuario_id ?? ''] ?? 0,
            }
        })
    )

    return (
        <MiembrosClient
            miembros={miembros}
            currentUserId={user.id}
            inviteCode={grupoRes.data?.codigo_invitacion ?? null}
        />
    )
}
