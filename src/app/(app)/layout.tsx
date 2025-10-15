import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/header'
import { MobileNav } from '@/components/layout/mobile-nav'
// Futuro: import { DesktopSidebar } from '@/components/layout/desktop-sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Futuro: <DesktopSidebar user={user} /> */}
      <div className="flex flex-col flex-1 md:pl-64"> {/* md:pl-64 es para el futuro sidebar */}
        <Header />
        <main className="flex-1 p-4 pb-24 md:pb-4"> {/* Padding inferior para no ser tapado por MobileNav */}
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  )
}
