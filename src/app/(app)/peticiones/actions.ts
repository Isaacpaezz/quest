'use server'

import { createClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const crearPeticionSchema = z.object({
  titulo: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(120, 'El título no puede exceder 120 caracteres'),
  descripcion: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional()
    .nullable(),
  categoria: z.enum(['salud', 'familia', 'trabajo', 'espiritual', 'urgente', 'otro']),
  visibilidad: z.enum(['private', 'group']).default('group'),
})

const actualizarPeticionSchema = z.object({
  titulo: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(120, 'El título no puede exceder 120 caracteres')
    .optional(),
  descripcion: z
    .string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional()
    .nullable(),
  categoria: z.enum(['salud', 'familia', 'trabajo', 'espiritual', 'urgente', 'otro']).optional(),
  visibilidad: z.enum(['private', 'group']).optional(),
})

const generarOracionesGuiaBatchSchema = z.array(z.string().uuid()).max(20)

type PeticionGuiaContext = {
  id: string
  titulo: string
  descripcion: string | null
  categoria: string
  usuario_id: string
  usuario_nombre: string
  oracion_guia: string | null
  oracion_guia_context_hash: string | null
}

type ActualizacionGuiaContext = {
  peticion_id: string
  tipo: string
  texto: string
  testimonio_texto?: string | null
  creado_en: string
}

const OPENAI_PRAYER_SYSTEM_PROMPT = `Sos un asistente que ayuda a redactar oraciones cristianas comunitarias en español.
Tono: cálido, reverente, sensible y esperanzador.
Reglas: no inventes hechos; usa solo el contexto provisto; no des consejo médico, financiero ni legal; no prometas resultados; no digas "Dios dijo" ni uses certeza profética; no menciones que sos IA.
Formato: una sola oración para repetir en voz alta, de 70 a 120 palabras.`

function normalizePrayerText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function buildContextHash(
  peticion: Pick<PeticionGuiaContext, 'titulo' | 'descripcion' | 'categoria' | 'usuario_nombre'>,
  updates: ActualizacionGuiaContext[],
  perspective: 'own' | 'intercession'
) {
  return createHash('sha256')
    .update(JSON.stringify({
      titulo: peticion.titulo,
      descripcion: peticion.descripcion ?? '',
      categoria: peticion.categoria,
      usuario_nombre: peticion.usuario_nombre,
      perspective,
      updates: updates.map(update => ({
        tipo: update.tipo,
        texto: update.texto,
        creado_en: update.creado_en,
      })),
    }))
    .digest('hex')
}

function buildPrayerPrompt(
  peticion: PeticionGuiaContext,
  updates: ActualizacionGuiaContext[],
  perspective: 'own' | 'intercession'
): string {
  const latestUpdates = updates.length
    ? updates.map((update, index) => {
      const testimony = update.testimonio_texto ? ` Testimonio: ${update.testimonio_texto}` : ''
      return `${index + 1}. [${update.tipo}] ${update.texto}${testimony}`
    }).join('\n')
    : 'Sin actualizaciones recientes.'
  const perspectiveInstruction = perspective === 'own'
    ? 'La persona que ora es autora de esta petición. Redactá en primera persona singular, como una oración propia: "Señor, te presento mi petición...".'
    : `La persona que ora está intercediendo por ${peticion.usuario_nombre}. Redactá en primera persona plural o comunitaria: "Señor, te pedimos por ${peticion.usuario_nombre}...". No escribas como si la necesidad fuera de quien está orando.`

  return `Redactá una oración guía para una petición comunitaria.

Perspectiva: ${perspectiveInstruction}

Título: ${peticion.titulo}
Persona que hizo la petición: ${peticion.usuario_nombre}
Categoría: ${peticion.categoria}
Descripción: ${peticion.descripcion || 'Sin descripción adicional.'}
Últimas actualizaciones:
${latestUpdates}`
}

function buildFallbackPrayer(
  peticion: PeticionGuiaContext,
  updates: ActualizacionGuiaContext[],
  perspective: 'own' | 'intercession'
): string {
  if (perspective === 'own') {
    const descripcion = peticion.descripcion
      ? `También te presento esta situación: ${peticion.descripcion}.`
      : 'También te presento los detalles que quizá no sé expresar completamente.'
    const latestUpdate = updates[0]?.texto
      ? `Recuerdo la actualización más reciente: ${updates[0].texto}.`
      : 'Te pido sabiduría, fortaleza y paz para caminar este proceso.'

    return normalizePrayerText(
      `Señor, te presento mi petición: ${peticion.titulo}. ${descripcion} ${latestUpdate} Acompañame con tu paz, tu consuelo y tu dirección. Ayudame a caminar este proceso con fe, sin perder la esperanza, confiando en tu cuidado y en tu presencia cercana. Dame sabiduría para cada paso y un corazón sensible para recibir tu fortaleza. Amén.`
    )
  }

  const descripcion = peticion.descripcion
    ? `También presentamos esta situación: ${peticion.descripcion}.`
    : 'También presentamos los detalles que quizá no conocemos completamente.'
  const latestUpdate = updates[0]?.texto
    ? `Recordamos la actualización más reciente: ${updates[0].texto}.`
    : 'Pedimos sabiduría, fortaleza y paz para caminar este proceso.'

  return normalizePrayerText(
    `Señor, te pedimos por ${peticion.usuario_nombre} y por esta petición: ${peticion.titulo}. ${descripcion} ${latestUpdate} Acompañá a ${peticion.usuario_nombre} y a quienes le rodean con tu paz, tu consuelo y tu dirección. Ayudanos a interceder con amor, sin asumir lo que no sabemos, confiando en tu cuidado y en tu presencia cercana. Amén.`
  )
}

async function generatePrayerWithOpenAI(
  peticion: PeticionGuiaContext,
  updates: ActualizacionGuiaContext[],
  perspective: 'own' | 'intercession'
) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_PRAYER_MODEL || 'gpt-4.1-mini',
        input: [
          { role: 'system', content: OPENAI_PRAYER_SYSTEM_PROMPT },
          { role: 'user', content: buildPrayerPrompt(peticion, updates, perspective) },
        ],
        max_output_tokens: 220,
      }),
    })

    if (!response.ok) {
      console.error('OpenAI prayer generation failed:', response.status, await response.text())
      return null
    }

    const payload = await response.json() as {
      output_text?: string
      output?: Array<{ content?: Array<{ text?: string }> }>
    }
    const generated = payload.output_text
      ?? payload.output?.flatMap(item => item.content ?? []).map(content => content.text).find(Boolean)

    return generated ? normalizePrayerText(generated) : null
  } catch (error) {
    console.error('Error generating prayer with OpenAI:', error)
    return null
  }
}

