import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Página principal que actúa como punto de entrada.
 * Redirecciona a los usuarios según su estado de autenticación:
 * - Si están autenticados: al dashboard
 * - Si no están autenticados: a la página de login
 */
export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Si el usuario está autenticado, redirigir al dashboard
  if (user) {
    redirect('/dashboard')
  }

  // Si no está autenticado, redirigir a la página de login
  redirect('/login')
}
