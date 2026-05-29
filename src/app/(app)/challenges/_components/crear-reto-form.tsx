'use client'

import { useActionState, useEffect, useRef } from 'react'
import { crearRetoAction } from '../actions'
import { X } from 'lucide-react'

function getTodayStr() {
    const d = new Date()
    return d.toISOString().split('T')[0]
}

export function CrearRetoForm({ onClose }: { onClose: () => void }) {
    const [state, formAction, pending] = useActionState(crearRetoAction, {})
    const overlayRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (state?.message) onClose()
    }, [state?.message, onClose])

    const sheetBg = 'hsl(var(--bg-surface))'
    const fieldBg = 'hsl(var(--input))'
    const fieldBorder = 'hsl(var(--border))'
    const titleClr = 'hsl(var(--foreground))'
    const labelClr = 'hsl(var(--muted-foreground))'
    const inputClr = 'hsl(var(--foreground))'

    const inputStyle: React.CSSProperties = {
        backgroundColor: fieldBg,
        border: `1px solid ${fieldBorder}`,
        borderRadius: 14,
        padding: '12px 14px',
        fontSize: 14,
        color: inputClr,
        width: '100%',
        outline: 'none',
        fontFamily: 'inherit',
    }

    const selectStyle: React.CSSProperties = {
        ...inputStyle,
        appearance: 'none' as const,
        WebkitAppearance: 'none' as const,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238C9099' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 14px center',
        paddingRight: 36,
    }

    const today = getTodayStr()

    return (
        <div
            ref={overlayRef}
            className="fixed inset-0 z-50 flex items-end justify-center"
            onClick={(e) => { if (e.target === overlayRef.current) onClose() }}
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                className="relative w-full max-w-md rounded-t-[24px] p-6 pb-10 animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto"
                style={{ backgroundColor: sheetBg }}
            >
                <div className="flex flex-col items-center mb-5">
                    <div className="w-10 h-1 rounded-full mb-4" style={{ backgroundColor: 'hsl(var(--border))' }} />
                    <div className="flex items-center justify-between w-full">
                        <h2 className="text-[18px] font-sans font-bold" style={{ color: titleClr }}>Nuevo Reto</h2>
                        <button
                            onClick={onClose}
                            className="size-8 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: 'hsl(var(--muted))' }}
                        >
                            <X className="size-4" style={{ color: labelClr }} />
                        </button>
                    </div>
                </div>

                <form action={formAction} className="flex flex-col gap-4">
                    <div>
                        <label className="text-[12px] font-sans font-medium uppercase tracking-[1px] mb-1.5 block" style={{ color: labelClr }}>Título</label>
                        <input name="titulo" placeholder="Ej: Leer 7 días seguidos" required style={inputStyle} />
                        {state?.errors?.titulo && <p className="text-red-400 text-[11px] mt-1">{state.errors.titulo[0]}</p>}
                    </div>

                    <div>
                        <label className="text-[12px] font-sans font-medium uppercase tracking-[1px] mb-1.5 block" style={{ color: labelClr }}>Descripción</label>
                        <textarea name="descripcion" placeholder="Una breve descripción del reto..." rows={2} style={{ ...inputStyle, resize: 'none' }} />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[12px] font-sans font-medium uppercase tracking-[1px] mb-1.5 block" style={{ color: labelClr }}>Tipo</label>
                            <select name="tipo" defaultValue="personal" style={selectStyle}>
                                <option value="personal">Personal</option>
                                <option value="grupal">Grupal</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[12px] font-sans font-medium uppercase tracking-[1px] mb-1.5 block" style={{ color: labelClr }}>Actividad</label>
                            <select name="criterio_accion" defaultValue="ambas" style={selectStyle}>
                                <option value="lectura">Lectura</option>
                                <option value="oracion">Oración</option>
                                <option value="ambas">Ambas</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[12px] font-sans font-medium uppercase tracking-[1px] mb-1.5 block" style={{ color: labelClr }}>Meta (días)</label>
                            <input name="criterio_cantidad" type="number" min="1" defaultValue="7" style={inputStyle} />
                        </div>
                        <div>
                            <label className="text-[12px] font-sans font-medium uppercase tracking-[1px] mb-1.5 block" style={{ color: labelClr }}>Recompensa XP</label>
                            <input name="recompensa_xp" type="number" min="0" defaultValue="100" style={inputStyle} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[12px] font-sans font-medium uppercase tracking-[1px] mb-1.5 block" style={{ color: labelClr }}>Penalización $</label>
                            <input name="penalizacion_monto" type="number" min="0" step="0.01" defaultValue="0" style={inputStyle} />
                        </div>
                        <div>
                            <label className="text-[12px] font-sans font-medium uppercase tracking-[1px] mb-1.5 block" style={{ color: labelClr }}>Actividad</label>
                            {/* Spacer for alignment */}
                            <div style={{ height: 46 }} />
                        </div>
                    </div>

                    {/* Dates row */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[12px] font-sans font-medium uppercase tracking-[1px] mb-1.5 block" style={{ color: labelClr }}>Fecha Inicio</label>
                            <input name="fecha_inicio" type="date" defaultValue={today} required style={inputStyle} />
                        </div>
                        <div>
                            <label className="text-[12px] font-sans font-medium uppercase tracking-[1px] mb-1.5 block" style={{ color: labelClr }}>Fecha Fin</label>
                            <input name="fecha_fin" type="date" required style={inputStyle} />
                        </div>
                    </div>

                    {state?.error && (
                        <p className="text-red-400 text-[12px] rounded-[12px] p-3" style={{ backgroundColor: 'rgba(239,68,68,0.08)' }}>
                            {state.error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={pending}
                        className="w-full h-12 rounded-[14px] font-sans font-bold text-[15px] transition-all active:scale-[0.98] disabled:opacity-50"
                        style={{ backgroundColor: '#2DDAB0', color: '#080A10' }}
                    >
                        {pending ? 'Creando...' : 'Crear Reto'}
                    </button>
                </form>
            </div>
        </div>
    )
}
