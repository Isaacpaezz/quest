import { type LucideIcon } from 'lucide-react'

type EmptyStateProps = {
  Icon: LucideIcon
  title: string
  description: string
  children?: React.ReactNode
}

export function EmptyState({ Icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 rounded-lg bg-muted/50">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-background mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-muted-foreground">{description}</p>
      {children && <div className="mt-6">{children}</div>}
    </div>
  )
}
