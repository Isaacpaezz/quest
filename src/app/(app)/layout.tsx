import LogoutButton from '@/components/auth/logout-button'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Layout principal para todas las páginas autenticadas de la aplicación.
 * Incluye un encabezado persistente con el botón de cierre de sesión.
 * También verifica la autenticación para proteger todo el grupo de rutas.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center justify-between h-16 px-8 border-b bg-card">
        <h1 className="text-xl font-bold text-primary">Quest</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
