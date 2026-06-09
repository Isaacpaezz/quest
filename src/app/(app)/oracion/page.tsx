import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getToday } from '@/lib/utils'
import { getTimezone, getConfigGrupo, getGrupoActivo } from '@/lib/grupo-helpers'
import { parseSectionConfig, computeSectionDurations } from '@/lib/prayer-sections'
import { selectGuidedIntercessionPetitions, type GuidedIntercessionPetition } from '@/lib/guided-intercession'
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
    let sectionConfigRaw: string | undefined
    if (grupoId) {
        const config = await getConfigGrupo(supabase, grupoId)
        bonusMinutos = Number(config['xp_oracion_bonus_minutos']) || 10
        bonusXp = Number(config['xp_oracion_bonus']) || 20
        sectionConfigRaw = config['oracion_secciones']
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

    // Compute guided prayer section durations from config before selecting petitions
    const sectionConfig = parseSectionConfig(sectionConfigRaw)
    const totalPrayerSeconds = dailyMission!.minutos_oracion_requeridos * 60
    const sectionDurations = computeSectionDurations(totalPrayerSeconds, sectionConfig)
    const intercessionSeconds = sectionDurations.find(section => section.key === 'intercesion')?.seconds ?? 0

    const { data: userProgress } = await supabase
        .from('progreso_usuario')
        .select('oracion_completada, segundos_oracion_acumulados')
        .eq('usuario_id', user.id)
        .eq('fecha_progreso', today)
        .single()

    // ── Fetch petitions for guided prayer flow ──
    let peticionesPropias: Array<{
        id: string
        titulo: string
        descripcion: string | null
        categoria: string
        oraciones_count: number
    }> = []

    let peticionesComunidad: Array<{
        id: string
        titulo: string
        descripcion: string | null
        categoria: string
        usuario_nombre: string
        oraciones_count: number
        creado_en: string | null
        actualizado_en: string | null
        oracion_guia: string | null
        has_prayed: boolean
    }> = []

    // Fetch user's own active petitions
    const { data: propias } = await supabase
        .from('peticiones_oracion')
        .select('id, titulo, descripcion, categoria, oraciones_count')
        .eq('usuario_id', user.id)
        .eq('estado', 'activa')
        .order('creado_en', { ascending: false })

    if (propias) {
        peticionesPropias = propias
    }

    // Fetch community petitions (if user has a group)
    if (grupoId) {
        const { data: comunidad } = await supabase
            .from('peticiones_oracion')
            .select('id, titulo, descripcion, categoria, usuario_id, oraciones_count, oracion_guia, creado_en, actualizado_en, perfiles:usuario_id(nombre_usuario)')
            .eq('grupo_id', grupoId)
            .eq('visibilidad', 'group')
            .eq('estado', 'activa')
            .neq('usuario_id', user.id)
            .order('creado_en', { ascending: false })

        if (comunidad) {
            const petitionIds = comunidad.map(p => p.id)
            const { data: prayedRows } = petitionIds.length > 0
                ? await supabase
                    .from('oraciones_por_peticion')
                    .select('peticion_id')
                    .eq('usuario_id', user.id)
                    .in('peticion_id', petitionIds)
                : { data: [] }

            const prayedPetitionIds = new Set((prayedRows ?? []).map(row => row.peticion_id))
            const candidates: GuidedIntercessionPetition[] = comunidad.map(p => {
                const perfiles = p.perfiles as { nombre_usuario: string } | { nombre_usuario: string }[] | null
                const authorName = Array.isArray(perfiles)
                    ? perfiles[0]?.nombre_usuario || 'Usuario'
                    : perfiles?.nombre_usuario || 'Usuario'

                return {
                    id: p.id,
                    titulo: p.titulo,
                    descripcion: p.descripcion,
                    categoria: p.categoria,
                    usuario_id: p.usuario_id,
                    usuario_nombre: authorName,
                    oraciones_count: p.oraciones_count,
                    creado_en: p.creado_en,
                    actualizado_en: p.actualizado_en,
                    has_prayed: prayedPetitionIds.has(p.id),
                    // Always ask the server action for a hash/perspective-validated guide.
                    // Old cached DB text may have been generated with the wrong perspective.
                    oracion_guia: null,
                }
            })

            peticionesComunidad = selectGuidedIntercessionPetitions({
                petitions: candidates,
                currentUserId: user.id,
                intercessionSeconds,
            }).map(({ id, titulo, descripcion, categoria, usuario_nombre, oraciones_count, creado_en, actualizado_en, oracion_guia, has_prayed }) => ({
                id,
                titulo,
                descripcion,
                categoria,
                usuario_nombre,
                oraciones_count,
                creado_en,
                actualizado_en: actualizado_en ?? null,
                oracion_guia: oracion_guia ?? null,
                has_prayed: Boolean(has_prayed),
            }))
        }
    }

    return (
        <OracionClient
            key={user.id}
            minutosRequeridos={dailyMission!.minutos_oracion_requeridos}
            segundosIniciales={userProgress?.segundos_oracion_acumulados || 0}
            capituloId={chapterInfo.id}
            oracionCompletada={userProgress?.oracion_completada || false}
            bonusMinutos={bonusMinutos}
            bonusXp={bonusXp}
            currentUserId={user.id}
            peticionesPropias={peticionesPropias}
            peticionesComunidad={peticionesComunidad}
            tieneGrupo={!!grupoId}
            sectionDurations={sectionDurations}
        />
    )
}
