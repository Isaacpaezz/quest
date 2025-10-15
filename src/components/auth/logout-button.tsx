'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

/**
 * Componente de cliente que maneja el cierre de sesión del usuario.
 * Al hacer clic, llama a supabase.auth.signOut() y redirige al login.
 */
export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return <Button variant="ghost" onClick={handleLogout}>Cerrar Sesión</Button>
}
