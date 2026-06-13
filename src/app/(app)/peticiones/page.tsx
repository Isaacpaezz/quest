import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MuroComunidadClient } from './_components/muro-comunidad-client'
import { PetitionsNavigation } from './_components/petitions-navigation'
import { getCommunityWallAction } from './actions'
import type { CommunityPeticion } from './_components/use-realtime-peticiones'

/**
 * /peticiones
 * Community prayer wall — shows group-visible petitions.
 * Falls back to personal wall redirect if user has no group.
 */
export default async function PeticionesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Get user's active group
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('grupo_activo_id')
    .eq('id', user.id)
    .single()

  // If no group, redirect to personal wall
  if (!perfil?.grupo_activo_id) {
    redirect('/peticiones/mis-peticiones')
  }

  // Fetch community petitions
  const result = await getCommunityWallAction()

  if (!result.success) {
    redirect('/peticiones/mis-peticiones')
  }

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-display font-bold" style={{ color: 'hsl(var(--foreground))' }}>
            Muro de Oración
          </h1>
          <p className="text-[13px] font-sans mt-0.5" style={{ color: 'hsl(var(--muted-foreground))' }}>
            Peticiones de tu comunidad
          </p>
        </div>
      </div>

      <PetitionsNavigation active="community" />

      {/* Community wall */}
      <MuroComunidadClient
        peticiones={result.peticiones as CommunityPeticion[]}
        grupoId={perfil.grupo_activo_id}
        currentUserId={user.id}
      />
    </div>
  )
}