// ─── Server Actions ──────────────────────────────────────────────────────────

/**
 * crearPeticionAction
 * Crea una nueva petición de oración.
 * Si visibilidad es 'group', el trigger set_peticion_grupo_id asigna el grupo automáticamente.
 * Si es 'group', también crea una entrada en actividad_comunidad para el feed.
 */
export async function crearPeticionAction(
  data: z.infer<typeof crearPeticionSchema>
) {
  try {
    const supabase = await createClient()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado' }
    }

    // Validate input
    const parsed = crearPeticionSchema.safeParse(data)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]
      return { success: false, error: firstError?.message ?? 'Datos inválidos' }
    }

    const { titulo, descripcion, categoria, visibilidad } = parsed.data

    // Check: if visibilidad is 'group', user must have an active group
    if (visibilidad === 'group') {
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('grupo_activo_id')
        .eq('id', user.id)
        .single()

      if (!perfil?.grupo_activo_id) {
        return {
          success: false,
          error: 'Necesitás un grupo activo para compartir peticiones',
        }
      }
    }

    // Insert petition
    const { data: peticion, error: insertError } = await supabase
      .from('peticiones_oracion')
      .insert({
        usuario_id: user.id,
        titulo,
        descripcion: descripcion || null,
        categoria,
        visibilidad,
      })
      .select('id, grupo_id')
      .single()

    if (insertError) {
      console.error('Error creando petición:', insertError)
      return { success: false, error: 'Error al crear la petición' }
    }

    // If shared with group, create feed entry + grant XP
    if (visibilidad === 'group' && peticion.grupo_id) {
      await supabase.from('actividad_comunidad').insert({
        usuario_id: user.id,
        tipo_actividad: 'peticion_compartida',
        referencia_contenido: peticion.id,
        resumen_actividad: titulo,
        grupo_id: peticion.grupo_id,
      })

      // Grant XP for sharing petition with group
      try {
        const { getXpConfig, grantXp } = await import('@/lib/xp-helpers')
        const xpConfig = await getXpConfig(supabase, user.id)
        await grantXp(
          supabase,
          user.id,
          xpConfig.peticion_compartida,
          'peticion_compartida',
          peticion.id,
          peticion.grupo_id
        )
      } catch (xpErr) {
        console.error('Error otorgando XP por petición compartida:', xpErr)
      }
    }

    revalidatePath('/peticiones')
    revalidatePath('/peticiones/mis-peticiones')
    revalidatePath('/feed')

    return { success: true, peticionId: peticion.id }
  } catch (error) {
    console.error('Error en crearPeticionAction:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * actualizarPeticionAction
 * Actualiza una petición existente (solo el creador).
 */
export async function actualizarPeticionAction(
  peticionId: string,
  data: z.infer<typeof actualizarPeticionSchema>
) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado' }
    }

    const parsed = actualizarPeticionSchema.safeParse(data)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]
      return { success: false, error: firstError?.message ?? 'Datos inválidos' }
    }

    // Verify ownership
    const { data: peticion } = await supabase
      .from('peticiones_oracion')
      .select('usuario_id')
      .eq('id', peticionId)
      .single()

    if (!peticion || peticion.usuario_id !== user.id) {
      return { success: false, error: 'No tenés permiso para editar esta petición' }
    }

    const updateData: Record<string, unknown> = {
      actualizado_en: new Date().toISOString(),
    }

    if (parsed.data.titulo !== undefined) updateData.titulo = parsed.data.titulo
    if (parsed.data.descripcion !== undefined) updateData.descripcion = parsed.data.descripcion
    if (parsed.data.categoria !== undefined) updateData.categoria = parsed.data.categoria
    if (parsed.data.visibilidad !== undefined) {
      updateData.visibilidad = parsed.data.visibilidad

      // When changing visibility, also update grupo_id
      if (parsed.data.visibilidad === 'group') {
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('grupo_activo_id')
          .eq('id', user.id)
          .single()

        if (!perfil?.grupo_activo_id) {
          return {
            success: false,
            error: 'Necesitás un grupo activo para compartir peticiones',
          }
        }
        updateData.grupo_id = perfil.grupo_activo_id
      } else if (parsed.data.visibilidad === 'private') {
        updateData.grupo_id = null

        // Hide existing group feed entries without deleting production data.
        const { createAdminClient } = await import('@/lib/supabase/admin')
        const admin = createAdminClient()
        if (!admin) {
          return { success: false, error: 'No se pudo actualizar la privacidad del feed' }
        }
        const { error: feedScrubError } = await admin
          .from('actividad_comunidad')
          .update({
            grupo_id: null,
            resumen_actividad: 'Petición privada',
          })
          .eq('referencia_contenido', peticionId)
          .in('tipo_actividad', ['peticion_compartida', 'peticion_respondida'])

        if (feedScrubError) {
          console.error('Error ocultando petición del feed:', feedScrubError)
          return { success: false, error: 'Error al actualizar la privacidad del feed' }
        }
      }
    }

    const { error: updateError } = await supabase
      .from('peticiones_oracion')
      .update(updateData)
      .eq('id', peticionId)

    if (updateError) {
      console.error('Error actualizando petición:', updateError)
      return { success: false, error: 'Error al actualizar la petición' }
    }

    revalidatePath('/peticiones')
    revalidatePath('/peticiones/mis-peticiones')
    revalidatePath(`/peticiones/${peticionId}`)
    revalidatePath('/feed')

    return { success: true }
  } catch (error) {
    console.error('Error en actualizarPeticionAction:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * eliminarPeticionAction
 * Soft-delete: cambia estado a 'archivada' (no borra datos).
 */
export async function eliminarPeticionAction(peticionId: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado' }
    }

    // Verify ownership
    const { data: peticion } = await supabase
      .from('peticiones_oracion')
      .select('usuario_id, estado')
      .eq('id', peticionId)
      .single()

    if (!peticion || peticion.usuario_id !== user.id) {
      return { success: false, error: 'No tenés permiso para eliminar esta petición' }
    }

    if (peticion.estado === 'archivada') {
      return { success: false, error: 'La petición ya fue archivada' }
    }

    // Soft delete: archive and make owner-only without deleting production data.
    const { error: updateError } = await supabase
      .from('peticiones_oracion')
      .update({
        estado: 'archivada',
        visibilidad: 'private',
        grupo_id: null,
        actualizado_en: new Date().toISOString(),
      })
      .eq('id', peticionId)

    if (updateError) {
      console.error('Error archivando petición:', updateError)
      return { success: false, error: 'Error al eliminar la petición' }
    }

    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = createAdminClient()
    if (!admin) {
      return { success: false, error: 'No se pudo ocultar la petición del feed' }
    }
    const { error: feedScrubError } = await admin
      .from('actividad_comunidad')
      .update({
        grupo_id: null,
        resumen_actividad: 'Petición archivada',
      })
      .eq('referencia_contenido', peticionId)
      .in('tipo_actividad', ['peticion_compartida', 'peticion_respondida'])

    if (feedScrubError) {
      console.error('Error ocultando petición archivada del feed:', feedScrubError)
      return { success: false, error: 'Error al ocultar la petición del feed' }
    }

    revalidatePath('/peticiones')
    revalidatePath('/peticiones/mis-peticiones')
    revalidatePath('/feed')

    return { success: true }
  } catch (error) {
    console.error('Error en eliminarPeticionAction:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * getMyPetitionsAction
 * Obtiene las peticiones del usuario autenticado, con filtro opcional por estado.
 */
export async function getMyPetitionsAction(filtro?: {
  estado?: 'activa' | 'respondida' | 'archivada'
}) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado', peticiones: [] }
    }

    let query = supabase
      .from('peticiones_oracion')
      .select('*')
      .eq('usuario_id', user.id)
      .order('estado', { ascending: true }) // activa first
      .order('creado_en', { ascending: false })

    if (filtro?.estado) {
      query = query.eq('estado', filtro.estado)
    }

    const { data: peticiones, error } = await query

    if (error) {
      console.error('Error obteniendo peticiones:', error)
      return { success: false, error: 'Error al cargar peticiones', peticiones: [] }
    }

    return { success: true, peticiones: peticiones || [] }
  } catch (error) {
    console.error('Error en getMyPetitionsAction:', error)
    return { success: false, error: 'Error inesperado', peticiones: [] }
  }
}

