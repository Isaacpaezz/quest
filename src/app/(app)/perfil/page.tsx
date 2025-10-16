import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserProfile } from './_components/user-profile'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return <UserProfile profile={profile} />
}
