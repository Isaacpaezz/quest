import { Skeleton } from '@/components/ui/skeleton'

export default function CommunityLoading() {
  return (
    <div>
      <header className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </header>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Skeleton para "Hoy" */}
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="p-6 pb-2">
            <div className="mb-6 flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="h-6 w-24" />
            </div>

            {/* Column Headers Skeleton */}
            <div className="mb-2 flex justify-between px-4">
              <Skeleton className="h-4 w-16" />
              <div className="flex items-center gap-8">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-6" />
              </div>
            </div>
          </div>

          <div className="px-2 pb-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex h-[72px] items-center justify-between border-b border-slate-50 px-4 last:border-0">
                {/* Avatar & Name */}
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                </div>

                {/* Status */}
                <div className="flex items-center gap-10">
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="size-8 rounded-full" />
                  <Skeleton className="h-6 w-6" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skeleton para "Muro" */}
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="p-6 pb-2">
            <div className="mb-6 flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <Skeleton className="h-6 w-24" />
            </div>

            {/* Column Headers Skeleton */}
            <div className="mb-2 flex justify-between px-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          <div className="px-2 pb-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex h-[72px] items-center justify-between border-b border-slate-50 px-4 last:border-0">
                {/* Avatar & Name */}
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="size-4 rounded-full" />
                  </div>
                </div>

                {/* Debt Data */}
                <div className="flex items-center gap-6">
                  <Skeleton className="h-5 w-4" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="size-4 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