// ─── Intercession Actions ─────────────────────────────────────────────────────

/**
 * orarPorPeticionAction
 * Registra que el usuario oró por una petición.
 * - INSERT en oraciones_por_peticion (UNIQUE constraint previene duplicados)
 * - Trigger incrementa oraciones_count automáticamente
 * - Otorga XP de intercesión (con cap diario)
 * - Envía push notification al autor de la petición
 * - Crea entrada en actividad_comunidad si la petición es respondida
 */
export async function orarPorPeticionAction(peticionId: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado' }
    }

    // Verify petition exists and is active
    const { data: peticion } = await supabase
      .from('peticiones_oracion')
      .select('id, usuario_id, titulo, estado, grupo_id, visibilidad')
      .eq('id', peticionId)
      .single()

    if (!peticion || peticion.estado !== 'activa') {
      return { success: false, error: 'Petición no encontrada o no activa' }
    }

    // Server-side guard: users cannot pray for their own petitions.
    const isSelfIntercession = peticion.usuario_id === user.id
    if (isSelfIntercession) {
      return { success: false, error: 'No podés orar por tu propia petición' }
    }

    // Check if user already prayed (lifetime uniqueness)
    const { data: existing } = await supabase
      .from('oraciones_por_peticion')
      .select('id')
      .eq('peticion_id', peticionId)
      .eq('usuario_id', user.id)
      .single()

    if (existing) {
      return { success: false, error: 'Ya oraste por esta petición' }
    }

    // Calculate XP eligibility BEFORE inserting the current prayer.
    let shouldGrantIntercessionXp = false
    try {
      const { getXpConfig } = await import('@/lib/xp-helpers')
      const xpConfig = await getXpConfig(supabase, user.id)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const admin = createAdminClient()
      const xpReadClient = admin ?? supabase
      const { data: todayPrayers } = await xpReadClient
        .from('oraciones_por_peticion')
        .select('id')
        .eq('usuario_id', user.id)
        .gte('creado_en', today.toISOString())

      const todayXp = (todayPrayers?.length || 0) * xpConfig.intercesion
      shouldGrantIntercessionXp = todayXp + xpConfig.intercesion <= xpConfig.intercesion_daily_cap
    } catch (xpErr) {
      console.error('Error calculando elegibilidad XP por intercesión:', xpErr)
    }

    // Insert intercession record (trigger increments oraciones_count)
    const { error: insertError } = await supabase
      .from('oraciones_por_peticion')
      .insert({
        peticion_id: peticionId,
        usuario_id: user.id,
      })

    if (insertError) {
      // Unique constraint violation = duplicate prayer
      if (insertError.code === '23505') {
        return { success: false, error: 'Ya oraste por esta petición' }
      }
      console.error('Error registrando intercesión:', insertError)
      return { success: false, error: 'Error al registrar la oración' }
    }

    // Grant XP (only for praying for others' petitions, with daily cap)
    if (!isSelfIntercession) {
      try {
        const { getXpConfig, grantXp } = await import('@/lib/xp-helpers')
        const xpConfig = await getXpConfig(supabase, user.id)

      if (shouldGrantIntercessionXp) {
        await grantXp(
            supabase,
            user.id,
            xpConfig.intercesion,
            'intercesion',
            peticionId,
            peticion.grupo_id || undefined
          )
        }
      } catch (xpErr) {
        // Don't fail the prayer if XP fails
        console.error('Error otorgando XP por intercesión:', xpErr)
      }
    }

    // Send push notification to petition author only
    if (!isSelfIntercession) {
      try {
        // Get the pray-er's name
        const { data: perfil } = await supabase
          .from('perfiles')
          .select('nombre_usuario')
          .eq('id', user.id)
          .single()

        const nombre = perfil?.nombre_usuario || 'Alguien'

        // Send notification only to the petition author
        const { notifyUsers } = await import('@/lib/push-helpers')
        await notifyUsers(
          [peticion.usuario_id],
          {
            title: 'Oraron por tu petición',
            body: `${nombre} oró por tu petición: ${peticion.titulo}`,
          },
          user.id
        )
      } catch (notifErr) {
        // Don't fail the prayer if notification fails
        console.error('Error enviando notificación de intercesión:', notifErr)
      }
    }

    revalidatePath('/peticiones')
    revalidatePath(`/peticiones/${peticionId}`)
    revalidatePath('/feed')

    return { success: true }
  } catch (error) {
    console.error('Error en orarPorPeticionAction:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * hasUserPrayedAction
 * Verifica si el usuario ya oró por una petición específica.
 */
export async function hasUserPrayedAction(peticionId: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, prayed: false }
    }

    const { data } = await supabase
      .from('oraciones_por_peticion')
      .select('id')
      .eq('peticion_id', peticionId)
      .eq('usuario_id', user.id)
      .single()

    return { success: true, prayed: !!data }
  } catch {
    return { success: true, prayed: false }
  }
}

