import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/auth/logout-button'

/**
 * Layout de seguridad para el Panel de Administración.
 * Protege todas las rutas anidadas verificando que el usuario no solo esté
 * autenticado, sino que también tenga el rol de 'admin'.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Primera verificación: ¿Hay un usuario logueado?
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Segunda verificación: ¿El usuario tiene el rol de 'admin'?
  const { data: profile, error } = await supabase
    .from('perfiles')
    .select('*') // Seleccionamos todos los campos para depuración
    .eq('id', user.id)

  // Verificamos si hay algún perfil y si el rol es exactamente 'admin' (case sensitive)
  const adminProfile = profile && profile.length > 0 ? profile[0] : null
  const isAdmin = adminProfile && adminProfile.rol === 'admin'
  
  // Si hay error o no es admin, redirigimos
  if (error) {
    console.error('Error al obtener perfil:', error)
    return (
      <div className="p-8 bg-destructive/10 rounded-lg max-w-lg mx-auto my-8">
        <h1 className="text-xl font-bold mb-4">Error al verificar permisos</h1>
        <p className="mb-2">No se pudo verificar tu perfil de usuario.</p>
        <pre className="bg-background p-4 rounded overflow-auto text-xs">
          {JSON.stringify(error, null, 2)}
        </pre>
        <div className="mt-4">
          <Link href="/" className="text-primary hover:underline">Volver al inicio</Link>
        </div>
      </div>
    )
  }
  
  if (!profile) {
    return (
      <div className="p-8 bg-destructive/10 rounded-lg max-w-lg mx-auto my-8">
        <h1 className="text-xl font-bold mb-4">Perfil no encontrado</h1>
        <p className="mb-2">No se encontró un perfil asociado a tu cuenta.</p>
        <p className="mb-4">Usuario ID: {user.id}</p>
        <div className="mt-4">
          <Link href="/" className="text-primary hover:underline">Volver al inicio</Link>
        </div>
      </div>
    )
  }
  
  if (!isAdmin) {
    return (
      <div className="p-8 bg-destructive/10 rounded-lg max-w-lg mx-auto my-8">
        <h1 className="text-xl font-bold mb-4">Acceso denegado</h1>
        <p className="mb-2">No tienes permisos de administrador para acceder a esta sección.</p>
        <div className="mt-4 p-4 bg-background rounded">
          <p className="font-semibold">Información de depuración:</p>
          <p>Usuario: {user.email}</p>
          <p>ID: {user.id}</p>
          <p>Rol actual: "{adminProfile?.rol || 'no definido'}"</p>
          <p>Rol requerido: "admin"</p>
        </div>
        <div className="mt-4">
          <Link href="/" className="text-primary hover:underline">Volver al inicio</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center justify-between h-16 px-8 border-b bg-card">
        <div className="flex items-center gap-6">
          <Link href="/admin">
            <h1 className="text-xl font-bold text-destructive">Quest [Admin]</h1>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/admin/planes" className="text-sm font-medium hover:underline text-muted-foreground">
              Planes de Lectura
            </Link>
            <Link href="/admin/penalizaciones" className="text-sm font-medium text-muted-foreground hover:text-primary">
              Penalizaciones
            </Link>
            <Link href="/admin/configuracion" className="text-sm font-medium text-muted-foreground hover:text-primary">
              Configuración
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{user.email}</span>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  )
}
