'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ActionState } from '@/types/definitions'
import { getToday } from '@/lib/utils'
import { getTimezone, getGrupoActivo, getGroupDateBounds } from '@/lib/grupo-helpers'
import { notifyGroupMembers } from '@/lib/push-helpers'
import { getXpConfig, grantXp, calculateStreakBonus } from '@/lib/xp-helpers'

const ReadingProgressSchema = z.object({
  resumen: z.string().min(10, 'El resumen debe tener al menos 10 caracteres.'),
  capituloId: z.coerce.number(),
  capituloReferencia: z.string(), // NUEVO CAMPO
})

const OracionProgressSchema = z.object({
  segundosAcumulados: z.coerce.number().min(0),
  capituloId: z.coerce.number(),
  oracionCompletada: z.boolean(),
});

export async function registrarProgresoLecturaAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Debes iniciar sesión para registrar tu progreso.' }
  }

  const validatedFields = ReadingProgressSchema.safeParse({
    resumen: formData.get('resumen'),
    capituloId: formData.get('capituloId'),
    capituloReferencia: formData.get('capituloReferencia'), // NUEVO CAMPO
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }
  
  const { resumen, capituloId, capituloReferencia } = validatedFields.data
  const tz = await getTimezone(supabase)
  const fechaHoy = getToday(tz)

  const { error } = await supabase.from('progreso_usuario').upsert({
    usuario_id: user.id,
    fecha_progreso: fechaHoy,
    capitulo_id: capituloId,
    resumen_lectura: resumen,
    lectura_completada: true,
    lectura_completada_en: new Date().toISOString(), // AÑADIDO
  }, {
    onConflict: 'usuario_id,fecha_progreso'
  })

  if (error) {
    console.error('Error al guardar el progreso de lectura:', error)
    return { error: 'Hubo un error en la base de datos. Inténtalo de nuevo.' }
  }

  // Registrar evento en el feed de actividad
  const grupoIdForFeed = await getGrupoActivo(supabase)
  await supabase.from('actividad_comunidad').insert({
    usuario_id: user.id,
    tipo_actividad: 'lectura_completada',
    referencia_contenido: capituloReferencia,
    resumen_actividad: resumen,
    grupo_id: grupoIdForFeed,
  })

  // ─── XP System ─────────────────────────────────────────────────────────────
  const config = await getXpConfig(supabase, user.id)
  const { data: perfilXp } = await supabase.from('perfiles').select('grupo_activo_id').eq('id', user.id).single()
  const grupoId = perfilXp?.grupo_activo_id ?? undefined
  let totalXp = 0
  let lastResult: { nuevo_xp: number; nuevo_nivel: number; subio_nivel: boolean } | null = null

  // Guard: check if reading XP was already granted for this chapter
  const { data: xpYaOtorgado } = await supabase
    .from('historial_xp')
    .select('id')
    .eq('usuario_id', user.id)
    .eq('motivo', 'lectura_completada')
    .eq('referencia_id', String(capituloId))
    .limit(1)

  if (!xpYaOtorgado?.length) {
    // 1. XP por lectura completada
    lastResult = await grantXp(supabase, user.id, config.lectura_completada, 'lectura_completada', String(capituloId), grupoId)
    totalXp += config.lectura_completada

    // 2. Streak bonus
    const { data: streakData } = await supabase.rpc('get_all_user_streaks')
    const userStreak = streakData?.find((s: { user_id: string; streak_count: number }) => s.user_id === user.id)?.streak_count ?? 0
    const streakBonus = calculateStreakBonus(userStreak, config)
    if (streakBonus > 0) {
      lastResult = await grantXp(supabase, user.id, streakBonus, 'racha_bonus', `streak_${userStreak}`, grupoId)
      totalXp += streakBonus
    }

    // 3. Devocional completo bonus (lectura + oración same day)
    const { data: progressToday } = await supabase
      .from('progreso_usuario')
      .select('oracion_completada')
      .eq('usuario_id', user.id)
      .eq('fecha_progreso', fechaHoy)
      .single()
    if (progressToday?.oracion_completada) {
      // Guard: check if devocional XP was already granted today
      const { data: devocionalYaOtorgado } = await supabase
        .from('historial_xp')
        .select('id')
        .eq('usuario_id', user.id)
        .eq('motivo', 'devocional_completo')
        .eq('referencia_id', fechaHoy)
        .limit(1)

      if (!devocionalYaOtorgado?.length) {
        lastResult = await grantXp(supabase, user.id, config.devocional_completo, 'devocional_completo', fechaHoy, grupoId)
        totalXp += config.devocional_completo
      }
    }

    // Enviar notificación push a miembros del grupo (solo en primera lectura)
    if (grupoIdForFeed) {
      try {
        const { data: profile } = await supabase
          .from('perfiles')
          .select('nombre_usuario')
          .eq('id', user.id)
          .single()

        await notifyGroupMembers(grupoIdForFeed, {
          title: 'Nueva Actividad en Quest',
          body: `${profile?.nombre_usuario || 'Alguien'} ha completado su lectura de ${capituloReferencia}.`,
        }, user.id)
      } catch (err) {
        console.error('Error enviando notificaciones de lectura:', err)
      }
    }
  }

  revalidatePath('/home')
  revalidatePath('/feed')
  revalidatePath('/challenges')
  return {
    message: `¡Tu resumen ha sido guardado exitosamente! +${totalXp} XP`,
    xpGanado: totalXp,
    nuevoNivel: lastResult?.nuevo_nivel,
    subioNivel: lastResult?.subio_nivel,
  }
}