/**
 * getCommunityWallAction
 * Obtiene peticiones visibles para el grupo del usuario.
 * Orden: urgentes primero, luego más recientes, luego menos oradas.
 */
export async function getCommunityWallAction() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado', peticiones: [] }
    }

    // Get user's active group
    const { data: perfil } = await supabase
      .from('perfiles')
      .select('grupo_activo_id')
      .eq('id', user.id)
      .single()

    if (!perfil?.grupo_activo_id) {
      return { success: true, peticiones: [] }
    }

    // Fetch group-visible active petitions
    const { data: peticiones, error } = await supabase
      .from('peticiones_oracion')
      .select('*, perfiles:usuario_id(nombre_usuario)')
      .eq('grupo_id', perfil.grupo_activo_id)
      .eq('visibilidad', 'group')
      .eq('estado', 'activa')
      .order('categoria', { ascending: false }) // urgente sorts first alphabetically? No...
      .order('creado_en', { ascending: false })

    if (error) {
      console.error('Error obteniendo muro comunitario:', error)
      return { success: false, error: 'Error al cargar peticiones', peticiones: [] }
    }

    // Sort: urgente first, then by oraciones_count ascending (least prayed), then by date
    const sorted = (peticiones || []).sort((a, b) => {
      // Urgente category first
      const aUrgente = a.categoria === 'urgente' ? 0 : 1
      const bUrgente = b.categoria === 'urgente' ? 0 : 1
      if (aUrgente !== bUrgente) return aUrgente - bUrgente

      // Then least prayed-for first
      if (a.oraciones_count !== b.oraciones_count) {
        return a.oraciones_count - b.oraciones_count
      }

      // Then most recent first
      return new Date(b.creado_en).getTime() - new Date(a.creado_en).getTime()
    })

    // Check which petitions the current user has prayed for
    const peticionIds = sorted.map(p => p.id)
    if (peticionIds.length === 0) {
      return { success: true, peticiones: [] }
    }

    const { data: userPrayers } = await supabase
      .from('oraciones_por_peticion')
      .select('peticion_id')
      .eq('usuario_id', user.id)
      .in('peticion_id', peticionIds)

    const prayedSet = new Set((userPrayers || []).map(p => p.peticion_id))

    // Add author info and prayer status
    const enriched = sorted.map(p => {
      const perfiles = p.perfiles as { nombre_usuario: string } | { nombre_usuario: string }[] | null
      const authorName = Array.isArray(perfiles)
        ? perfiles[0]?.nombre_usuario || 'Usuario'
        : perfiles?.nombre_usuario || 'Usuario'

      return {
        ...p,
        author_name: authorName,
        ya_oro: prayedSet.has(p.id),
      }
    })

    return { success: true, peticiones: enriched }
  } catch (error) {
    console.error('Error en getCommunityWallAction:', error)
    return { success: false, error: 'Error inesperado', peticiones: [] }
  }
}

