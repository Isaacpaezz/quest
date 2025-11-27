'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Activity, BookOpen, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/', label: 'Inicio', icon: Home },
  { href: '/comunidad', label: 'Comunidad', icon: Users },
  { href: '/nuevo', label: 'Nuevo', icon: Activity, isFab: true },
  { href: '/historial', label: 'Historial', icon: BookOpen },
  { href: '/perfil', label: 'Perfil', icon: User },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 z-50 w-full border-t border-slate-200/60 bg-white/90 pb-safe backdrop-blur-xl">
      <div className="mx-auto w-full max-w-2xl">
        <div className="grid grid-cols-5 items-end h-16">
          {navLinks.map(({ href, label, icon: Icon, isFab }) => {
            const isActive = pathname === href

            if (isFab) {
              return (
                <div key={label} className="relative flex h-full items-center justify-center">
                  <Link
                    href={href}
                    className="absolute -top-6 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border-4 border-[#f8fafc] bg-[#5B5FEF] text-white shadow-lg shadow-indigo-500/30 transition-transform active:scale-95"
                  >
                    <Icon className="h-7 w-7" />
                  </Link>
                </div>
              )
            }

            return (
              <Link
                key={label}
                href={href}
                className={cn(
                  "flex h-full flex-col items-center justify-center gap-1 pb-1 transition-colors",
                  isActive ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <Icon className={cn("h-6 w-6 transition-all", isActive && "scale-110")} />
                {isActive && (
                  <span className="absolute bottom-1 h-1 w-1 rounded-full bg-indigo-600" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
