'use client'
import { Button } from '@/components/ui/button'
import LogoutButton from '@/components/auth/logout-button'
import { ListChecks, ShieldX, Settings, User } from 'lucide-react'
import Link from 'next/link'

export function UserProfile({ profile }: { profile: any }) {
  const isAdmin = profile?.rol === 'admin'

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex flex-col items-center gap-4 mt-4">
        <div className="bg-muted rounded-full h-32 w-32 flex items-center justify-center">
          <User className="h-20 w-20 text-muted-foreground" />
        </div>
        <p className="text-2xl font-bold">{profile?.nombre_usuario}</p>
      </div>
      
      <div className="mt-8 space-y-2">
        <div className="flex justify-between py-4 border-t">
          <p className="text-muted-foreground text-sm">Correo Electrónico</p>
          <p className="text-sm font-medium">{profile?.email || 'No disponible'}</p>
        </div>
        <div className="flex justify-between py-4 border-t">
          <p className="text-muted-foreground text-sm">Miembro Desde</p>
          <p className="text-sm font-medium">{new Date(profile?.creado_en).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {isAdmin && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Panel de Administrador</h3>
          <div className="space-y-2">
            <Link href="/admin/planes" className="flex items-center justify-between p-4 rounded-lg bg-muted hover:bg-muted/80">
              <div className="flex items-center gap-4"><ListChecks /><span>Gestionar Planes de Lectura</span></div>
              <span>&gt;</span>
            </Link>
            <Link href="/admin/penalizaciones" className="flex items-center justify-between p-4 rounded-lg bg-muted hover:bg-muted/80">
              <div className="flex items-center gap-4"><ShieldX /><span>Administrar Penalizaciones</span></div>
              <span>&gt;</span>
            </Link>
            <Link href="/admin/configuracion" className="flex items-center justify-between p-4 rounded-lg bg-muted hover:bg-muted/80">
              <div className="flex items-center gap-4"><Settings /><span>Configuración de la Aplicación</span></div>
              <span>&gt;</span>
            </Link>
          </div>
        </div>
      )}

      <div className="mt-8">
        <LogoutButton />
      </div>
    </div>
  )
}
