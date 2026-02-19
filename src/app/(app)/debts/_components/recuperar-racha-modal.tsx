'use client'

import { useActionState } from 'react'
import { Flame, X, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { recuperarRachaAction } from '../actions'
import { toast } from 'sonner'

export function RecuperarRachaModal({
    costoXp,
    xpDisponible,
    onClose,
}: {
    costoXp: number
    xpDisponible: number
    onClose: () => void
}) {
    const [state, formAction, pending] = useActionState(recuperarRachaAction, {})

    const puedePagar = xpDisponible >= costoXp

    if (state?.message) {
        toast.success(state.message)
        onClose()
    }
    if (state?.error) {
        toast.error(state.error)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-md mx-auto rounded-t-3xl sm:rounded-3xl bg-white border border-slate-200 shadow-xl p-6 animate-in slide-in-from-bottom-4 duration-300">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                >
                    <X className="h-5 w-5 text-slate-400" />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-4">
                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200/50">
                        <Flame className="h-8 w-8 text-white" />
                    </div>
                </div>

                <h2 className="text-xl font-bold text-slate-900 text-center mb-2">
                    ¿Recuperar Racha?
                </h2>
                <p className="text-sm text-slate-500 text-center mb-6">
                    Perdiste tu racha, pero puedes recuperarla gastando XP.
                </p>

                {/* Cost breakdown */}
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-slate-600">Costo</span>
                        <span className="text-lg font-bold text-amber-600">{costoXp} XP</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Tu XP</span>
                        <span className={cn(
                            'text-lg font-bold',
                            puedePagar ? 'text-green-600' : 'text-red-500'
                        )}>
                            {xpDisponible} XP
                        </span>
                    </div>
                    {!puedePagar && (
                        <div className="flex items-center gap-2 mt-3 text-red-500 text-xs">
                            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                            <span>No tienes suficiente XP. Necesitas {costoXp - xpDisponible} más.</span>
                        </div>
                    )}
                </div>

                <form action={formAction}>
                    <input type="hidden" name="racha_previa" value="0" />
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            onClick={onClose}
                            variant="outline"
                            className="flex-1 rounded-xl h-12"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={!puedePagar || pending}
                            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-12"
                        >
                            {pending ? 'Recuperando...' : '🔥 Recuperar'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
