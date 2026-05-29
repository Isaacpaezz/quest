import { Skeleton } from '@/components/ui/skeleton'

export default function CommunityLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* Iglesia card skeleton */}
      <div
        className="rounded-[24px] p-5"
        style={{
          backgroundColor: 'hsl(var(--bg-surface) / 0.50)',
          border: '1px solid hsl(var(--border))',
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-48 mt-2" />
      </div>

      {/* Leaderboard skeleton */}
      <div className="flex flex-col gap-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-[20px] p-4"
            style={{
              backgroundColor: 'hsl(var(--bg-surface) / 0.60)',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <Skeleton className="h-5 w-7" />
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16 mt-1" />
            </div>
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}