// ─── Update Actions ──────────────────────────────────────────────────────────

const crearActualizacionSchema = z.object({
  tipo: z.enum(['progreso', 'resuelto', 'testimonio']),
  texto: z
    .string()
    .min(1, 'El texto es requerido')
    .max(300, 'El texto no puede exceder 300 caracteres'),
  testimonio_texto: z
    .string()
    .max(1000, 'El testimonio no puede exceder 1000 caracteres')
    .optional()
    .nullable(),
  testimonio_publico: z.boolean().default(false),
})

/**
 * crearActualizacionPeticionAction
 * Crea una actualización en la timeline de una petición.
 * Si tipo es 'resuelto', marca la petición como respondida.
 */
export async function crearActualizacionPeticionAction(
  peticionId: string,
  data: z.infer<typeof crearActualizacionSchema>
) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado' }
    }

    const parsed = crearActualizacionSchema.safeParse(data)
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]
      return { success: false, error: firstError?.message ?? 'Datos inválidos' }
    }

    // Verify ownership
    const { data: peticion } = await supabase
      .from('peticiones_oracion')
      .select('id, usuario_id, estado, grupo_id, titulo, visibilidad')
      .eq('id', peticionId)
      .single()

    if (!peticion || peticion.usuario_id !== user.id) {
      return { success: false, error: 'No tenés permiso para actualizar esta petición' }
    }

    if (peticion.estado !== 'activa') {
      return { success: false, error: 'Solo se pueden actualizar peticiones activas' }
    }

    const { tipo, texto, testimonio_texto, testimonio_publico } = parsed.data

    // Insert update record
    const { error: insertError } = await supabase
      .from('actualizaciones_peticion')
      .insert({
        peticion_id: peticionId,
        usuario_id: user.id,
        tipo,
        texto,
        testimonio_texto: testimonio_texto || null,
        testimonio_publico: testimonio_publico ?? false,
      })

    if (insertError) {
      console.error('Error creando actualización:', insertError)
      return { success: false, error: 'Error al crear la actualización' }
    }

    // If resolved, update petition state
    if (tipo === 'resuelto') {
      const { error: updateError } = await supabase
        .from('peticiones_oracion')
        .update({
          estado: 'respondida',
          respondida_en: new Date().toISOString(),
          actualizado_en: new Date().toISOString(),
        })
        .eq('id', peticionId)

      if (updateError) {
        console.error('Error marcando petición como respondida:', updateError)
      }

      // Create feed entry if testimony is public
      if (testimonio_publico && peticion.visibilidad === 'group' && peticion.grupo_id) {
        await supabase.from('actividad_comunidad').insert({
          usuario_id: user.id,
          tipo_actividad: 'peticion_respondida',
          referencia_contenido: peticionId,
          resumen_actividad: testimonio_texto || texto,
          grupo_id: peticion.grupo_id,
        })
      }

      // Notify only intercessors while the petition remains group-visible.
      if (peticion.visibilidad === 'group' && peticion.grupo_id) {
        try {
          const { data: intercessors } = await supabase
            .from('oraciones_por_peticion')
            .select('usuario_id')
            .eq('peticion_id', peticionId)
            .neq('usuario_id', user.id)

          if (intercessors?.length) {
            const intercessorIds = intercessors.map(i => i.usuario_id)
            const { notifyUsers } = await import('@/lib/push-helpers')
            await notifyUsers(
              intercessorIds,
              {
                title: '¡Petición respondida! 🙏',
                body: `Una petición por la que oraste fue respondida: ${peticion.titulo}`,
              },
              user.id
            )
          }
        } catch (notifErr) {
          console.error('Error notificando respuesta de petición:', notifErr)
        }
      }

      // Grant testimony XP if applicable
      if (testimonio_texto) {
        try {
          const { getXpConfig, grantXp } = await import('@/lib/xp-helpers')
          const xpConfig = await getXpConfig(supabase, user.id)
          await grantXp(
            supabase,
            user.id,
            xpConfig.testimonio,
            'testimonio',
            peticionId,
            peticion.grupo_id || undefined
          )
        } catch (xpErr) {
          console.error('Error otorgando XP por testimonio:', xpErr)
        }
      }
    }

    revalidatePath('/peticiones')
    revalidatePath(`/peticiones/${peticionId}`)
    revalidatePath('/feed')

    return { success: true }
  } catch (error) {
    console.error('Error en crearActualizacionPeticionAction:', error)
    return { success: false, error: 'Error inesperado' }
  }
}

