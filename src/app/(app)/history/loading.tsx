import { Skeleton } from '@/components/ui/skeleton'

export default function HistoryLoading() {
    return (
        <div>
            {/* Header */}
            <header className="mb-6">
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-4 w-52" />
            </header>

            {/* Calendar Skeleton */}
            <div className="mb-6 overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#151925]">
                {/* Month header */}
                <div className="mb-4 flex items-center justify-between">
                    <Skeleton className="size-8 rounded-full" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="size-8 rounded-full" />
                </div>
                {/* Day names */}
                <div className="mb-2 grid grid-cols-7 gap-1">
                    {[...Array(7)].map((_, i) => (
                        <Skeleton key={i} className="mx-auto h-4 w-6" />
                    ))}
                </div>
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                    {[...Array(35)].map((_, i) => (
                        <Skeleton key={i} className="mx-auto size-9 rounded-lg" />
                    ))}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="flex flex-col gap-2 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-[#151925]"
                    >
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-7 w-12" />
                    </div>
                ))}
            </div>
        </div>
    )
}
