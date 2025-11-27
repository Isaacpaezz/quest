import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* HEADER: visible en todas las pantallas */}
      <Header />
      
      {/* CONTENIDO DE LA PÁGINA */}
      <main className="flex-1 px-2 py-4 pt-16 pb-24 md:px-4">
        <div className="mx-auto w-full max-w-2xl">
          {children}
        </div>
      </main>
      
      {/* NAVEGACIÓN INFERIOR: visible en todas las pantallas */}
      <MobileNav />
    </div>
  )
}
