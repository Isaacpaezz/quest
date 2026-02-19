'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
    X, Activity, Users, CalendarDays, User, Settings,
    Trophy, Award, AlertTriangle, Sun, Moon,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/* ───── menu sections ───── */
const NAV_ITEMS = [
    { href: '/feed', label: 'Feed', icon: Activity },
    { href: '/community', label: 'Comunidad', icon: Users },
    { href: '/history', label: 'Historial', icon: CalendarDays },
    { href: '/challenges', label: 'Retos', icon: Trophy },
    { href: '/badges', label: 'Badges', icon: Award },
    { href: '/debts', label: 'Deudas', icon: AlertTriangle },
]

const ACCOUNT_ITEMS = [
    { href: '/perfil', label: 'Perfil', icon: User },
    { href: '/perfil/soporte', label: 'Configuración', icon: Settings },
]

/* ───── types ───── */
interface MenuPanelProps {
    open: boolean
    onClose: () => void
}

interface UserInfo {
    nombre_usuario: string | null
    xp: number
    nivel: number
}

/* ───── component ───── */
export function MenuPanel({ open, onClose }: MenuPanelProps) {
    const pathname = usePathname()
    const { resolvedTheme, setTheme } = useTheme()
    const isDark = resolvedTheme !== 'light'

    const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

    // Fetch user profile once
    useEffect(() => {
        if (!open) return
        const supabase = createClient()
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) return
            supabase
                .from('perfiles')
                .select('nombre_usuario, xp, nivel')
                .eq('id', user.id)
                .single()
                .then(({ data }) => {
                    if (data) setUserInfo(data as UserInfo)
                })
        })
    }, [open])

    // Lock body scroll when open
    useEffect(() => {
        if (open) document.body.style.overflow = 'hidden'
        else document.body.style.overflow = ''
        return () => { document.body.style.overflow = '' }
    }, [open])

    // Close on escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [onClose])

    const toggleTheme = () => setTheme(isDark ? 'light' : 'dark')

    /* ─── colors ─── */
    const panelBg = isDark ? '#0A0C12' : '#FFFFFF'
    const headerGradient = isDark
        ? 'linear-gradient(135deg, #0E2A23 0%, #0A1628 50%, #151929 100%)'
        : 'linear-gradient(135deg, #E8FAF5 0%, #E0EEFF 50%, #F0F1F4 100%)'
    const textPrimary = isDark ? '#FFFFFF' : '#111318'
    const textSecondary = isDark ? '#7A8194' : '#8C9099'
    const iconDefault = isDark ? '#5A6075' : '#9CA0B5'
    const iconActive = isDark ? '#2DDAB0' : '#1AAF8B'
    const divider = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
    const hoverBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)'

    const initials = userInfo?.nombre_usuario
        ? userInfo.nombre_usuario.slice(0, 2).toUpperCase()
        : '?'

    /* ─── helpers ─── */
    function renderItem(
        { href, label, icon: Icon }: { href: string; label: string; icon: typeof Activity },
        isLast: boolean,
    ) {
        const isActive = pathname === href || pathname.startsWith(href + '/')
        return (
            <div key={href}>
                <Link
                    href={href}
                    onClick={onClose}
                    className="flex items-center gap-4 transition-colors active:scale-[0.99]"
                    style={{
                        padding: '14px 24px',
                        backgroundColor: isActive ? hoverBg : 'transparent',
                    }}
                >
                    <Icon
                        className="size-[20px] shrink-0"
                        style={{ color: isActive ? iconActive : iconDefault }}
                    />
                    <span
                        className="text-[15px] font-sans"
                        style={{
                            color: isActive ? iconActive : textPrimary,
                            fontWeight: isActive ? 600 : 400,
                        }}
                    >
                        {label}
                    </span>
                </Link>
                {!isLast && (
                    <div style={{ height: 1, backgroundColor: divider, margin: '0 24px' }} />
                )}
            </div>
        )
    }

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 transition-opacity duration-300"
                style={{
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    opacity: open ? 1 : 0,
                    pointerEvents: open ? 'auto' : 'none',
                }}
                onClick={onClose}
            />

            {/* Panel — slides from left like the reference */}
            <div
                className="fixed inset-y-0 left-0 z-50 flex flex-col"
                style={{
                    width: '85%',
                    maxWidth: 360,
                    backgroundColor: panelBg,
                    boxShadow: open ? '8px 0 32px rgba(0,0,0,0.3)' : 'none',
                    transform: open ? 'translateX(0)' : 'translateX(-100%)',
                    transition: 'transform 0.32s cubic-bezier(0.32, 0, 0.08, 1)',
                }}
            >
                {/* ─── Header with gradient + avatar ─── */}
                <div
                    className="relative shrink-0"
                    style={{
                        background: headerGradient,
                        padding: '48px 24px 20px 24px',
                    }}
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-12 right-4 flex items-center justify-center size-8 rounded-full transition-opacity hover:opacity-70 active:scale-95"
                        style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)' }}
                    >
                        <X className="size-4" style={{ color: textPrimary }} />
                    </button>

                    <div className="flex items-center gap-4">
                        {/* Avatar circle */}
                        <div
                            className="flex items-center justify-center rounded-full shrink-0"
                            style={{
                                width: 52,
                                height: 52,
                                background: isDark
                                    ? 'linear-gradient(135deg, #2DDAB0, #1AAF8B)'
                                    : 'linear-gradient(135deg, #1AAF8B, #0E8F6E)',
                                border: isDark
                                    ? '2px solid rgba(45,218,176,0.30)'
                                    : '2px solid rgba(26,175,139,0.30)',
                            }}
                        >
                            <span className="text-white font-bold text-[18px] font-sans">
                                {initials}
                            </span>
                        </div>

                        {/* Name + level */}
                        <div className="flex flex-col min-w-0">
                            <span
                                className="text-[17px] font-bold font-sans truncate"
                                style={{ color: textPrimary }}
                            >
                                {userInfo?.nombre_usuario ?? 'Cargando…'}
                            </span>
                            <span
                                className="text-[13px] font-sans"
                                style={{ color: isDark ? '#2DDAB0' : '#1AAF8B' }}
                            >
                                Nivel {userInfo?.nivel ?? '—'} · {userInfo?.xp ?? 0} XP
                            </span>
                        </div>
                    </div>
                </div>

                {/* ─── Navigation items ─── */}
                <div className="flex-1 overflow-y-auto" style={{ paddingTop: 8 }}>
                    {/* Main section */}
                    <div style={{ padding: '8px 0' }}>
                        {NAV_ITEMS.map((item, i) =>
                            renderItem(item, i === NAV_ITEMS.length - 1),
                        )}
                    </div>

                    {/* Divider */}
                    <div style={{ height: 1, backgroundColor: divider, margin: '4px 24px' }} />

                    {/* Section label */}
                    <div style={{ padding: '12px 24px 4px 24px' }}>
                        <span
                            className="text-[11px] font-bold font-sans uppercase tracking-[1px]"
                            style={{ color: textSecondary }}
                        >
                            Cuenta
                        </span>
                    </div>

                    {/* Account items */}
                    <div style={{ padding: '0 0 8px 0' }}>
                        {ACCOUNT_ITEMS.map((item, i) =>
                            renderItem(item, i === ACCOUNT_ITEMS.length - 1),
                        )}
                    </div>
                </div>

                {/* ─── Bottom: theme toggle + version ─── */}
                <div className="shrink-0" style={{ padding: '8px 24px 32px 24px' }}>
                    {/* Divider */}
                    <div style={{ height: 1, backgroundColor: divider, marginBottom: 12 }} />

                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        className="flex items-center gap-4 w-full transition-colors active:scale-[0.99]"
                        style={{ padding: '10px 0' }}
                    >
                        {isDark ? (
                            <Sun className="size-[20px] shrink-0" style={{ color: '#F5A623' }} />
                        ) : (
                            <Moon className="size-[20px] shrink-0" style={{ color: '#6366F1' }} />
                        )}
                        <span
                            className="text-[15px] font-sans"
                            style={{ color: textPrimary, fontWeight: 400 }}
                        >
                            {isDark ? 'Modo Claro' : 'Modo Oscuro'}
                        </span>
                        {/* Toggle switch */}
                        <div
                            className="ml-auto rounded-full"
                            style={{
                                width: 40, height: 22,
                                backgroundColor: isDark ? 'rgba(45,218,176,0.20)' : 'rgba(99,102,241,0.15)',
                                position: 'relative',
                            }}
                        >
                            <div
                                className="rounded-full transition-all duration-200"
                                style={{
                                    width: 16, height: 16,
                                    backgroundColor: isDark ? '#2DDAB0' : '#6366F1',
                                    position: 'absolute', top: 3,
                                    left: isDark ? 20 : 4,
                                }}
                            />
                        </div>
                    </button>

                    {/* Footer */}
                    <div className="flex items-center justify-center" style={{ paddingTop: 12 }}>
                        <span
                            className="text-[11px] font-sans tracking-[0.5px]"
                            style={{ color: textSecondary }}
                        >
                            Quest v1.0 — Crece en tu fe, juntos
                        </span>
                    </div>
                </div>
            </div>
        </>
    )
}
