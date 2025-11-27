'use client'

import { useState, useEffect } from 'react'
import LogoutButton from '@/components/auth/logout-button'
import { 
  ListChecks, ShieldX, Settings, User, Flame, BookOpen, Clock, 
  Award, ChevronRight, Bell, HelpCircle, Info, Edit 
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { enviarNotificacionPruebaAction, guardarSuscripcionPushAction } from '@/app/(app)/perfil/actions'
import type { Json } from '@/types/database'
import { cn } from '@/lib/utils'

// --- NOTIFICATION LOGIC HELPERS ---
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer | null): string | null {
  if (!buffer) return null
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  const base64 = btoa(binary)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// --- COMPONENTS ---

function StatCard({ Icon, value, label, colorClass, iconBgClass }: { 
  Icon: React.ElementType, 
  value: string | number, 
  label: string,
  colorClass: string,
  iconBgClass: string
}) {
  return (
    <div className="flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className={cn("flex size-10 items-center justify-center rounded-full", iconBgClass, colorClass)}>
        <Icon className="size-5" />
      </div>
      <div className="text-center">
        <p className="font-display text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      </div>
    </div>
  )
}

function SettingsGroup({ title, children }: { title?: string, children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      {title && <h3 className="px-6 text-xs font-bold uppercase tracking-widest text-slate-400">{title}</h3>}
      <div className="mx-4 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {children}
      </div>
    </div>
  )
}

function SettingsItem({ Icon, label, onClick, href, badge, isDestructive }: { 
  Icon: React.ElementType, 
  label: string, 
  onClick?: () => void, 
  href?: string,
  badge?: string | number,
  isDestructive?: boolean
}) {
  const content = (
    <div className={cn(
      "flex items-center justify-between border-b border-slate-50 p-4 transition-colors hover:bg-slate-50 last:border-0",
      isDestructive ? "text-rose-600" : "text-slate-700"
    )}>
      <div className="flex items-center gap-3">
        <Icon className={cn("size-5", isDestructive ? "text-rose-500" : "text-slate-400")} />
        <span className="font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {badge && (
          <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
        <ChevronRight className="size-4 text-slate-300" />
      </div>
    </div>
  )

  if (href) return <Link href={href} className="block">{content}</Link>
  return <button onClick={onClick} className="block w-full text-left">{content}</button>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function UserProfile({ profile, stats }: { profile: any, stats: { streak: number, totalMissions: number, totalPrayerSeconds: number } }) {
  const isAdmin = profile?.rol === 'admin'
  
  // Notification Logic
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
    const supported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && (window.isSecureContext || isLocalhost)

    async function checkSubscription() {
      try {
        if (!supported) return
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      } catch {
        setIsSubscribed(false)
      } finally {
        setIsLoading(false)
      }
    }
    void checkSubscription()
  }, []);

  const handleToggleSubscription = async () => {
    if (isLoading) return;
    
    const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
    const supported = typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && (window.isSecureContext || isLocalhost)
    
    if (!supported) {
      toast.error('No soportado en este dispositivo.');
      return;
    }
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      toast.error('Error de configuración.');
      return;
    }

    setIsLoading(true);
    const registration = await navigator.serviceWorker.ready;

    if (isSubscribed) {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await guardarSuscripcionPushAction(null);
        toast.success('Notificaciones desactivadas.');
        setIsSubscribed(false);
      }
    } else {
      try {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
        });
        const payload = JSON.parse(JSON.stringify(subscription));
        const result = await guardarSuscripcionPushAction(payload as Json);
        if (result.error) {
          toast.error('Error', { description: result.error });
          await subscription.unsubscribe();
        } else {
          toast.success('¡Notificaciones activadas!');
          setIsSubscribed(true);
        }
      } catch (error) {
        console.error(error);
        toast.error('No se pudo activar las notificaciones.');
      }
    }
    setIsLoading(false);
  };

  // Format stats
  const prayerHours = Math.floor(stats.totalPrayerSeconds / 3600);

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-24">
      
      {/* 1. IDENTITY & STATUS */}
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex size-28 items-center justify-center rounded-full border-4 border-white bg-slate-200 shadow-lg">
           <span className="font-display text-4xl font-bold text-slate-400">{profile?.nombre_usuario?.[0]?.toUpperCase()}</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900">{profile?.nombre_usuario}</h1>
        <p className="text-sm font-medium text-slate-500">{profile?.email || 'No disponible'}</p>
        
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-indigo-50 px-4 py-1.5">
          <Award className="size-3.5 text-indigo-600" />
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-700">Discípulo Fiel</span>
        </div>
      </div>

      {/* 2. STATS GRID */}
      <div className="grid grid-cols-3 gap-3 px-4">
        <StatCard 
          Icon={Flame} 
          value={stats.streak} 
          label="Racha" 
          colorClass="text-orange-500" 
          iconBgClass="bg-orange-50" 
        />
        <StatCard 
          Icon={BookOpen} 
          value={stats.totalMissions} // Using total missions as proxy for "Libros" or generic progress
          label="Misiones" 
          colorClass="text-blue-500" 
          iconBgClass="bg-blue-50" 
        />
        <StatCard 
          Icon={Clock} 
          value={`${prayerHours}h`} 
          label="Oración" 
          colorClass="text-emerald-500" 
          iconBgClass="bg-emerald-50" 
        />
      </div>

      {/* 3. PERSONAL INFO */}
      <div className="space-y-2 px-4">
        <div className="flex justify-between border-b border-slate-100 py-4">
          <p className="text-sm text-slate-500">Correo Electrónico</p>
          <p className="text-sm font-medium text-slate-900">{profile?.email || 'No disponible'}</p>
        </div>
        <div className="flex justify-between border-b border-slate-100 py-4">
          <p className="text-sm text-slate-500">Miembro Desde</p>
          <p className="text-sm font-medium text-slate-900">
            {new Date(profile?.creado_en).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* 4. NOTIFICATIONS SECTION (Restored) */}
      <div className="px-4">
        <h3 className="mb-2 text-lg font-bold text-slate-900">Notificaciones</h3>
        <p className="mb-4 text-sm text-slate-500">Activa las notificaciones para mantenerte al día.</p>
        
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button 
            onClick={handleToggleSubscription} 
            disabled={isLoading}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            {isSubscribed ? 'Desactivar Notificaciones' : 'Activar Notificaciones'}
          </Button>

          {isAdmin && (
            <Button
              variant="outline"
              onClick={async () => {
                const res = await enviarNotificacionPruebaAction()
                if (res.error) toast.error(res.error)
                else toast.success(res.message)
              }}
            >
              Enviar Notificación de Prueba
            </Button>
          )}
        </div>
      </div>

      {/* 5. SETTINGS GROUPS */}

      {/* ADMINISTRACIÓN (Only Admin) */}
      {isAdmin && (
        <SettingsGroup title="Administración">
          <SettingsItem Icon={ListChecks} label="Gestionar Planes de Lectura" href="/admin/planes" />
          <SettingsItem Icon={ShieldX} label="Administrar Penalizaciones" href="/admin/penalizaciones" />
          <SettingsItem Icon={Settings} label="Configuración de la Aplicación" href="/admin/configuracion" />
        </SettingsGroup>
      )}

      {/* SOPORTE */}
      <SettingsGroup title="Soporte">
        <SettingsItem Icon={HelpCircle} label="Ayuda y Soporte" href="/perfil/soporte" />
        <SettingsItem Icon={Info} label="Acerca de Quest" href="/perfil/acerca-de" />
      </SettingsGroup>

      {/* LOGOUT */}
      <div className="px-4">
        <LogoutButton />
      </div>
    </div>
  )
}
