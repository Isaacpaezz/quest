import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Página principal del Dashboard.
 * Esta página está protegida y solo es accesible para usuarios autenticados.
 * Es un Componente de Servidor que obtiene la sesión del usuario antes de renderizar.
 */
export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // Si no hay sesión de usuario, redirigir a la página de login.
    redirect('/login')
  }

  return (
    <section className="p-8">
      <h1 className="text-3xl font-bold">Bienvenido a tu Senda</h1>
      <p className="mt-2 text-muted-foreground">
        Sesión activa para el usuario: {user.email}
      </p>
      {/* Aquí construiremos el contenido principal del dashboard en los siguientes pasos */}
    </section>
  )
}
