import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DeudasClient } from './_components/deudas-client'

export default async function DeudasPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Obtener datos en paralelo
    const [perfilRes, penalizacionesRes, canjeosRes, configRes, progressRes] = await Promise.all([
        supabase.from('perfiles').select('id, nombre_usuario, xp, nivel, max_streak').eq('id', user.id).single(),
        supabase.from('penalizaciones').select('id, usuario_id, fecha_incumplimiento, monto, monto_pagado, estado')
            .eq('usuario_id', user.id)
            .eq('estado', 'pendiente')
            .order('fecha_incumplimiento', { ascending: false }),
        supabase.from('canjeos').select('id, puntos_usados, monto_descontado, descripcion, usuario_id, created_at')
            .eq('usuario_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10),
        supabase.from('configuracion_app')
            .select('clave, valor')
            .in('clave', ['tasa_canjeo', 'costo_recuperar_racha_xp']),
        // Fetch recent progress to calculate current streak
        supabase.from('progreso_usuario')
            .select('fecha_progreso, lectura_completada, oracion_completada')
            .eq('usuario_id', user.id)
            .order('fecha_progreso', { ascending: false })
            .limit(60),
    ])

    // Calculate current streak (same logic as home page)
    let currentStreak = 0
    if (progressRes.data) {
        for (const prog of progressRes.data) {
            if (prog.lectura_completada || prog.oracion_completada) {
                currentStreak++
            } else {
                break
            }
        }
    }

    const maxStreak = perfilRes.data?.max_streak || 0
    const streakIsBroken = currentStreak === 0 && maxStreak > 0

    const configMap: Record<string, string> = {}
    for (const c of configRes.data || []) {
        configMap[c.clave] = c.valor
    }

    return (
        <div>
            <header className="mb-6">
                <h1 className="font-display text-2xl font-bold text-slate-900">Deudas</h1>
                <p className="text-sm text-slate-500">Gestiona penalizaciones y canjea puntos.</p>
            </header>
            <DeudasClient
                perfil={perfilRes.data}
                penalizaciones={penalizacionesRes.data || []}
                canjeos={canjeosRes.data || []}
                tasaCanjeo={Number(configMap['tasa_canjeo'] || 100)}
                costoRecuperarRacha={Number(configMap['costo_recuperar_racha_xp'] || 200)}
                streakIsBroken={streakIsBroken}
                previousStreak={maxStreak}
            />
        </div>
    )
}