/**
 * getPetitionUpdatesAction
 * Obtiene la timeline de actualizaciones de una petición.
 */
export async function getPetitionUpdatesAction(peticionId: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado', updates: [] }
    }

    const { data: updates, error } = await supabase
      .from('actualizaciones_peticion')
      .select('*')
      .eq('peticion_id', peticionId)
      .order('creado_en', { ascending: true })

    if (error) {
      console.error('Error obteniendo actualizaciones:', error)
      return { success: false, error: 'Error al cargar actualizaciones', updates: [] }
    }

    return { success: true, updates: updates || [] }
  } catch (error) {
    console.error('Error en getPetitionUpdatesAction:', error)
    return { success: false, error: 'Error inesperado', updates: [] }
  }
}

// ─── Petition Detail ─────────────────────────────────────────────────────────

/**
 * getPetitionDetailAction
 * Obtiene una petición con su timeline de actualizaciones.
 */
export async function getPetitionDetailAction(peticionId: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado', peticion: null, updates: [] }
    }

    // Fetch petition with author info
    const { data: peticion, error: peticionError } = await supabase
      .from('peticiones_oracion')
      .select('*, perfiles:usuario_id(nombre_usuario)')
      .eq('id', peticionId)
      .single()

    if (peticionError || !peticion) {
      return { success: false, error: 'Petición no encontrada', peticion: null, updates: [] }
    }

    // Access check: owner or group member
    const isOwner = peticion.usuario_id === user.id

    if (!isOwner && peticion.visibilidad === 'group' && !peticion.grupo_id) {
      return { success: false, error: 'No tenés acceso a esta petición', peticion: null, updates: [] }
    }

    if (!isOwner && peticion.visibilidad === 'group' && peticion.grupo_id) {
      const { data: membership } = await supabase
        .from('miembros_grupo')
        .select('id')
        .eq('usuario_id', user.id)
        .eq('grupo_id', peticion.grupo_id)
        .single()

      if (!membership) {
        return { success: false, error: 'No tenés acceso a esta petición', peticion: null, updates: [] }
      }
    } else if (!isOwner && peticion.visibilidad === 'private') {
      return { success: false, error: 'No tenés acceso a esta petición', peticion: null, updates: [] }
    }

    // Fetch updates
    const { data: updates } = await supabase
      .from('actualizaciones_peticion')
      .select('*')
      .eq('peticion_id', peticionId)
      .order('creado_en', { ascending: true })

    // Check if current user has prayed
    const { data: userPrayer } = await supabase
      .from('oraciones_por_peticion')
      .select('id')
      .eq('peticion_id', peticionId)
      .eq('usuario_id', user.id)
      .single()

    // Get author name
    const perfiles = peticion.perfiles as { nombre_usuario: string } | { nombre_usuario: string }[] | null
    const authorName = Array.isArray(perfiles)
      ? perfiles[0]?.nombre_usuario || 'Usuario'
      : perfiles?.nombre_usuario || 'Usuario'

    return {
      success: true,
      peticion: {
        ...peticion,
        author_name: authorName,
        is_owner: isOwner,
        ya_oro: !!userPrayer,
      },
      updates: updates || [],
    }
  } catch (error) {
    console.error('Error en getPetitionDetailAction:', error)
    return { success: false, error: 'Error inesperado', peticion: null, updates: [] }
  }
}

// ─── Existing Actions ────────────────────────────────────────────────────────

/**
 * getPetitionAction
 * Obtiene una petición por ID (solo si el usuario tiene acceso).
 */
export async function getPetitionAction(peticionId: string) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado', peticion: null }
    }

    const { data: peticion, error } = await supabase
      .from('peticiones_oracion')
      .select('*')
      .eq('id', peticionId)
      .single()

    if (error || !peticion) {
      return { success: false, error: 'Petición no encontrada', peticion: null }
    }

    // Check access: owner or group member
    const isOwner = peticion.usuario_id === user.id

    if (!isOwner && peticion.visibilidad === 'group' && !peticion.grupo_id) {
      return { success: false, error: 'No tenés acceso a esta petición', peticion: null }
    }

    if (!isOwner && peticion.visibilidad === 'group' && peticion.grupo_id) {
      const { data: membership } = await supabase
        .from('miembros_grupo')
        .select('id')
        .eq('usuario_id', user.id)
        .eq('grupo_id', peticion.grupo_id)
        .single()

      if (!membership) {
        return { success: false, error: 'No tenés acceso a esta petición', peticion: null }
      }
    } else if (!isOwner && peticion.visibilidad === 'private') {
      return { success: false, error: 'No tenés acceso a esta petición', peticion: null }
    }

    return { success: true, peticion }
  } catch (error) {
    console.error('Error en getPetitionAction:', error)
    return { success: false, error: 'Error inesperado', peticion: null }
  }
}

