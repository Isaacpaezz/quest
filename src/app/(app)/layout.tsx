import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GlassHeader } from '@/components/layout/glass-header'
import { PillNav } from '@/components/layout/pill-nav'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen flex-col quest-bg">
      <GlassHeader />
      <main className="flex-1 px-6 pt-20 pb-28">
        <div className="mx-auto w-full max-w-2xl">
          {children}
        </div>
      </main>
      <PillNav />
    </div>
  )
}
