'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun, Bell, Crown, LogOut, ChevronRight, Settings, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { enviarNotificacionPruebaAction, guardarSuscripcionPushAction } from '@/app/(app)/perfil/actions'
import type { Json } from '@/types/database'
import { getXpProgress } from '@/lib/xp-helpers'

// --- NOTIFICATION LOGIC HELPERS ---
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i)
  return outputArray
}

// --- MENU ITEM ---
function MenuItem({
  icon: Icon,
  label,
  href,
  onClick,
  accent,
  destructive,
}: {
  icon: React.ElementType
  label: string
  href?: string
  onClick?: () => void
  accent?: boolean
  destructive?: boolean
}) {
  const textCls = destructive
    ? 'text-[#FF6B6B]'
    : accent
      ? 'dark:text-[#2DDAB0] text-[#1AAF8B]'
      : 'dark:text-white text-[#111318]'
  const iconCls = destructive
    ? 'text-[#FF6B6B]'
    : accent
      ? 'dark:text-[#2DDAB0] text-[#1AAF8B]'
      : 'text-[#9CA0B5]'

  const content = (
    <div className="flex items-center gap-3 h-[52px] px-4 w-full">
      <Icon className={`size-[18px] shrink-0 ${iconCls}`} />
      <span className={`text-[14px] font-[500] flex-1 font-sans ${textCls}`}>
        {label}
      </span>
      {!destructive && (
        <ChevronRight className="size-4 text-[#6B6F85] shrink-0" />
      )}
    </div>
  )

  if (href) return <Link href={href} className="block">{content}</Link>
  return <button onClick={onClick} className="block w-full text-left cursor-pointer">{content}</button>
}

const LEVEL_NAMES: Record<number, string> = {
  1: 'Semilla', 2: 'Aprendiz', 3: 'Peregrino', 4: 'Explorador', 5: 'Valiente',
  6: 'Guerrero', 7: 'Campeón', 8: 'Leyenda', 9: 'Profeta', 10: 'Apóstol',
}

