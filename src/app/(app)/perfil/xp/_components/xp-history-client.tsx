'use client'

import { useRouter } from 'next/navigation'
import { ChevronLeft, Star, TrendingUp, Zap } from 'lucide-react'
import { getXpProgress } from '@/lib/xp-helpers'

type XpEntry = {
    id: string
    cantidad: number
    motivo: string
    referencia_id: string | null
    created_at: string
}

const MOTIVO_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
    lectura_completada: { label: 'Lectura completada', emoji: '📖', color: '#3B82F6' },
    oracion_completada: { label: 'Oración completada', emoji: '🙏', color: '#8B5CF6' },
    oracion_bonus_10min: { label: 'Bonus oración +10min', emoji: '⏱', color: '#A78BFA' },
    racha_bonus: { label: 'Bonus por racha', emoji: '🔥', color: '#F59E0B' },
    devocional_completo: { label: 'Devocional completo', emoji: '✨', color: '#10B981' },
    reto_personal_completado: { label: 'Reto personal', emoji: '🏆', color: '#EF4444' },
    reto_grupal_completado: { label: 'Reto grupal', emoji: '🤝', color: '#EC4899' },
}

function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return date.toLocaleDateString('es', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function groupByDay(entries: XpEntry[]): { date: string; entries: XpEntry[]; total: number }[] {
    const groups: Map<string, XpEntry[]> = new Map()
    for (const entry of entries) {
        const dayKey = new Date(entry.created_at).toLocaleDateString('es', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        })
        if (!groups.has(dayKey)) groups.set(dayKey, [])
        groups.get(dayKey)!.push(entry)
    }
    return Array.from(groups.entries()).map(([date, entries]) => ({
        date,
        entries,
        total: entries.reduce((sum, e) => sum + e.cantidad, 0),
    }))
}

export function XpHistoryClient({ xp, nivel, history }: { xp: number; nivel: number; history: XpEntry[] }) {
    const router = useRouter()
    const progress = getXpProgress(xp, nivel)
    const grouped = groupByDay(history)

    const cardBg = 'hsl(var(--bg-surface) / 0.44)'
    const cardBorder = 'hsl(var(--border))'
    const tp = 'hsl(var(--foreground))'
    const ts = 'hsl(var(--muted-foreground))'

    return (
        <div className="flex flex-col gap-6 pb-24">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-all active:scale-90"
                    style={{ background: 'hsl(var(--muted))' }}
                >
                    <ChevronLeft className="h-5 w-5" style={{ color: ts }} />
                </button>
                <h1 className="font-sora text-[22px] font-bold" style={{ color: tp, letterSpacing: -0.5 }}>
                    Historial XP
                </h1>
            </div>

            {/* XP Summary Card */}
            <div
                className="flex flex-col gap-4 p-5 rounded-3xl"
                style={{
                    backgroundColor: cardBg,
                    border: `1px solid ${cardBorder}`,
                    boxShadow: 'var(--quest-shadow-card)',
                }}
            >
                {/* Level + XP */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div
                            className="flex h-10 w-10 items-center justify-center rounded-2xl"
                            style={{ background: 'hsl(var(--muted))' }}
                        >
                            <Zap className="size-5" style={{ color: '#8B5CF6' }} />
                        </div>
                        <div>
                            <span className="text-[15px] font-semibold font-sans block" style={{ color: tp }}>
                                Nivel {nivel}
                            </span>
                            <span className="text-[12px] font-sans" style={{ color: ts }}>
                                {xp.toLocaleString()} XP total
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-[24px] font-bold font-sora block" style={{ color: '#8B5CF6' }}>
                            {progress.percentage}%
                        </span>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                    <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                            width: `${progress.percentage}%`,
                            background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)',
                        }}
                    />
                </div>
                <div className="flex justify-between">
                    <span className="text-[11px] font-sans" style={{ color: ts }}>
                        {progress.current.toLocaleString()} / {progress.needed.toLocaleString()} para nivel {Math.min(nivel + 1, 10)}
                    </span>
                </div>
            </div>

            {/* History grouped by day */}
            {grouped.length === 0 ? (
                <div
                    className="flex flex-col items-center gap-3 py-12 rounded-3xl"
                    style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
                >
                    <Star className="size-8" style={{ color: ts }} />
                    <p className="text-[14px] font-sans" style={{ color: ts }}>
                        Aún no hay historial de XP
                    </p>
                    <p className="text-[12px] font-sans" style={{ color: ts }}>
                        Completa lecturas y oraciones para ganar XP
                    </p>
                </div>
            ) : (
                grouped.map((group) => (
                    <div key={group.date} className="flex flex-col gap-2">
                        {/* Day header */}
                        <div className="flex items-center justify-between px-1">
                            <span
                                className="text-[12px] font-semibold font-sans capitalize"
                                style={{ color: ts }}
                            >
                                {group.date}
                            </span>
                            <span
                                className="text-[12px] font-bold font-sans"
                                style={{ color: '#10B981' }}
                            >
                                +{group.total} XP
                            </span>
                        </div>

                        {/* Entries card */}
                        <div
                            className="rounded-[20px] overflow-hidden"
                            style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
                        >
                            {group.entries.map((entry, i) => {
                                const info = MOTIVO_LABELS[entry.motivo] || {
                                    label: entry.motivo,
                                    emoji: '⭐',
                                    color: '#6B7280',
                                }
                                const time = new Date(entry.created_at).toLocaleTimeString('es', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })
                                return (
                                    <div
                                        key={entry.id}
                                        className="flex items-center gap-3 px-4 py-3"
                                        style={{
                                            borderBottom:
                                                i < group.entries.length - 1 ? `1px solid ${cardBorder}` : 'none',
                                        }}
                                    >
                                        {/* Emoji badge */}
                                        <div
                                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[16px]"
                                            style={{ background: `${info.color}15` }}
                                        >
                                            {info.emoji}
                                        </div>

                                        {/* Label + time */}
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="text-[13px] font-sans font-medium truncate" style={{ color: tp }}>
                                                {info.label}
                                            </span>
                                            <span className="text-[11px] font-sans" style={{ color: ts }}>
                                                {time}
                                            </span>
                                        </div>

                                        {/* XP amount */}
                                        <span
                                            className="text-[14px] font-bold font-sans shrink-0"
                                            style={{ color: '#10B981' }}
                                        >
                                            +{entry.cantidad}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}
