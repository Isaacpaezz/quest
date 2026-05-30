import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { MuroPersonalClient } from '../_components/muro-personal-client'

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
  const primaryBg = 'hsl(var(--primary))'

  return (
    <div
      className="min-h-screen px-4 pt-6 pb-24"
      style={{ backgroundColor: 'hsl(var(--bg))' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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

        <Link
          href="/peticiones/nueva"
          className="flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-sans font-medium transition-colors"
          style={{
            backgroundColor: primaryBg,
            color: '#FFFFFF',
          }}
        >
          <Plus className="size-4" />
          Nueva
        </Link>
      </div>

      {/* Content */}
      <MuroPersonalClient peticiones={peticiones || []} />
    </div>
  )
}