// ─── Guided Prayer Generation ────────────────────────────────────────────────

/**
 * generarOracionesGuiaBatch
 * Genera o recupera oraciones guía para peticiones comunitarias activas.
 * Valida acceso con la sesión del usuario y actualiza cache con cliente admin.
 */
export async function generarOracionesGuiaBatch(peticionIds: string[]) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado', oraciones: {} as Record<string, string> }
    }

    const parsed = generarOracionesGuiaBatchSchema.safeParse([...new Set(peticionIds)])
    if (!parsed.success) {
      return { success: false, error: 'Peticiones inválidas', oraciones: {} as Record<string, string> }
    }

    if (!parsed.data.length) {
      return { success: true, oraciones: {} as Record<string, string> }
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('grupo_activo_id')
      .eq('id', user.id)
      .single()

    if (!perfil?.grupo_activo_id) {
      return { success: false, error: 'Necesitás un grupo activo', oraciones: {} as Record<string, string> }
    }

    const { data: peticiones, error: peticionesError } = await supabase
      .from('peticiones_oracion')
      .select('id, titulo, descripcion, categoria, usuario_id, oracion_guia, oracion_guia_context_hash, perfiles:usuario_id(nombre_usuario)')
      .in('id', parsed.data)
      .eq('grupo_id', perfil.grupo_activo_id)
      .eq('visibilidad', 'group')
      .eq('estado', 'activa')

    if (peticionesError) {
      console.error('Error cargando peticiones para oración guía:', peticionesError)
      return { success: false, error: 'Error al cargar peticiones', oraciones: {} as Record<string, string> }
    }

    if (!peticiones?.length) {
      return { success: true, oraciones: {} as Record<string, string> }
    }

    const { data: updates } = await supabase
      .from('actualizaciones_peticion')
      .select('peticion_id, tipo, texto, testimonio_texto, creado_en')
      .in('peticion_id', peticiones.map(p => p.id))
      .order('creado_en', { ascending: false })

    const updatesByPetition = new Map<string, ActualizacionGuiaContext[]>()
    for (const update of updates ?? []) {
      const current = updatesByPetition.get(update.peticion_id) ?? []
      if (current.length < 5) {
        current.push(update)
        updatesByPetition.set(update.peticion_id, current)
      }
    }

    const { createAdminClient } = await import('@/lib/supabase/admin')
    const admin = createAdminClient()

    const oraciones: Record<string, string> = {}

    for (const peticion of peticiones) {
      const perfiles = peticion.perfiles as { nombre_usuario: string } | { nombre_usuario: string }[] | null
      const authorName = Array.isArray(perfiles)
        ? perfiles[0]?.nombre_usuario || 'Usuario'
        : perfiles?.nombre_usuario || 'Usuario'
      const perspective = peticion.usuario_id === user.id ? 'own' : 'intercession'
      const peticionContext: PeticionGuiaContext = {
        id: peticion.id,
        titulo: peticion.titulo,
        descripcion: peticion.descripcion,
        categoria: peticion.categoria,
        usuario_id: peticion.usuario_id,
        usuario_nombre: authorName,
        oracion_guia: peticion.oracion_guia,
        oracion_guia_context_hash: peticion.oracion_guia_context_hash,
      }
      const petitionUpdates = updatesByPetition.get(peticion.id) ?? []
      const contextHash = buildContextHash(peticionContext, petitionUpdates, perspective)

      if (perspective === 'intercession' && peticion.oracion_guia && peticion.oracion_guia_context_hash === contextHash) {
        oraciones[peticion.id] = peticion.oracion_guia
        continue
      }

      const generated = await generatePrayerWithOpenAI(peticionContext, petitionUpdates, perspective)
      const prayer = generated || buildFallbackPrayer(peticionContext, petitionUpdates, perspective)

      if (admin && perspective === 'intercession') {
        const { error: updateError } = await admin
          .from('peticiones_oracion')
          .update({
            oracion_guia: prayer,
            oracion_guia_generada_en: new Date().toISOString(),
            oracion_guia_context_hash: contextHash,
          })
          .eq('id', peticion.id)

        if (updateError) {
          console.error('Error actualizando cache de oración guía:', updateError)
        }
      } else if (!admin) {
        console.warn('Admin client unavailable: returning guided prayer without cache')
      }

      oraciones[peticion.id] = prayer
    }

    revalidatePath('/oracion')

    return { success: true, oraciones }
  } catch (error) {
    console.error('Error en generarOracionesGuiaBatch:', error)
    return { success: false, error: 'Error inesperado', oraciones: {} as Record<string, string> }
  }
}

// ─── Batch Intercession (Guided Prayer Flow) ─────────────────────────────────

/**
 * registrarIntercesionesBatch
 * Registra intercesiones masivamente al completar el timer de oración.
 * - Idempotent: UNIQUE(peticion_id, usuario_id) previene duplicados
 * - XP rate-limited: max 5 intercesiones por día para XP
 * - Notifications batched: 1 push por autor (no por petición)
 * - Called on timer completion with prayedPetitions array
 */
