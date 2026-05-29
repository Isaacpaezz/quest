'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Home, Zap, Menu } from 'lucide-react'
import Link from 'next/link'
import { motion } from '@/lib/motion'
import { useHaptics } from '@/hooks/use-haptics'
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
    const [mounted, setMounted] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const { impactLight } = useHaptics()

    useEffect(() => setMounted(true), [])

    // Determine which tab is "active"
    const homeActive = pathname.startsWith(HOME_HREF)
    const zapActive = pathname === ZAP_HREF
    // Menu tab is active when on any menu-routed page and not one of the first two tabs
    const menuActive = !homeActive && !zapActive && MENU_ROUTES.some(r => pathname.startsWith(r))

    // Determine active tab key for layoutId indicator
    const activeTab = homeActive ? 'home' : zapActive ? 'zap' : menuActive ? 'menu' : null

    function handleTabPress() {
        impactLight()
    }

    if (!mounted) {
        // Skeleton — matches final look but no interactivity
        return (
            <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-6 pt-2 px-6">
                <nav
                    className="flex items-center justify-between w-full h-16 rounded-[40px] px-12"
                    style={{
                        backgroundColor: 'hsl(var(--bg-surface) / 0.94)',
                        border: '1px solid hsl(var(--border))',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    }}
                />
            </div>
        )
    }

    return (
        <>
            <MenuPanel open={menuOpen} onClose={() => setMenuOpen(false)} />

            <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-6 pt-2 px-6">
                <nav
                    className="flex items-center justify-between w-full h-16 rounded-[40px] px-12"
                    style={{
                        backgroundColor: 'hsl(var(--bg-surface) / 0.94)',
                        border: '1px solid hsl(var(--border))',
                        backdropFilter: 'blur(20px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    }}
                >
                    {/* Home */}
                    <Link
                        href={HOME_HREF}
                        onClick={handleTabPress}
                        className="relative flex flex-col items-center gap-1"
                    >
                        <div className="flex items-center gap-1.5">
                            <Home
                                className="size-[22px] transition-colors"
                                style={{ color: homeActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
                            />
                            <span
                                className="text-[13px] font-semibold font-sans transition-colors"
                                style={{ color: homeActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
                            >
                                Home
                            </span>
                        </div>
                        {homeActive && (
                            <motion.div
                                layoutId="nav-indicator"
                                className="size-[5px] rounded-full"
                                style={{ backgroundColor: 'hsl(var(--primary))' }}
                                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                            />
                        )}
                    </Link>

                    {/* Zap (Feed shortcut) */}
                    <Link
                        href={ZAP_HREF}
                        onClick={handleTabPress}
                        className="relative flex flex-col items-center gap-1"
                    >
                        <Zap
                            className="size-[22px] transition-colors"
                            style={{ color: zapActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
                        />
                        {zapActive && (
                            <motion.div
                                layoutId="nav-indicator"
                                className="size-[5px] rounded-full"
                                style={{ backgroundColor: 'hsl(var(--primary))' }}
                                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                            />
                        )}
                    </Link>

                    {/* Menu (hamburger) */}
                    <button
                        onClick={() => {
                            handleTabPress()
                            setMenuOpen(true)
                        }}
                        className="relative flex flex-col items-center gap-1"
                    >
                        <Menu
                            className="size-[22px] transition-colors"
                            style={{ color: menuActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
                        />
                        {menuActive && (
                            <motion.div
                                layoutId="nav-indicator"
                                className="size-[5px] rounded-full"
                                style={{ backgroundColor: 'hsl(var(--primary))' }}
                                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                            />
                        )}
                    </button>
                </nav>
            </div>
        </>
    )
}
