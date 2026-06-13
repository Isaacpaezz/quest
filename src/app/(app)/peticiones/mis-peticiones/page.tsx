import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MuroPersonalClient } from '../_components/muro-personal-client'
import { PetitionsNavigation } from '../_components/petitions-navigation'

export const metadata = {
  title: 'Mis Peticiones — Quest',
}

export default async function MisPeticionesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch user's petitions
  const { data: peticiones } = await supabase
    .from('peticiones_oracion')
    .select('*')
    .eq('usuario_id', user.id)
    .order('estado', { ascending: true }) // activa first
    .order('creado_en', { ascending: false })

  // ─── Styles ──────────────────────────────────────────────────────────────
  const textClr = 'hsl(var(--foreground))'
  const subClr = 'hsl(var(--muted-foreground))'

  return (
    <div
      className="min-h-screen bg-background px-4 pt-6 pb-24"
    >
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4">
        <div>
          <h1
            className="text-[24px] font-display font-bold"
            style={{ color: textClr }}
          >
            Mis Peticiones
          </h1>
          <p
            className="text-[14px] font-sans mt-1"
            style={{ color: subClr }}
          >
            Tus peticiones de oración personales
          </p>
        </div>

        <PetitionsNavigation active="mine" />
      </div>

      {/* Content */}
      <MuroPersonalClient peticiones={peticiones || []} />
    </div>
  )
}
