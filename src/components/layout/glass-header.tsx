'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
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
    '/peticiones': 'Peticiones',
    '/peticiones/mis-peticiones': 'Mis peticiones',
    '/peticiones/nueva': 'Nueva petición',
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
    '/peticiones': 'Oramos unos por otros con intención.',
    '/peticiones/mis-peticiones': 'Tus motivos de oración y testimonios.',
    '/peticiones/nueva': 'Compartí una necesidad para orar.',
}

function getPageTitle(pathname: string): string {
    if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname]
    if (pathname.startsWith('/peticiones/') && pathname.endsWith('/editar')) return 'Editar petición'
    if (/^\/peticiones\/[^/]+$/.test(pathname)) return 'Petición'
    const base = '/' + pathname.split('/').filter(Boolean)[0]
    return ROUTE_TITLES[base] || 'Quest'
}

function getPageSubtitle(pathname: string): string | undefined {
    if (ROUTE_SUBTITLES[pathname]) return ROUTE_SUBTITLES[pathname]
    if (pathname.startsWith('/peticiones/') && pathname.endsWith('/editar')) return 'Actualizá los detalles con claridad.'
    if (/^\/peticiones\/[^/]+$/.test(pathname)) return 'Detalle y seguimiento de oración.'
    const base = '/' + pathname.split('/').filter(Boolean)[0]
    return ROUTE_SUBTITLES[base]
}

export function GlassHeader() {
    const pathname = usePathname()
    const [mounted, setMounted] = useState(false)
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => setMounted(true), [])

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 10)
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    const title = getPageTitle(pathname)
    const subtitle = getPageSubtitle(pathname)

    return (
        <header
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 h-16 transition-all duration-300"
            style={{
                backgroundColor: scrolled ? 'hsl(var(--glass-bg))' : 'transparent',
                borderBottom: `1px solid ${scrolled ? 'hsl(var(--glass-border))' : 'transparent'}`,
                backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
                WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
            }}
        >
            {/* Left — Q logo + dynamic page title */}
            <div className="flex items-center gap-3">
                <div
                    className="size-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'hsl(var(--foreground))' }}
                >
                    <span className="font-display text-sm font-bold text-white">Q</span>
                </div>
                <div className="flex flex-col justify-center">
                    <span
                        className="font-display text-[20px] font-bold tracking-tight leading-tight"
                        style={{ color: 'hsl(var(--foreground))' }}
                    >
                        {title}
                    </span>
                    {subtitle && (
                        <span
                            className="text-[10px] font-sans leading-tight"
                            style={{ color: 'hsl(var(--muted-foreground))' }}
                        >
                            {subtitle}
                        </span>
                    )}
                </div>
            </div>

            {/* Right — Bell icon */}
            <button className="relative p-1 touch-press">
                <Bell
                    className="size-6"
                    style={{ color: 'hsl(var(--muted-foreground))' }}
                />
                <span
                    className="absolute top-1 right-1 size-2 rounded-full ring-2"
                    style={{
                        backgroundColor: 'hsl(var(--destructive))',
                        boxShadow: '0 0 0 2px hsl(var(--background))',
                    }}
                />
            </button>
        </header>
    )
}
