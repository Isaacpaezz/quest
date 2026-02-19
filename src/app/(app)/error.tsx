'use client'

import { useEffect } from 'react'

export default function AppError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error('App error:', error)
    }, [error])

    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
            <div className="mb-6 text-6xl">😵</div>
            <h2 className="font-display mb-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                ¡Algo salió mal!
            </h2>
            <p className="mb-6 max-w-md text-sm text-slate-500 dark:text-slate-400">
                Ocurrió un error inesperado. Por favor, inténtalo de nuevo.
            </p>
            <button
                onClick={reset}
                className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:opacity-90 active:scale-95"
            >
                Intentar de nuevo
            </button>
        </div>
    )
}
