import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { DesktopSidebar } from '@/components/layout/desktop-sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
  if (profile?.rol !== 'admin') redirect('/home')

  return (
    <div className="flex min-h-screen bg-background">
      {/* Usamos el mismo sidebar de escritorio, que ya tiene la lógica de admin */}
      <DesktopSidebar />

      <div className="flex flex-col flex-1 md:ml-64">
        {/* Usamos el mismo header móvil */}
        <Header />

        <main className="flex-1 px-2 py-4 pb-24 md:px-4 md:pb-4">
          {/* AÑADIMOS UN TÍTULO DISTINTIVO PARA EL PANEL DE ADMIN */}
          <div className="mb-4 p-2 rounded-md bg-destructive/10 border border-destructive/20">
            <h1 className="text-lg font-semibold text-destructive">Panel de Administrador</h1>
          </div>
          {children}
        </main>

        {/* Usamos la misma navegación móvil */}
        <MobileNav />
      </div>
    </div>
  )
}
