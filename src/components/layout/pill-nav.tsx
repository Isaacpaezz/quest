'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Home, Zap, Menu } from 'lucide-react'
import Link from 'next/link'
import { MenuPanel } from './menu-panel'

// Routes that count as "active" for the Menu tab
const MENU_ROUTES = [
    '/feed', '/community', '/history', '/perfil', '/challenges', '/badges', '/debts', '/admin',
]

// Routes that are the two explicit nav tabs
const HOME_HREF = '/home'
const ZAP_HREF = '/feed'

export function PillNav() {
    const pathname = usePathname()
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)

    useEffect(() => setMounted(true), [])

    const isDark = !mounted ? true : resolvedTheme === 'dark'

    const bg = isDark ? 'rgba(13,15,20,0.94)' : 'rgba(240,241,244,0.94)'
    const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
    const activeColor = isDark ? '#2DDAB0' : '#1AAF8B'
    const inactiveColor = isDark ? '#5A6075' : '#8C9099'

    // Determine which tab is "active"
    const homeActive = pathname.startsWith(HOME_HREF)
    const zapActive = pathname === ZAP_HREF
    // Menu tab is active when on any menu-routed page and not one of the first two tabs
    const menuActive = !homeActive && !zapActive && MENU_ROUTES.some(r => pathname.startsWith(r))

    function dot(show: boolean) {
        return show ? (
            <div
                className="size-[5px] rounded-full"
                style={{ backgroundColor: activeColor }}
            />
        ) : null
    }

    return (
        <>
            <MenuPanel open={menuOpen} onClose={() => setMenuOpen(false)} />

            <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-6 pt-2 px-6">
                <nav
                    className="flex items-center justify-between w-full h-16 rounded-[40px] px-12"
                    style={{
                        backgroundColor: bg,
                        border: `1px solid ${border}`,
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    }}
                >
                    {/* Home */}
                    <Link href={HOME_HREF}>
                        <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1.5">
                                <Home
                                    className="size-[22px]"
                                    style={{ color: homeActive ? activeColor : inactiveColor }}
                                />
                                <span
                                    className="text-[13px] font-semibold font-sans"
                                    style={{ color: homeActive ? activeColor : inactiveColor }}
                                >
                                    Home
                                </span>
                            </div>
                            {dot(homeActive)}
                        </div>
                    </Link>

                    {/* Zap (Feed shortcut) */}
                    <Link href={ZAP_HREF}>
                        <div className="flex flex-col items-center gap-1">
                            <Zap
                                className="size-[22px]"
                                style={{ color: zapActive ? activeColor : inactiveColor }}
                            />
                            {dot(zapActive)}
                        </div>
                    </Link>

                    {/* Menu (hamburger) */}
                    <button
                        onClick={() => setMenuOpen(true)}
                        className="flex flex-col items-center gap-1"
                    >
                        <Menu
                            className="size-[22px]"
                            style={{ color: menuActive ? activeColor : inactiveColor }}
                        />
                        {dot(menuActive)}
                    </button>
                </nav>
            </div>
        </>
    )
}
