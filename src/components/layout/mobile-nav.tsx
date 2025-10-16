'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, Users, Newspaper, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/sustento-diario', label: 'Sustento Diario', icon: BookOpen },
  { href: '/comunidad', label: 'Comunidad', icon: Users },
  // { href: '/feed', label: 'Feed', icon: Newspaper }, // Descomentar cuando exista la página
  { href: '/perfil', label: 'Mi Perfil', icon: User },
]

export function MobileNav() {
  const pathname = usePathname()
  return (
    <nav className="fixed bottom-0 z-10 w-full p-2 border-t bg-background md:hidden">
      <div className="flex justify-around">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link key={label} href={href} className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-md",
              isActive ? "text-primary" : "text-muted-foreground"
            )}>
              <Icon className="h-6 w-6" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
