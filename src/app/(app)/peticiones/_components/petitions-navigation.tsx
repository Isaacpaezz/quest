import Link from 'next/link'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

type PetitionNavigationTab = 'community' | 'mine'

interface PetitionsNavigationProps {
  active: PetitionNavigationTab
}

const PETITION_TABS: Array<{
  value: PetitionNavigationTab
  label: string
  href: string
}> = [
  { value: 'community', label: 'Comunidad', href: '/peticiones' },
  { value: 'mine', label: 'Mis peticiones', href: '/peticiones/mis-peticiones' },
]

export function PetitionsNavigation({ active }: PetitionsNavigationProps) {
  return (
    <div className="flex flex-col gap-3 rounded-[24px] border border-border bg-card/70 p-2 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
      <nav aria-label="Navegación de peticiones" className="grid grid-cols-2 gap-1.5 rounded-[18px] bg-muted/60 p-1">
        {PETITION_TABS.map((tab) => {
          const isActive = active === tab.value

          return (
            <Link
              key={tab.value}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex min-h-11 min-w-0 items-center justify-center rounded-[14px] px-3 text-center text-[13px] font-sans font-semibold transition-colors sm:px-4',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-background/80 hover:text-foreground'
              )}
            >
              <span className="truncate">{tab.label}</span>
            </Link>
          )
        })}
      </nav>

      <Link
        href="/peticiones/nueva"
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[16px] bg-primary px-4 text-[13px] font-sans font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
      >
        <Plus className="size-4" />
        Nueva petición
      </Link>
    </div>
  )
}
