import Link from 'next/link'
import { Bell, User } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 border-b bg-background md:hidden">
      <Link href="/sustento-diario">
        <h1 className="text-xl font-bold text-primary">Quest</h1>
      </Link>
      <div className="flex items-center gap-4">
        <Bell className="h-6 w-6 text-muted-foreground" />
        <Link href="/perfil">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <User className="h-5 w-5 text-muted-foreground" />
          </div>
        </Link>
      </div>
    </header>
  )
}
