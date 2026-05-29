import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PeticionForm } from '../_components/peticion-form'

export const metadata = {
  title: 'Nueva Petición — Quest',
}

export default async function NuevaPeticionPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check if user has active group for visibilidad default
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('grupo_activo_id')
    .eq('id', user.id)
    .single()

  const hasGroup = !!perfil?.grupo_activo_id

  return (
    <div
      className="min-h-screen px-4 pt-6 pb-24"
      style={{ backgroundColor: 'hsl(var(--bg))' }}
    >
      {/* Header */}
      <div className="mb-6">
        <h1
          className="text-[24px] font-display font-bold"
          style={{ color: 'hsl(var(--foreground))' }}
        >
          Nueva Petición
        </h1>
        <p
          className="text-[14px] font-sans mt-1"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          Compartí tu petición con tu comunidad
        </p>
      </div>

      {/* Form */}
      <PeticionForm
        mode="create"
        initialData={{
          titulo: '',
          descripcion: '',
          categoria: 'otro',
          visibilidad: hasGroup ? 'group' : 'private',
        }}
      />
    </div>
  )
}