type XpEntry = { id: string; cantidad: number; motivo: string; created_at: string }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function UserProfile({ profile, stats, xpHistory = [] }: { profile: any; stats: { streak: number; totalMissions: number; totalPrayerSeconds: number }; xpHistory?: XpEntry[] }) {
  const isAdmin = profile?.rol === 'admin'
  const { resolvedTheme, setTheme } = useTheme()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setMounted(true)
    const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
    const supported =
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      (window.isSecureContext || isLocalhost)
    async function checkSubscription() {
      try {
        if (!supported) return
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        setIsSubscribed(!!sub)
      } catch {
        setIsSubscribed(false)
      } finally {
        setIsLoading(false)
      }
    }
    void checkSubscription()
  }, [])

  const handleToggleSubscription = async () => {
    if (isLoading) return
    const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname)
    const supported =
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'serviceWorker' in navigator &&
      (window.isSecureContext || isLocalhost)
    if (!supported) { toast.error('No soportado en este dispositivo.'); return }
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) { toast.error('Error de configuración.'); return }
    setIsLoading(true)
    const reg = await navigator.serviceWorker.ready
    if (isSubscribed) {
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await sub.unsubscribe()
        await guardarSuscripcionPushAction(null)
        toast.success('Notificaciones desactivadas.')
        setIsSubscribed(false)
      }
    } else {
      try {
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
        })
        const payload = JSON.parse(JSON.stringify(sub))
        const result = await guardarSuscripcionPushAction(payload as Json)
        if (result.error) {
          toast.error('Error', { description: result.error })
          await sub.unsubscribe()
        } else {
          toast.success('¡Notificaciones activadas!')
          setIsSubscribed(true)
        }
      } catch (err) {
        console.error(err)
        toast.error('No se pudo activar las notificaciones.')
      }
    }
    setIsLoading(false)
  }

  const prayerHours = Math.floor(stats.totalPrayerSeconds / 3600)
  const isDark = !mounted ? true : resolvedTheme === 'dark'

  // ── card bg (CSS variables)
  const cardBg = 'hsl(var(--bg-surface) / 0.44)'
  const cardBorder = 'hsl(var(--border))'

  return (
    <div className="flex flex-col gap-8">

      {/* ─── PROFILE CARD ─── */}
      <div
        className="flex flex-col items-center gap-4 p-6 rounded-3xl"
        style={{
          backgroundColor: cardBg,
          border: `1px solid ${cardBorder}`,
          boxShadow: 'var(--quest-shadow-card)',
        }}
      >
        {/* Avatar */}
        <div
          className="size-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'hsl(var(--muted))' }}
        >
          <span
            className="font-display text-2xl font-bold"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            {profile?.nombre_usuario?.[0]?.toUpperCase() || '?'}
          </span>
        </div>

        {/* Name + email */}
        <div className="flex flex-col items-center gap-1">
          <h2
            className="font-display text-[24px] font-bold tracking-[-0.5px]"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            {profile?.nombre_usuario || 'Usuario'}
          </h2>
          <p
            className="text-[13px] font-sans"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            {profile?.email || 'isaac@ejemplo.com'}
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-between w-full pt-4">
          {/* Racha */}
          <div className="flex flex-col items-center flex-1 gap-1">
            <span
              className="font-display text-[28px] font-bold tracking-[-1px]"
              style={{ color: 'hsl(var(--primary))' }}
            >
              {stats.streak}
            </span>
            <span className="text-[12px] font-sans" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Racha
            </span>
          </div>
          {/* Lecturas */}
          <div className="flex flex-col items-center flex-1 gap-1">
            <span
              className="font-display text-[28px] font-bold tracking-[-1px]"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              {stats.totalMissions}
            </span>
            <span className="text-[12px] font-sans" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Lecturas
            </span>
          </div>
          {/* Oración */}
          <div className="flex flex-col items-center flex-1 gap-1">
            <span
              className="font-display text-[28px] font-bold tracking-[-1px]"
              style={{ color: 'hsl(var(--foreground))' }}
            >
              {prayerHours}h
            </span>
            <span className="text-[12px] font-sans" style={{ color: 'hsl(var(--muted-foreground))' }}>
              Oración
            </span>
          </div>
        </div>
      </div>

      {/* ─── XP LEVEL PROGRESS ─── */}
      {profile?.xp != null && profile?.nivel != null && (() => {
        const xpProgress = getXpProgress(profile.xp, profile.nivel)
        return (
          <Link href="/perfil/xp">
            <div
              className="flex flex-col gap-3 p-5 rounded-3xl transition-all active:scale-[0.98]"
              style={{
                backgroundColor: cardBg,
                border: `1px solid ${cardBorder}`,
                boxShadow: 'var(--quest-shadow-card)',
            }}
          >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4" style={{ color: '#8B5CF6' }} />
                  <span className="text-[13px] font-semibold font-sans text-foreground">
                    Nivel {profile.nivel} — {LEVEL_NAMES[profile.nivel] || 'Maestro'}
                  </span>
                </div>
                <span className="text-[12px] font-sans text-muted-foreground">
                  {profile.xp.toLocaleString()} XP
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${xpProgress.percentage}%`,
                    background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)',
                  }}
                />
              </div>
              <div className="flex justify-between">
                <span className="text-[11px] font-sans text-muted-foreground">
                  {xpProgress.current.toLocaleString()} / {xpProgress.needed.toLocaleString()}
                </span>
                <span className="text-[11px] font-sans font-medium" style={{ color: '#8B5CF6' }}>
                  Ver historial →
                </span>
              </div>
            </div>
          </Link>
        )
      })()}



      {/* ─── SETTINGS SECTION ─── */}
      <div className="flex flex-col gap-2">
        {/* Section header */}
        <div className="flex items-center gap-3">
          <div className="w-6 h-[2px] rounded-sm bg-[#FF6B35]" />
          <span
            className="text-[11px] font-bold tracking-[2px] font-sans uppercase"
            style={{ color: 'hsl(var(--quest-text-secondary))' }}
          >
            AJUSTES
          </span>
        </div>

        {/* Menu card */}
        <div
          className="rounded-[20px] overflow-hidden"
          style={{
            backgroundColor: cardBg,
            border: `1px solid ${cardBorder}`,
          }}
        >
          <MenuItem
            icon={mounted && isDark ? Sun : Moon}
            label={mounted && isDark ? 'Tema claro' : 'Tema oscuro'}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
          />
          <MenuItem
            icon={Bell}
            label="Notificaciones"
            onClick={handleToggleSubscription}
          />
          <MenuItem
            icon={Crown}
            label="Quest Premium"
            accent
          />
          <MenuItem
            icon={LogOut}
            label="Cerrar sesión"
            destructive
            onClick={async () => {
              const { createClient } = await import('@/lib/supabase/client')
              await createClient().auth.signOut()
              router.push('/login')
            }}
          />
        </div>
      </div>

      {/* ─── DEBUG: VIBRATION TEST (TEMPORAL) ─── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-6 h-[2px] rounded-sm bg-[#FF6B35]" />
          <span
            className="text-[11px] font-bold tracking-[2px] font-sans uppercase"
            style={{ color: 'hsl(var(--quest-text-secondary))' }}
          >
            DEBUG (TEMPORAL)
          </span>
        </div>
        <div
          className="rounded-[20px] overflow-hidden"
          style={{
            backgroundColor: cardBg,
            border: `1px solid ${cardBorder}`,
          }}
        >
          <button
            onClick={() => {
              const hasVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator
              if (!hasVibrate) {
                toast.error('navigator.vibrate no está disponible en este browser')
                return
              }
              const result = navigator.vibrate(500)
              toast.success(`Vibración disparada (500ms). Resultado: ${result}`)
            }}
            className="flex items-center gap-3 h-[52px] px-4 w-full text-left cursor-pointer active:scale-[0.98] transition-transform"
          >
            <span className="text-[18px]">📳</span>
            <span className="text-[14px] font-[500] flex-1 font-sans text-foreground">
              Test Vibración (500ms)
            </span>
          </button>
          <div className="px-4 pb-3">
            <p className="text-[11px] font-sans text-muted-foreground">
              API disponible: {typeof navigator !== 'undefined' && 'vibrate' in navigator ? '✅ Sí' : '❌ No'}
            </p>
          </div>
        </div>
      </div>

      {/* ─── ADMIN SECTION ─── */}
      {isAdmin && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-6 h-[2px] rounded-sm bg-[#FF6B35]" />
            <span
              className="text-[11px] font-bold tracking-[2px] font-sans uppercase"
            style={{ color: 'hsl(var(--quest-text-secondary))' }}
          >
            ADMINISTRACIÓN
            </span>
          </div>
          <div
            className="rounded-[20px] overflow-hidden"
            style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
          >
            <MenuItem icon={Settings} label="Panel Admin" href="/admin" />
          </div>
          {/* Test notification (admin only) */}
          <button
            onClick={async () => {
              const res = await enviarNotificacionPruebaAction()
              if (res.error) toast.error(res.error)
              else toast.success(res.message)
            }}
            className="mt-1 text-xs px-4 transition-opacity opacity-50 hover:opacity-100 text-left"
            style={{ color: 'hsl(var(--muted-foreground))' }}
          >
            Enviar notificación de prueba →
          </button>
        </div>
      )}
    </div>
  )
}
