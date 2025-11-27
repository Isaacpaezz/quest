'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Activity, Clock, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/sustento-diario', label: 'Sustento', icon: Home },
  { href: '/comunidad', label: 'Comunidad', icon: Users },
  { href: '/feed', label: 'Feed', icon: Activity, isFab: true },
  { href: '/historial', label: 'Historial', icon: Clock },
  { href: '/perfil', label: 'Perfil', icon: User },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 z-50 w-full border-t border-slate-200/60 bg-white pb-safe shadow-[0_-4px_16px_rgba(0,0,0,0.04)]">
      <div className="mx-auto w-full max-w-2xl">
        <div className="grid h-16 grid-cols-5 items-end">
          {navLinks.map(({ href, label, icon: Icon, isFab }) => {
            const isActive = pathname.startsWith(href)

            if (isFab) {
              return (
                <div key={label} className="relative flex h-full items-center justify-center">
                  <Link
                    href={href}
                    className="absolute -top-7 left-1/2 flex h-[60px] w-[60px] -translate-x-1/2 items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/40 transition-all active:scale-95"
                  >
                    <Activity className="h-7 w-7 stroke-[2.5]" />
                  </Link>
                </div>
              )
            }

            return (
              <Link
                key={label}
                href={href}
                className="flex h-full flex-col items-center justify-center gap-0.5 pb-1 transition-colors"
              >
                <Icon 
                  className={cn(
                    "h-6 w-6 stroke-[1.5] transition-all",
                    isActive ? "text-indigo-600" : "text-slate-400"
                  )} 
                />
                <span 
                  className={cn(
                    "text-[10px] font-medium transition-colors",
                    isActive ? "text-indigo-600" : "text-slate-400"
                  )}
                >
                  {label}
                </span>
                {isActive && (
                  <div className="absolute bottom-0.5 h-1 w-1 rounded-full bg-indigo-600" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
