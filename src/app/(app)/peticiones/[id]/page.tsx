import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPetitionDetailAction } from '../actions'
import { PeticionDetailClient } from '../_components/peticion-detail-client'

/**
 * /peticiones/[id]
 * Petition detail page with updates timeline.
 */
export default async function PeticionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const result = await getPetitionDetailAction(id)

  if (!result.success || !result.peticion) {
    notFound()
  }

  return (
    <PeticionDetailClient
      peticion={result.peticion}
      updates={result.updates}
    />
  )
}
