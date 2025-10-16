import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
import { DesktopSidebar } from '@/components/layout/desktop-sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen bg-background">
      {/* NAVEGACIÓN DE ESCRITORIO: visible solo en md y más grandes */}
      <DesktopSidebar />
      
      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex flex-col flex-1 md:ml-64"> {/* Margen izquierdo en escritorio para dejar espacio al sidebar */}
        {/* NAVEGACIÓN MÓVIL (HEADER): visible solo en pantallas pequeñas */}
        <Header />
        
        {/* CONTENIDO DE LA PÁGINA */}
        <main className="flex-1 p-4 pb-24 md:pb-4"> {/* Padding inferior en móvil para la Tab Bar */}
          {children}
        </main>
        
        {/* NAVEGACIÓN MÓVIL (TAB BAR): visible solo en pantallas pequeñas */}
        <MobileNav />
      </div>
    </div>
  )
}
