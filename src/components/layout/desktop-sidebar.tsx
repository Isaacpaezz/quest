import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BookOpen, Users, History, Newspaper, User, ListChecks, ShieldX, Settings } from 'lucide-react'
import LogoutButton from '@/components/auth/logout-button'

// Usamos un componente de servidor para obtener el rol del usuario aquí mismo
export async function DesktopSidebar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('perfiles').select('rol, nombre_usuario').eq('id', user!.id).single()

  const isAdmin = profile?.rol === 'admin'

  return (
    <aside className="hidden md:flex flex-col w-64 border-r fixed h-full bg-background">
      <div className="p-4 border-b">
        <Link href="/sustento-diario">
          <h1 className="text-2xl font-bold text-primary">Quest</h1>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <h2 className="px-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Principal</h2>
        <Link href="/sustento-diario" className="flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium hover:bg-muted">
          <BookOpen className="h-5 w-5" /> Sustento
        </Link>
        <Link href="/comunidad" className="flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium hover:bg-muted">
          <Users className="h-5 w-5" /> Comunidad
        </Link>
        <Link href="/historial" className="flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium hover:bg-muted">
          <History className="h-5 w-5" /> Historial
        </Link>
        <Link href="/feed" className="flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium hover:bg-muted">
          <Newspaper className="h-5 w-5" /> Feed
        </Link>
        
        {isAdmin && (
          <div className="pt-4">
            <h2 className="px-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Administración</h2>
            <Link href="/admin/planes" className="flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium hover:bg-muted"><ListChecks className="h-5 w-5" /> Planes de Lectura</Link>
            <Link href="/admin/penalizaciones" className="flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium hover:bg-muted"><ShieldX className="h-5 w-5" /> Penalizaciones</Link>
            <Link href="/admin/configuracion" className="flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium hover:bg-muted"><Settings className="h-5 w-5" /> Configuración</Link>
          </div>
        )}
      </nav>
      <div className="p-4 border-t">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center"><User className="h-6 w-6" /></div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold truncate">{profile?.nombre_usuario}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
         <LogoutButton />
      </div>
    </aside>
  )
}
