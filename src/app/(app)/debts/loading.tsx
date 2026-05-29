import { Skeleton } from '@/components/ui/skeleton'

export default function DebtsLoading() {
    return (
        <div>
            {/* Header */}
            <header className="mb-6">
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
            </header>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Balance Card */}
                <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#151925]">
                    <Skeleton className="h-5 w-32 mb-4" />
                    <Skeleton className="h-10 w-40 mb-6" />
                    <div className="flex gap-4">
                        <Skeleton className="h-9 w-28 rounded-xl" />
                        <Skeleton className="h-9 w-36 rounded-xl" />
                    </div>
                </div>

                {/* Exchange Card */}
                <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#151925]">
                    <Skeleton className="h-5 w-40 mb-4" />
                    <Skeleton className="h-10 w-full rounded-xl mb-4" />
                    <Skeleton className="h-9 w-full rounded-xl" />
                </div>
            </div>

            {/* Penalties List */}
            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:border-white/5 dark:bg-[#151925]">
                <div className="p-6 pb-2">
                    <Skeleton className="h-6 w-44 mb-4" />
                </div>
                <div className="px-4 pb-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between border-b border-slate-50 px-2 py-4 last:border-0 dark:border-white/5">
                            <div className="flex items-center gap-3">
                                <Skeleton className="size-8 rounded-full" />
                                <div>
                                    <Skeleton className="h-4 w-32 mb-1" />
                                    <Skeleton className="h-3 w-20" />
                                </div>
                            </div>
                            <Skeleton className="h-5 w-16" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
