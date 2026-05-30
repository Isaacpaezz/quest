import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPetitionAction } from '../../actions'
import { PeticionForm } from '../../_components/peticion-form'

export const metadata = {
  title: 'Editar Petición — Quest',
}

export default async function EditarPeticionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const result = await getPetitionAction(id)

  if (!result.success || !result.peticion) {
    notFound()
  }

  // Only the owner can edit
  if (result.peticion.usuario_id !== user.id) {
    redirect('/peticiones/mis-peticiones')
  }

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
          Editar Petición
        </h1>
        <p
          className="text-[14px] font-sans mt-1"
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          Modificá los detalles de tu petición
        </p>
      </div>

      {/* Form */}
      <PeticionForm
        mode="edit"
        peticionId={id}
        initialData={{
          titulo: result.peticion.titulo,
          descripcion: result.peticion.descripcion,
          categoria: result.peticion.categoria,
          visibilidad: result.peticion.visibilidad,
        }}
      />
    </div>
  )
}
