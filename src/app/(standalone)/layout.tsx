import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Layout for standalone pages — same auth as (app) but NO Header or MobileNav.
 * Pages here own their full-screen layout (like Pencil mockups with custom nav).
 */
export default async function StandaloneLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')
    return <>{children}</>
}
