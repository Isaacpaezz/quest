'use client'

import { useEffect } from 'react'

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('Global error:', error)
    }, [error])

    return (
        <html>
            <body className="bg-slate-50 dark:bg-slate-950">
                <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
                    <div className="mb-6 text-6xl">💥</div>
                    <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                        Error crítico
                    </h2>
                    <p className="mb-6 max-w-md text-sm text-slate-500 dark:text-slate-400">
                        Algo salió muy mal. Por favor, recarga la página.
                    </p>
                    <button
                        onClick={reset}
                        className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 active:scale-95"
                    >
                        Recargar página
                    </button>
                </div>
            </body>
        </html>
    )
}
