import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTodayInVenezuela } from '@/lib/utils'
import { OracionClient } from './_components/oracion-client'

export default async function OracionPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const today = getTodayInVenezuela()

    const { data: dailyMission } = await supabase
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
        .single()

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
        />
    )
}
