import { Skeleton } from '@/components/ui/skeleton'

export default function ProfileLoading() {
    return (
        <div>
            {/* Profile Header */}
            <div className="mb-8 flex flex-col items-center gap-4">
                <Skeleton className="size-20 rounded-full" />
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-24" />
            </div>

            {/* Stats Grid */}
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-[#151925]"
                    >
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                ))}
            </div>

            {/* XP Bar */}
            <div className="mb-6 overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#151925]">
                <div className="flex items-center justify-between mb-3">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
            </div>

            {/* Settings List */}
            <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-white/5 dark:bg-[#151925]">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-slate-50 px-6 py-4 last:border-0 dark:border-white/5">
                        <div className="flex items-center gap-3">
                            <Skeleton className="size-5" />
                            <Skeleton className="h-4 w-28" />
                        </div>
                        <Skeleton className="size-5" />
                    </div>
                ))}
            </div>
        </div>
    )
}
