import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getToday } from '@/lib/utils'
import { getTimezone, getConfigGrupo, getGrupoActivo } from '@/lib/grupo-helpers'
import { OracionClient } from './_components/oracion-client'

export default async function OracionPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const tz = await getTimezone(supabase)
    const today = getToday(tz)

    // Read bonus config from group settings
    const grupoId = await getGrupoActivo(supabase)
    let bonusMinutos = 10
    let bonusXp = 20
    if (grupoId) {
        const config = await getConfigGrupo(supabase, grupoId)
        bonusMinutos = Number(config['xp_oracion_bonus_minutos']) || 10
        bonusXp = Number(config['xp_oracion_bonus']) || 20
    }

    let dailyMissionQuery = supabase
        .from('planes_lectura')
        .select(`
      minutos_oracion_requeridos,
      capitulos_diarios (
        id,
        referencia_capitulo
      )
    `)
        .eq('estado', 'activo')
        .eq('capitulos_diarios.fecha_lectura', today)

    if (grupoId) {
        dailyMissionQuery = dailyMissionQuery.eq('grupo_id', grupoId)
    }

    const { data: dailyMission } = await dailyMissionQuery.single()

    const chapterInfo = Array.isArray(dailyMission?.capitulos_diarios)
        ? dailyMission.capitulos_diarios[0]
        : dailyMission?.capitulos_diarios

    if (!chapterInfo) redirect('/home')

    const { data: userProgress } = await supabase
        .from('progreso_usuario')
        .select('oracion_completada, segundos_oracion_acumulados')
        .eq('usuario_id', user.id)
        .eq('fecha_progreso', today)
        .single()

    return (
        <OracionClient
            minutosRequeridos={dailyMission!.minutos_oracion_requeridos}
            segundosIniciales={userProgress?.segundos_oracion_acumulados || 0}
            capituloId={chapterInfo.id}
            oracionCompletada={userProgress?.oracion_completada || false}
            bonusMinutos={bonusMinutos}
            bonusXp={bonusXp}
        />
    )
}
