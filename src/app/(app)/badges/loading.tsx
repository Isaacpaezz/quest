import { Skeleton } from '@/components/ui/skeleton'

export default function BadgesLoading() {
    return (
        <div>
            {/* Header */}
            <header className="mb-6">
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-56" />
            </header>

            {/* XP Bar + Level */}
            <div className="mb-8 overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#151925]">
                <div className="flex items-center justify-between mb-3">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
                <div className="mt-2 flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </div>

            {/* Badge Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {[...Array(10)].map((_, i) => (
                    <div
                        key={i}
                        className="flex flex-col items-center gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#151925]"
                    >
                        <Skeleton className="size-14 rounded-full" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                ))}
            </div>
        </div>
    )
}
