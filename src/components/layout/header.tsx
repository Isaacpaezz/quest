import Link from 'next/link'
import { Bell, User } from 'lucide-react'

export function Header() {
  return (
    <header className="fixed top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-100/50 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-full w-full max-w-2xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900">
            <span className="font-display font-bold text-white">Q</span>
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-slate-900">
            Quest
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative text-slate-500 transition-colors hover:text-slate-900">
            <Bell className="h-6 w-6" />
            <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>
          
          <Link href="/perfil">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 ring-2 ring-white transition-all hover:ring-slate-200">
              <User className="h-5 w-5 text-slate-500" />
            </div>
          </Link>
        </div>
      </div>
    </header>
  )
}
