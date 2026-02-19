'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { ActionState } from '@/types/definitions'
import { createAdminClient } from '@/lib/supabase/admin'
import { pushService } from '@/lib/web-push'
import type { PushSubscription as WebPushSubscription } from 'web-push'

const CrearRetoSchema = z.object({
  titulo: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  descripcion: z.string().optional(),
  tipo: z.enum(['personal', 'grupal']),
  criterio_accion: z.enum(['lectura', 'oracion', 'ambas']),
  criterio_cantidad: z.coerce.number().min(1, 'Mínimo 1'),
  recompensa_xp: z.coerce.number().min(0).default(100),
  penalizacion_monto: z.coerce.number().min(0).default(0),
  fecha_inicio: z.string().min(1, 'Selecciona una fecha de inicio'),
  fecha_fin: z.string().min(1, 'Selecciona una fecha de fin'),
})

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value },
        set(name: string, value: string, options: CookieOptions) {
          try { cookieStore.set({ name, value, ...options }) } catch {}
        },
        remove(name: string, options: CookieOptions) {
          try { cookieStore.set({ name, value: '', ...options }) } catch {}
        },
      },
    }
  )
}

export async function crearRetoAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const rawData = Object.fromEntries(formData)
  const parsed = CrearRetoSchema.safeParse(rawData)
  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors as ActionState['errors'],
      error: 'Datos inválidos',
    }
  }

  const { titulo, descripcion, tipo, criterio_accion, criterio_cantidad, recompensa_xp, penalizacion_monto, fecha_inicio, fecha_fin } = parsed.data

  // Crear reto
  const { data: reto, error } = await supabase
    .from('retos')
    .insert({
      creador_id: user.id,
      tipo,
      titulo,
      descripcion: descripcion || null,
      criterio: { action: criterio_accion, count: criterio_cantidad },
      recompensa_xp,
      penalizacion_monto,
      fecha_inicio,
      fecha_fin,
    })
    .select()
    .single()

  if (error) return { error: `Error al crear reto: ${error.message}` }

  // Auto-unirse como participante (aceptado)
  await supabase.from('reto_participantes').insert({
    reto_id: reto.id,
    usuario_id: user.id,
    estado: 'aceptado',
    xp_propuesto: recompensa_xp,
  })

  // Si es grupal, invitar a todos los demás miembros
  if (tipo === 'grupal') {
    const { data: allProfiles } = await supabase
      .from('perfiles')
      .select('id')
      .neq('id', user.id)

    if (allProfiles && allProfiles.length > 0) {
      // Insert all as pendiente
      const invitations = allProfiles.map(p => ({
        reto_id: reto.id,
        usuario_id: p.id,
        estado: 'pendiente',
      }))
      await supabase.from('reto_participantes').insert(invitations)

      // Send push notifications to invited members
      try {
        const { data: profile } = await supabase
          .from('perfiles')
          .select('nombre_usuario')
          .eq('id', user.id)
          .single()

        const payload = JSON.stringify({
          title: '🏆 Nuevo Reto Grupal',
          body: `${profile?.nombre_usuario || 'Alguien'} te invitó al reto "${titulo}"`
        })

        const admin = createAdminClient()
        type WebPushSub = {
          endpoint: string
          expirationTime?: number | null
          keys?: { p256dh?: string | null; auth?: string | null }
        }

        if (admin) {
          const memberIds = allProfiles.map(p => p.id)
          const { data: subs } = await admin
            .from('suscripciones_push')
            .select('subscription, usuario_id')
            .in('usuario_id', memberIds)

          if (subs && subs.length > 0) {
            await Promise.all(
              subs.map((s: { subscription: WebPushSub; usuario_id: string }) =>
                pushService
                  .sendNotification(s.subscription as unknown as WebPushSubscription, payload)
                  .catch((err: unknown) => console.error('Push error:', err))
              )
            )
          }
        }
      } catch (err) {
        console.error('Error sending reto invitations push:', err)
      }
    }
  }

  revalidatePath('/challenges')
  revalidatePath('/home')
  return { message: '¡Reto creado exitosamente!' }
}

export async function responderInvitacionAction(
  retoId: string,
  aceptar: boolean,
  xpPropuesto?: number
): Promise<ActionState> {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const newEstado = aceptar ? 'aceptado' : 'rechazado'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = { estado: newEstado }
  if (aceptar && xpPropuesto !== undefined) {
    updateData.xp_propuesto = xpPropuesto
  }

  const { error } = await supabase
    .from('reto_participantes')
    .update(updateData)
    .eq('reto_id', retoId)
    .eq('usuario_id', user.id)

  if (error) return { error: `Error: ${error.message}` }

  // If accepted, check if all participants have accepted -> compute trimmed mean
  if (aceptar) {
    const { data: allParticipants } = await supabase
      .from('reto_participantes')
      .select('estado, xp_propuesto')
      .eq('reto_id', retoId)

    if (allParticipants) {
      const todosAceptaron = allParticipants.every(p => p.estado === 'aceptado')

      if (todosAceptaron) {
        // Collect all XP proposals
        const proposals = allParticipants
          .map(p => p.xp_propuesto)
          .filter((v): v is number => v !== null && v !== undefined)
          .sort((a, b) => a - b)

        let finalXp = 100 // fallback
        if (proposals.length >= 4) {
          // Trimmed mean: remove highest and lowest, average the rest
          const trimmed = proposals.slice(1, -1)
          finalXp = Math.round(trimmed.reduce((s, v) => s + v, 0) / trimmed.length)
        } else if (proposals.length > 0) {
          // Not enough data to trim, use simple average
          finalXp = Math.round(proposals.reduce((s, v) => s + v, 0) / proposals.length)
        }

        // Update reto with negotiated XP
        await supabase
          .from('retos')
          .update({ recompensa_xp: finalXp, xp_negociado: true })
          .eq('id', retoId)
      }
    }
  }

  revalidatePath('/challenges')
  revalidatePath('/home')
  revalidatePath(`/challenges/${retoId}`)
  return { message: aceptar ? '¡Te uniste al reto!' : 'Invitación rechazada.' }
}

export async function unirseRetoAction(retoId: string): Promise<ActionState> {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase.from('reto_participantes').insert({
    reto_id: retoId,
    usuario_id: user.id,
    estado: 'aceptado',
  })

  if (error) {
    if (error.code === '23505') return { error: 'Ya estás participando en este reto' }
    return { error: `Error: ${error.message}` }
  }

  revalidatePath('/challenges')
  revalidatePath(`/challenges/${retoId}`)
  return { message: '¡Te uniste al reto!' }
}

export async function eliminarRetoAction(retoId: string): Promise<ActionState> {
  const supabase = await getSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  // Verify user is the creator (defense in depth — RLS also enforces this)
  const { data: reto } = await supabase
    .from('retos')
    .select('creador_id')
    .eq('id', retoId)
    .single()

  if (!reto) return { error: 'Reto no encontrado' }
  if (reto.creador_id !== user.id) return { error: 'Solo el creador puede eliminar este reto' }

  // Delete participants first (RLS allows creator of parent reto)
  const { error: partError } = await supabase
    .from('reto_participantes')
    .delete()
    .eq('reto_id', retoId)

  if (partError) return { error: `Error al eliminar participantes: ${partError.message}` }

  // Delete the reto (RLS allows creator)
  const { error } = await supabase
    .from('retos')
    .delete()
    .eq('id', retoId)

  if (error) return { error: `Error al eliminar: ${error.message}` }

  revalidatePath('/challenges')
  revalidatePath('/home')
  return { message: 'Reto eliminado exitosamente.' }
}


