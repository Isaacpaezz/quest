'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ActionState } from '@/types/definitions'
import { getToday } from '@/lib/utils'
import { getTimezone } from '@/lib/grupo-helpers'
import { pushService } from '@/lib/web-push'
import { createAdminClient } from '@/lib/supabase/admin'
import { getXpConfig, grantXp, calculateStreakBonus } from '@/lib/xp-helpers'
import type { PushSubscription as WebPushSubscription } from 'web-push'

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

  // NUEVO: Registrar evento en el feed de actividad
  await supabase.from('actividad_comunidad').insert({
    usuario_id: user.id,
    tipo_actividad: 'lectura_completada',
    referencia_contenido: capituloReferencia,
    resumen_actividad: resumen, // AÑADIDO
  })

  // Enviar notificaciones push a otros miembros suscritos (no al emisor)
  try {
    const { data: profile } = await supabase
      .from('perfiles')
      .select('nombre_usuario')
      .eq('id', user.id)
      .single()

    const payload = JSON.stringify({
      title: 'Nueva Actividad en Quest',
      body: `${profile?.nombre_usuario || 'Alguien'} ha completado su lectura de ${capituloReferencia}.`
    })

    // Intentar usar cliente admin (service role) para leer suscripciones de otros (RLS bypass)
    const admin = createAdminClient()
    let subscriptions: unknown[] | null = null
    if (admin) {
      const { data, error: subsErr } = await admin
        .from('suscripciones_push')
        .select('subscription, usuario_id')
      if (!subsErr) subscriptions = data as unknown[]
    } else {
      // Sin service role: usar RPC SECURITY DEFINER para obtener todas las suscripciones
      const { data, error: rpcErr } = await supabase.rpc('get_all_push_subscriptions')
      if (!rpcErr) subscriptions = (data as unknown[]) || []
    }

    type WebPushSub = {
      endpoint: string
      expirationTime?: number | null
      keys?: { p256dh?: string | null; auth?: string | null }
    }
    let subs: Array<{ subscription: WebPushSub; usuario_id: string }> =
      Array.isArray(subscriptions) ? (subscriptions as Array<{ subscription: WebPushSub; usuario_id: string }>) : []

    // Fallback: si no hay suscripciones (por RLS o porque no hay nadie suscrito), te notificamos a ti para probar E2E
    if (!subs.length) {
      const { data: own } = await supabase
        .from('suscripciones_push')
        .select('subscription, usuario_id')
        .eq('usuario_id', user.id)
        .single()
      if (own?.subscription) subs = [{ subscription: own.subscription as WebPushSub, usuario_id: user.id }]
    }

    if (subs.length) {
      await Promise.all(
        subs.map((s) =>
          pushService
            .sendNotification(s.subscription as unknown as WebPushSubscription, payload)
            .catch(async (err: Error & { statusCode?: number }) => {
              console.error('Error sending notification:', err)
              if (err.statusCode === 410 || err.statusCode === 404) {
                // Subscription expired or gone, remove it
                const admin = createAdminClient()
                if (admin) {
                  await admin
                    .from('suscripciones_push')
                    .delete()
                    .eq('usuario_id', s.usuario_id)
                    .eq('subscription->>endpoint', s.subscription.endpoint)
                }
              }
            })
        )
      )
    }
  } catch (err) {
    console.error('Error preparando o enviando notificaciones de lectura:', err)
  }

  // ─── XP System ─────────────────────────────────────────────────────────────
  const config = await getXpConfig(supabase, user.id)
  const { data: perfilXp } = await supabase.from('perfiles').select('grupo_activo_id').eq('id', user.id).single()
  const grupoId = perfilXp?.grupo_activo_id ?? undefined
  let totalXp = 0
  let lastResult: { nuevo_xp: number; nuevo_nivel: number; subio_nivel: boolean } | null = null

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
    lastResult = await grantXp(supabase, user.id, config.devocional_completo, 'devocional_completo', undefined, grupoId)
    totalXp += config.devocional_completo
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
  const fechaHoy = getToday(await getTimezone(supabase));

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

  // NUEVO: Registrar evento SOLO si la oración se ha completado
  if (oracionCompletada) {
    await supabase.from('actividad_comunidad').insert({
      usuario_id: user.id,
      tipo_actividad: 'oracion_completada',
      // Añadimos un resumen para que la actividad muestre un texto similar
      // al de las lecturas cuando se complete la oración.
      referencia_contenido: 'Tiempo de Oración',
      resumen_actividad: 'Ha completado su tiempo de oración de hoy.'
    })

    // Enviar notificaciones push a otros miembros suscritos (no al emisor)
    try {
      const { data: profile } = await supabase
        .from('perfiles')
        .select('nombre_usuario')
        .eq('id', user.id)
        .single()

      const payload = JSON.stringify({
        title: 'Nueva Actividad en Quest',
        body: `${profile?.nombre_usuario || 'Alguien'} ha completado su tiempo de oración.`
      })

      const admin = createAdminClient()
      let subscriptions: unknown[] | null = null
      if (admin) {
        const { data, error: subsErr } = await admin
          .from('suscripciones_push')
          .select('subscription, usuario_id')
        if (!subsErr) subscriptions = data as unknown[]
      } else {
        const { data, error: rpcErr } = await supabase.rpc('get_all_push_subscriptions')
        if (!rpcErr) subscriptions = (data as unknown[]) || []
      }

      type WebPushSub = {
        endpoint: string
        expirationTime?: number | null
        keys?: { p256dh?: string | null; auth?: string | null }
      }
      let subs: Array<{ subscription: WebPushSub; usuario_id: string }> =
        Array.isArray(subscriptions) ? (subscriptions as Array<{ subscription: WebPushSub; usuario_id: string }>) : []

      if (!subs.length) {
        const { data: own } = await supabase
          .from('suscripciones_push')
          .select('subscription, usuario_id')
          .eq('usuario_id', user.id)
          .single()
        if (own?.subscription) subs = [{ subscription: own.subscription as WebPushSub, usuario_id: user.id }]
      }

      if (subs.length) {
        await Promise.all(
          subs.map((s) =>
            pushService
              .sendNotification(s.subscription as unknown as WebPushSubscription, payload)
              .catch((err: unknown) => {
                console.error('Error sending notification:', err)
              })
          )
        )
      }
    } catch (err) {
      console.error('Error preparando o enviando notificaciones de oración:', err)
    }
  }

  // ─── XP System ─────────────────────────────────────────────────────────────
  const { data: perfilXpOracion } = await supabase.from('perfiles').select('grupo_activo_id').eq('id', user.id).single()
  const grupoId = perfilXpOracion?.grupo_activo_id ?? undefined
  let totalXp = 0
  let lastResult: { nuevo_xp: number; nuevo_nivel: number; subio_nivel: boolean } | null = null

  if (oracionCompletada) {
    const config = await getXpConfig(supabase, user.id)

    // 1. XP por oración completada
    lastResult = await grantXp(supabase, user.id, config.oracion_completada, 'oracion_completada', String(capituloId), grupoId)
    totalXp += config.oracion_completada

    // 2. Bonus si oración > 10 minutos (600 segundos)
    if (segundosAcumulados >= 600) {
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
      lastResult = await grantXp(supabase, user.id, config.devocional_completo, 'devocional_completo', undefined, grupoId)
      totalXp += config.devocional_completo
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
