'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Bell } from 'lucide-react'

const ROUTE_TITLES: Record<string, string> = {
    '/home': 'Quest',
    '/community': 'Comunidad',
    '/feed': 'Feed',
    '/challenges': 'Retos',
    '/perfil': 'Perfil',
    '/badges': 'Badges',
    '/debts': 'Deudas',
    '/history': 'Historial',
    '/admin': 'Admin',
    '/admin/planes': 'Planes',
    '/admin/miembros': 'Miembros',
    '/admin/penalizaciones': 'Penalizaciones',
    '/admin/configuracion': 'Configuración',
}

const ROUTE_SUBTITLES: Record<string, string> = {
    '/feed': 'Nuestra comunidad en tiempo real.',
    '/community': 'Crecemos, con transparencia y apoyo.',
    '/badges': 'Logros desbloqueados en tu camino.',
    '/history': 'Tu progreso de lectura y oración.',
    '/challenges': 'Desafíos personales y grupales para crecer.',
}

function getPageTitle(pathname: string): string {
    if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname]
    const base = '/' + pathname.split('/').filter(Boolean)[0]
    return ROUTE_TITLES[base] || 'Quest'
}

function getPageSubtitle(pathname: string): string | undefined {
    if (ROUTE_SUBTITLES[pathname]) return ROUTE_SUBTITLES[pathname]
    const base = '/' + pathname.split('/').filter(Boolean)[0]
    return ROUTE_SUBTITLES[base]
}

export function GlassHeader() {
    const pathname = usePathname()
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => setMounted(true), [])

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const isDark = !mounted ? true : resolvedTheme === 'dark'
    const title = getPageTitle(pathname)
    const subtitle = getPageSubtitle(pathname)

    const bg = scrolled
        ? (isDark ? 'rgba(13,15,20,0.55)' : 'rgba(240,241,244,0.55)')
        : 'transparent'
    const border = scrolled
        ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')
        : 'transparent'
    const textColor = isDark ? '#FFFFFF' : '#111318'
    const iconColor = isDark ? '#9CA0B5' : '#6B7080'

    return (
        <header
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-16 transition-all duration-300"
            style={{
                backgroundColor: bg,
                borderBottom: `1px solid ${border}`,
                backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
                WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
            }}
        >
            {/* Left — Q logo + dynamic page title */}
            <div className="flex items-center gap-3">
                <div
                    className="size-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: isDark ? '#1E2330' : '#111318' }}
                >
                    <span className="font-display text-sm font-bold text-white">Q</span>
                </div>
                <div className="flex flex-col justify-center">
                    <span
                        className="font-display text-[20px] font-bold tracking-tight leading-tight"
                        style={{ color: textColor }}
                    >
                        {title}
                    </span>
                    {subtitle && (
                        <span
                            className="text-[10px] font-sans leading-tight"
                            style={{ color: iconColor }}
                        >
                            {subtitle}
                        </span>
                    )}
                </div>
            </div>

            {/* Right — Bell icon */}
            <button className="relative p-1">
                <Bell className="size-6" style={{ color: iconColor }} />
                <span
                    className="absolute top-1 right-1 size-2 rounded-full ring-2"
                    style={{
                        backgroundColor: '#FF6B6B',
                        boxShadow: `0 0 0 2px ${isDark ? '#1A1E2A' : '#FFFFFF'}`,
                    }}
                />
            </button>
        </header>
    )
}