export async function registrarIntercesionesBatch(peticionIds: string[]) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'No autenticado', inserted: 0, xpGranted: 0 }
    }

    if (!peticionIds.length) {
      return { success: true, inserted: 0, xpGranted: 0 }
    }

    // Fetch petitions to validate they exist and are active
    const { data: peticiones } = await supabase
      .from('peticiones_oracion')
      .select('id, usuario_id, titulo, grupo_id, estado')
      .in('id', peticionIds)
      .eq('estado', 'activa')

    if (!peticiones?.length) {
      return { success: true, inserted: 0, xpGranted: 0 }
    }

    // Filter out own petitions (self-intercession is not recorded)
    const otherPetitions = peticiones.filter(p => p.usuario_id !== user.id)

    // Count existing intercessions BEFORE upsert to know how many are new
    const { data: existingBefore } = await supabase
      .from('oraciones_por_peticion')
      .select('peticion_id')
      .eq('usuario_id', user.id)
      .in('peticion_id', peticionIds)

    const existingBeforeSet = new Set((existingBefore || []).map(e => e.peticion_id))
    const newCount = otherPetitions.filter(p => !existingBeforeSet.has(p.id)).length
    const newPetitions = otherPetitions.filter(p => !existingBeforeSet.has(p.id))

    // Calculate XP slots BEFORE inserting the current batch.
    let remainingXpSlots = 0
    try {
      const { getXpConfig } = await import('@/lib/xp-helpers')
      const xpConfig = await getXpConfig(supabase, user.id)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { createAdminClient } = await import('@/lib/supabase/admin')
      const admin = createAdminClient()
      const xpReadClient = admin ?? supabase
      const { data: todayPrayers } = await xpReadClient
        .from('oraciones_por_peticion')
        .select('id')
        .eq('usuario_id', user.id)
        .gte('creado_en', today.toISOString())

      const todayCount = todayPrayers?.length || 0
      const todayXp = todayCount * xpConfig.intercesion
      const remainingXp = Math.max(0, xpConfig.intercesion_daily_cap - todayXp)
      remainingXpSlots = Math.floor(remainingXp / xpConfig.intercesion)
    } catch (xpErr) {
      console.error('Error calculating batch XP slots:', xpErr)
    }

    // Insert intercession records (idempotent via UNIQUE constraint)
    const records = otherPetitions.map(p => ({
      peticion_id: p.id,
      usuario_id: user.id,
    }))

    if (!records.length) {
      return { success: true, inserted: 0, xpGranted: 0 }
    }

    const { error: insertError } = await supabase
      .from('oraciones_por_peticion')
      .upsert(records, { onConflict: 'peticion_id,usuario_id', ignoreDuplicates: true })

    if (insertError) {
      console.error('Error inserting batch intercessions:', insertError)
      return { success: false, error: 'Error al registrar intercesiones', inserted: 0, xpGranted: 0 }
    }

    // Grant XP with daily cap (max 5 intercessions per day for XP)
    let xpGranted = 0
    if (newPetitions.length > 0 && remainingXpSlots > 0) {
      try {
        const { getXpConfig, grantXp } = await import('@/lib/xp-helpers')
        const xpConfig = await getXpConfig(supabase, user.id)

        // Grant XP for up to remainingXpSlots petitions
        const xpPetitions = newPetitions.slice(0, remainingXpSlots)
        for (const p of xpPetitions) {
          const result = await grantXp(
            supabase,
            user.id,
            xpConfig.intercesion,
            'intercesion',
            p.id,
            p.grupo_id || undefined
          )
          if (result) xpGranted += xpConfig.intercesion
        }
      } catch (xpErr) {
        console.error('Error granting batch XP:', xpErr)
      }
    }

    // Send batched notifications: 1 per author
    const authorMap = new Map<string, { grupoId: string; titles: string[] }>()
    for (const p of newPetitions) {
      if (!p.grupo_id) continue

      const existing = authorMap.get(p.usuario_id)
      if (existing) {
        existing.titles.push(p.titulo)
      } else {
        authorMap.set(p.usuario_id, {
          grupoId: p.grupo_id,
          titles: [p.titulo],
        })
      }
    }

    if (authorMap.size > 0) {
      try {
        // Get pray-er name
        const { data: myPerfil } = await supabase
          .from('perfiles')
          .select('nombre_usuario')
          .eq('id', user.id)
          .single()
        const myName = myPerfil?.nombre_usuario || 'Alguien'

        const { notifyUsers } = await import('@/lib/push-helpers')

        // Send one notification per author (targeted, not group-wide) in parallel
        await Promise.allSettled(
          Array.from(authorMap.entries()).map(([authorId, info]) => {
            const petitionCount = info.titles.length
            const body = petitionCount === 1
              ? `${myName} oró por tu petición: ${info.titles[0]}`
              : `${myName} oró por ${petitionCount} de tus peticiones`

            return notifyUsers(
              [authorId],
              {
                title: 'Oraron por tu petición 🙏',
                body,
              },
              user.id
            )
          })
        )
      } catch (notifErr) {
        console.error('Error in batch notifications:', notifErr)
      }
    }

    revalidatePath('/peticiones')
    revalidatePath('/feed')

    return { success: true, inserted: newCount, xpGranted }
  } catch (error) {
    console.error('Error en registrarIntercesionesBatch:', error)
    return { success: false, error: 'Error inesperado', inserted: 0, xpGranted: 0 }
  }
}