export async function actualizarProgresoOracionAction(datos: { segundosAcumulados: number, capituloId: number, oracionCompletada: boolean }): Promise<ActionState> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado.' };

  const validatedFields = OracionProgressSchema.safeParse(datos);
  if (!validatedFields.success) return { error: 'Datos inválidos.' };
  
  const { segundosAcumulados, capituloId, oracionCompletada } = validatedFields.data;
  const tz = await getTimezone(supabase)
  const fechaHoy = getToday(tz);

  const { error } = await supabase.from('progreso_usuario').upsert({
    usuario_id: user.id,
    fecha_progreso: fechaHoy,
    capitulo_id: capituloId,
    segundos_oracion_acumulados: segundosAcumulados,
    oracion_completada: oracionCompletada,
    // AÑADIDO: Guardar el timestamp solo si se completa
    ...(oracionCompletada && { oracion_completada_en: new Date().toISOString() }),
  }, { onConflict: 'usuario_id,fecha_progreso' });

  if (error) {
    console.error('Error al guardar progreso de oración:', error);
    return { error: 'Error en la base de datos.' };
  }

  // Registrar evento SOLO si la oración se ha completado y no hay entrada duplicada hoy
  // Hoisted for use in XP guard (push notification dedup)
  let existingActivity: { id: string; referencia_contenido: string | null }[] | null = null
  const grupoIdForConfig = await getGrupoActivo(supabase)

  if (oracionCompletada) {
    // Check if we already posted a prayer activity today (timezone-aware bounds)
    const { start: todayStart, end: todayEnd } = getGroupDateBounds(tz)
    const { data } = await supabase
      .from('actividad_comunidad')
      .select('id, referencia_contenido')
      .eq('usuario_id', user.id)
      .eq('tipo_actividad', 'oracion_completada')
      .gte('creado_en', todayStart)
      .lte('creado_en', todayEnd)
      .limit(1)
    existingActivity = data

    // Detect bonus: check if seconds exceed bonus threshold
    let bonusAchieved = false
    if (grupoIdForConfig) {
      const { getConfigGrupo } = await import('@/lib/grupo-helpers')
      const config = await getConfigGrupo(supabase, grupoIdForConfig)
      const bonusMinutos = Number(config['xp_oracion_bonus_minutos']) || 10
      bonusAchieved = segundosAcumulados >= bonusMinutos * 60
    }

    if (!existingActivity?.length) {
      // First prayer completion today — insert
      await supabase.from('actividad_comunidad').insert({
        usuario_id: user.id,
        tipo_actividad: 'oracion_completada',
        referencia_contenido: bonusAchieved ? 'Tiempo de Oración + Bonus 🔥' : 'Tiempo de Oración',
        resumen_actividad: bonusAchieved
          ? 'Ha completado su tiempo de oración con bonus extra.'
          : 'Ha completado su tiempo de oración de hoy.',
        grupo_id: grupoIdForConfig,
      })
    } else if (bonusAchieved && !existingActivity[0].referencia_contenido?.includes('Bonus')) {
      // Already posted, but bonus just achieved — update the existing entry
      await supabase.from('actividad_comunidad')
        .update({
          referencia_contenido: 'Tiempo de Oración + Bonus 🔥',
          resumen_actividad: 'Ha completado su tiempo de oración con bonus extra.',
        })
        .eq('id', existingActivity[0].id)
    }
  }

  // ─── XP System ─────────────────────────────────────────────────────────────
  const { data: perfilXpOracion } = await supabase.from('perfiles').select('grupo_activo_id').eq('id', user.id).single()
  const grupoId = perfilXpOracion?.grupo_activo_id ?? undefined
  let totalXp = 0
  let lastResult: { nuevo_xp: number; nuevo_nivel: number; subio_nivel: boolean } | null = null

  if (oracionCompletada) {
    const config = await getXpConfig(supabase, user.id)

    // Guard: check if prayer XP was already granted for this chapter
    const { data: xpOracionYaOtorgado } = await supabase
      .from('historial_xp')
      .select('id')
      .eq('usuario_id', user.id)
      .eq('motivo', 'oracion_completada')
      .eq('referencia_id', String(capituloId))
      .limit(1)

    if (!xpOracionYaOtorgado?.length) {
      // 1. XP por oración completada
      lastResult = await grantXp(supabase, user.id, config.oracion_completada, 'oracion_completada', String(capituloId), grupoId)
      totalXp += config.oracion_completada

      // 2. Bonus si oración supera el umbral configurable (default: 10 minutos)
      const umbralSegundos = (config.oracion_bonus_minutos || 10) * 60
      if (segundosAcumulados >= umbralSegundos) {
        lastResult = await grantXp(supabase, user.id, config.oracion_bonus_10min, 'oracion_bonus_10min', undefined, grupoId)
        totalXp += config.oracion_bonus_10min
      }

      // 3. Devocional completo bonus (lectura + oración same day)
      const { data: progressToday } = await supabase
        .from('progreso_usuario')
        .select('lectura_completada')
        .eq('usuario_id', user.id)
        .eq('fecha_progreso', fechaHoy)
        .single()
      if (progressToday?.lectura_completada) {
        // Guard: check if devocional XP was already granted today
        const { data: devocionalYaOtorgado } = await supabase
          .from('historial_xp')
          .select('id')
          .eq('usuario_id', user.id)
          .eq('motivo', 'devocional_completo')
          .eq('referencia_id', fechaHoy)
          .limit(1)

        if (!devocionalYaOtorgado?.length) {
          lastResult = await grantXp(supabase, user.id, config.devocional_completo, 'devocional_completo', fechaHoy, grupoId)
          totalXp += config.devocional_completo
        }
      }

      // Enviar notificación push a miembros del grupo (solo en primera oración del día)
      if (grupoIdForConfig && !existingActivity?.length) {
        try {
          const { data: profile } = await supabase
            .from('perfiles')
            .select('nombre_usuario')
            .eq('id', user.id)
            .single()

          await notifyGroupMembers(grupoIdForConfig, {
            title: 'Nueva Actividad en Quest',
            body: `${profile?.nombre_usuario || 'Alguien'} ha completado su tiempo de oración.`,
          }, user.id)
        } catch (err) {
          console.error('Error enviando notificaciones de oración:', err)
        }
      }
    }
  }

  revalidatePath('/home');
  revalidatePath('/feed');
  revalidatePath('/challenges');

  if (totalXp > 0) {
    return {
      message: `Progreso guardado. +${totalXp} XP`,
      xpGanado: totalXp,
      nuevoNivel: lastResult?.nuevo_nivel,
      subioNivel: lastResult?.subio_nivel,
    }
  }
  return { message: 'Progreso guardado.' };
}
