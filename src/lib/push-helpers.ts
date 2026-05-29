import { createAdminClient } from '@/lib/supabase/admin'
import { pushService } from '@/lib/web-push'
import { createClient } from '@/lib/supabase/server'
import type { PushSubscription as WebPushSubscription } from 'web-push'

type WebPushSub = {
  endpoint: string
  expirationTime?: number | null
  keys?: { p256dh?: string | null; auth?: string | null }
}

type PushPayload = {
  title: string
  body: string
}

/**
 * Sends push notifications to all members of a group.
 * Filters subscriptions by grupo_id via join with miembros_grupo.
 * Excludes the sender (excludeUserId). Cleans up stale subs (410/404).
 *
 * @param grupoId - The group ID to scope notifications to
 * @param payload - Push notification payload (title, body)
 * @param excludeUserId - User ID to exclude (the sender)
 */
export async function notifyGroupMembers(
  grupoId: string,
  payload: PushPayload,
  excludeUserId?: string
): Promise<void> {
  if (!grupoId) return

  const supabase = await createClient()
  let subscriptions: Array<{ subscription: WebPushSub; usuario_id: string }> = []

  // Use RPC (SECURITY DEFINER) which does the JOIN with miembros_grupo server-side
  const { data, error: rpcErr } = await supabase.rpc('get_group_push_subscriptions', {
    p_grupo_id: grupoId,
  })

  if (!rpcErr && data) {
    subscriptions = data as Array<{ subscription: WebPushSub; usuario_id: string }>
  }

  // Exclude the sender
  if (excludeUserId) {
    subscriptions = subscriptions.filter((s) => s.usuario_id !== excludeUserId)
  }

  if (!subscriptions.length) return

  // Send notifications
  const payloadStr = JSON.stringify(payload)
  const admin = createAdminClient()

  await Promise.all(
    subscriptions.map((s) =>
      pushService
        .sendNotification(s.subscription as unknown as WebPushSubscription, payloadStr)
        .catch(async (err: Error & { statusCode?: number }) => {
          console.error('Error sending push notification:', err)
          // Clean up expired subscriptions (410 Gone or 404 Not Found)
          if ((err.statusCode === 410 || err.statusCode === 404) && admin) {
            await admin
              .from('suscripciones_push')
              .delete()
              .eq('usuario_id', s.usuario_id)
              .eq('subscription->>endpoint', s.subscription.endpoint)
          }
        })
    )
  )
}
