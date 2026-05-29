'use client'

import { useActionState, useState } from 'react'
import { DollarSign, Flame, AlertTriangle, ArrowRight, CheckCircle2, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { canjearPuntosAction, recuperarRachaAction } from '../actions'
import { Tables } from '@/types/database'
import { RecuperarRachaModal } from './recuperar-racha-modal'

type Perfil = {
    id: string
    nombre_usuario: string
    xp: number | null
    nivel: number | null
}

export function DeudasClient({
    perfil,
    penalizaciones,
    canjeos,
    tasaCanjeo,
    costoRecuperarRacha,
    streakIsBroken,
    previousStreak,
}: {
    perfil: Perfil | null
    penalizaciones: Tables<'penalizaciones'>[]
    canjeos: Tables<'canjeos'>[]
    tasaCanjeo: number
    costoRecuperarRacha: number
    streakIsBroken: boolean
    previousStreak: number
}) {
    const [showRecuperar, setShowRecuperar] = useState(false)
    const [canjeoState, canjeoAction, canjeoPending] = useActionState(canjearPuntosAction, {})

    const totalDeuda = penalizaciones.reduce((acc, p) => acc + (p.monto - (p.monto_pagado || 0)), 0)
    const xpDisponible = perfil?.xp || 0
    const xpEnDolares = xpDisponible / tasaCanjeo

    if (canjeoState?.message) toast.success(canjeoState.message)
    if (canjeoState?.error) toast.error(canjeoState.error)

    // ── Colors (CSS variables) ────────────────────────────────────────────────
    const cardBg = 'hsl(var(--bg-surface) / 0.60)'
    const border = 'hsl(var(--border))'
    const textClr = 'hsl(var(--foreground))'
    const subClr = 'hsl(var(--muted-foreground))'
    const accentClr = 'hsl(var(--primary))'
    const sectionLbl = 'hsl(var(--quest-text-secondary))'
    const barTrack = 'hsl(var(--muted))'
    const inputBg = 'hsl(var(--bg-surface) / 0.80)'
    const inputBdr = 'hsl(var(--input))'

    const debtClr = totalDeuda > 0 ? '#FF6B6B' : accentClr
    const hasDebt = totalDeuda > 0

    function SectionLabel({ label, color = '#FF6B35' }: { label: string; color?: string }) {
        return (
            <div className="flex items-center gap-3 mb-3">
                <div className="w-5 h-[2px] rounded-sm" style={{ backgroundColor: color }} />
                <span className="text-[11px] font-bold tracking-[2px] font-sans uppercase" style={{ color: sectionLbl }}>
                    {label}
                </span>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">

            {/* ── Balance hero card ──────────────────────────────────────────── */}
            <div
                className="rounded-[24px] p-5"
                style={{
                    backgroundColor: hasDebt
                        ? 'rgba(255,107,107,0.08)'
                        : 'hsl(var(--primary) / 0.08)',
                    border: `1px solid ${hasDebt
                        ? 'rgba(255,107,107,0.16)'
                        : 'hsl(var(--primary) / 0.16)'}`,
                }}
            >
                <div className="flex items-center gap-3 mb-1">
                    {hasDebt
                        ? <AlertTriangle className="size-4" style={{ color: debtClr }} />
                        : <CheckCircle2 className="size-4" style={{ color: debtClr }} />
                    }
                    <span className="text-[13px] font-sans font-[600]" style={{ color: debtClr }}>
                        {hasDebt ? 'Deuda pendiente' : '¡Sin deudas!'}
                    </span>
                </div>
                <div className="flex items-end justify-between">
                    <h2 className="font-display text-[40px] font-bold leading-none" style={{ color: debtClr }}>
                        ${totalDeuda.toFixed(2)}
                    </h2>
                    <div className="text-right">
                        <p className="text-[24px] font-bold font-display" style={{ color: textClr }}>
                            {penalizaciones.length}
                        </p>
                        <p className="text-[11px] font-sans" style={{ color: subClr }}>faltas</p>
                    </div>
                </div>
            </div>

            {/* ── XP Points card ────────────────────────────────────────────── */}
            <div
                className="rounded-[24px] p-5"
                style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
            >
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <p className="text-[11px] font-sans uppercase tracking-[1.5px] font-bold mb-0.5" style={{ color: subClr }}>
                            XP Disponible
                        </p>
                        <span className="font-display text-[28px] font-bold" style={{ color: accentClr }}>
                            {xpDisponible.toLocaleString()}
                        </span>
                        <span className="text-[12px] font-sans ml-1" style={{ color: subClr }}>XP</span>
                    </div>
                    <div className="text-right">
                        <p className="text-[11px] font-sans uppercase tracking-[1.5px] font-bold mb-0.5" style={{ color: subClr }}>
                            Equivale a
                        </p>
                        <span className="font-display text-[22px] font-bold" style={{ color: textClr }}>
                            ${xpEnDolares.toFixed(2)}
                        </span>
                    </div>
                </div>

                <p className="text-[11px] font-sans mb-4" style={{ color: subClr }}>
                    Tasa: {tasaCanjeo} XP = $1.00 — Se descuenta de tu deuda
                </p>

                {/* Canjear form */}
                <form action={canjeoAction} className="flex flex-col gap-3">
                    <div>
                        <Label htmlFor="puntos" className="text-[12px] font-[600]" style={{ color: subClr }}>
                            XP a canjear
                        </Label>
                        <Input
                            id="puntos"
                            name="puntos"
                            type="number"
                            min="1"
                            max={xpDisponible}
                            placeholder={`Máximo: ${xpDisponible}`}
                            className="mt-1 rounded-xl h-11 font-sans text-[14px]"
                            style={{
                                backgroundColor: inputBg,
                                border: `1px solid ${inputBdr}`,
                                color: textClr,
                            }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={canjeoPending || xpDisponible < 1 || !hasDebt}
                        className="w-full h-12 rounded-[14px] flex items-center justify-center gap-2 font-[600] font-sans text-[14px] transition-opacity disabled:opacity-40"
                        style={{
                            backgroundColor: accentClr,
                            color: '#080A10',
                        }}
                    >
                        {canjeoPending ? 'Canjeando…' : '💰 Canjear Puntos'}
                        {!canjeoPending && <ArrowRight className="size-4" />}
                    </button>
                </form>
            </div>

            {/* ── Recuperar racha — solo visible si la racha está rota ─────── */}
            {streakIsBroken && (
                <>
                    <button
                        onClick={() => setShowRecuperar(true)}
                        className="w-full h-12 rounded-[14px] flex items-center justify-center gap-2 font-[600] font-sans text-[14px] transition-opacity"
                        style={{
                            backgroundColor: 'rgba(255,107,53,0.10)',
                            border: '1px solid rgba(255,107,53,0.16)',
                            color: '#FF6B35',
                        }}
                    >
                        <Flame className="size-4" />
                        Recuperar Racha de {previousStreak} días ({costoRecuperarRacha} XP)
                    </button>

                    {showRecuperar && (
                        <RecuperarRachaModal
                            costoXp={costoRecuperarRacha}
                            xpDisponible={xpDisponible}
                            onClose={() => setShowRecuperar(false)}
                        />
                    )}
                </>
            )}

            {/* ── Penalizaciones pendientes ──────────────────────────────────── */}
            {penalizaciones.length > 0 && (
                <div>
                    <SectionLabel label="FALTAS PENDIENTES" color="#FF6B6B" />
                    <div className="flex flex-col gap-2">
                        {penalizaciones.map(p => (
                            <div
                                key={p.id}
                                className="flex items-center justify-between rounded-[16px] px-4 py-3"
                                style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
                            >
                                <div>
                                    <p className="text-[14px] font-[500] font-sans" style={{ color: textClr }}>
                                        {new Date(p.fecha_incumplimiento).toLocaleDateString('es-ES', {
                                            weekday: 'short', day: 'numeric', month: 'short'
                                        })}
                                    </p>
                                    <p className="text-[11px] font-sans" style={{ color: subClr }}>Día sin completar</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[16px] font-bold font-sans" style={{ color: '#FF6B6B' }}>
                                        ${(p.monto - (p.monto_pagado || 0)).toFixed(2)}
                                    </p>
                                    {(p.monto_pagado || 0) > 0 && (
                                        <p className="text-[10px] font-sans" style={{ color: accentClr }}>
                                            −${p.monto_pagado?.toFixed(2)} pagado
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Historial de canjeos ───────────────────────────────────────── */}
            {canjeos.length > 0 && (
                <div>
                    <SectionLabel label="HISTORIAL" />
                    <div className="flex flex-col gap-2">
                        {canjeos.map(c => (
                            <div
                                key={c.id}
                                className="flex items-center justify-between rounded-[16px] px-4 py-3"
                                style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
                            >
                                <div className="flex items-center gap-3">
                                    <History className="size-3.5 shrink-0" style={{ color: subClr }} />
                                    <div>
                                        <p className="text-[13px] font-[500] font-sans" style={{ color: textClr }}>
                                            {c.puntos_usados} XP → ${c.monto_descontado.toFixed(2)}
                                        </p>
                                        <p className="text-[11px] font-sans" style={{ color: subClr }}>
                                            {c.created_at && new Date(c.created_at).toLocaleDateString('es-ES', {
                                                day: 'numeric', month: 'short', year: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-[12px] font-[600] font-sans" style={{ color: accentClr }}>
                                    −${c.monto_descontado.toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
