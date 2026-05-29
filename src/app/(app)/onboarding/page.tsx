import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingClient } from './_components/onboarding-client'

export const metadata = {
    title: 'Bienvenido | Quest',
    description: 'Configura tu experiencia en Quest',
}

export default async function OnboardingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Obtener perfil con grupo activo y rol
    const { data: perfil } = await supabase
        .from('perfiles')
        .select('grupo_activo_id, rol')
        .eq('id', user.id)
        .single()

    // Si ya tiene grupo activo y NO es admin, redirigir al home
    // Los admins pueden acceder al onboarding para revisar el diseño
    if (perfil?.grupo_activo_id && perfil?.rol !== 'admin') {
        redirect('/')
    }

    return <OnboardingClient />
}
