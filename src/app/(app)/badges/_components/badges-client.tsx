'use client'

import { useTheme } from 'next-themes'
import { Lock, Flame } from 'lucide-react'
import Link from 'next/link'

type Badge = {
    id: string
    nombre: string
    descripcion: string
    icono: string
    desbloqueado: boolean
    desbloqueado_en: string | null
}

type Perfil = {
    id: string
    nombre_usuario: string
    xp: number | null
    nivel: number | null
} | null

const LEVEL_THRESHOLDS = [0, 100, 500, 1000, 1500, 2500, 3500, 5000, 7500, 10000]

const LEVEL_NAMES: Record<number, string> = {
    1: 'Semilla',
    2: 'Aprendiz',
    3: 'Peregrino',
    4: 'Explorador',
    5: 'Valiente',
    6: 'Guerrero',
    7: 'Campeón',
    8: 'Leyenda',
    9: 'Profeta',
    10: 'Apóstol',
}

export function BadgesClient({ badges, perfil, maxStreak = 0, currentStreak = 0 }: { badges: Badge[]; perfil: Perfil; maxStreak?: number; currentStreak?: number }) {
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme !== 'light'

    const xp = perfil?.xp || 0
    const nivel = perfil?.nivel || 1
    const currentThreshold = LEVEL_THRESHOLDS[nivel - 1] || 0
    const nextThreshold = LEVEL_THRESHOLDS[nivel] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
    const progress = nextThreshold > currentThreshold
        ? ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100
        : 100

    const desbloqueados = badges.filter(b => b.desbloqueado)

    const cardBg = isDark ? 'rgba(21,25,37,0.60)' : 'rgba(255,255,255,0.88)'
    const border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'
    const textClr = isDark ? '#FFFFFF' : '#111318'
    const subClr = isDark ? '#5A6075' : '#8C9099'
    const accentClr = isDark ? '#2DDAB0' : '#1AAF8B'
    const sectionLbl = isDark ? '#7A8090' : '#6B7080'
    const barTrack = isDark ? '#1E2330' : '#E0E3EB'

    return (
        <div className="flex flex-col gap-6">

            {/* XP / Level card */}
            <Link href="/perfil/xp">
                <div
                    className="rounded-[24px] p-5 transition-all active:scale-[0.98] cursor-pointer"
                    style={{ backgroundColor: cardBg, border: `1px solid ${border}` }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-[12px] font-sans uppercase tracking-[1.5px] font-bold" style={{ color: subClr }}>Nivel actual</p>
                            <h2 className="font-display text-[22px] font-bold" style={{ color: textClr }}>
                                Nivel {nivel} — {LEVEL_NAMES[nivel] || 'Maestro'}
                            </h2>
                        </div>
                        <div className="text-right">
                            <p className="font-display text-[22px] font-bold" style={{ color: accentClr }}>
                                {xp.toLocaleString()}
                            </p>
                            <p className="text-[11px] font-sans" style={{ color: subClr }}>XP Total</p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: barTrack }}>
                        <div
                            className="absolute left-0 top-0 h-full rounded-full transition-all"
                            style={{
                                width: `${Math.min(100, progress)}%`,
                                backgroundColor: accentClr,
                            }}
                        />
                    </div>
                    <div className="flex justify-between mt-1.5">
                        <span className="text-[11px] font-sans" style={{ color: subClr }}>Nivel {nivel}</span>
                        <span className="text-[11px] font-sans font-medium" style={{ color: accentClr }}>
                            {nivel >= 10 ? 'MÁXIMO' : 'Ver historial →'}
                        </span>
                    </div>
                </div>
            </Link>

            {/* Streak record card */}
            <div
                className="rounded-[24px] p-5"
                style={{
                    backgroundColor: isDark ? 'rgba(255,107,53,0.06)' : 'rgba(255,107,53,0.04)',
                    border: `1px solid ${isDark ? 'rgba(255,107,53,0.12)' : 'rgba(255,107,53,0.08)'}`,
                }}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Flame className="size-5" style={{ color: '#FF6B35' }} />
                        <span className="text-[12px] font-sans uppercase tracking-[1.5px] font-bold" style={{ color: subClr }}>Racha récord</span>
                    </div>
                    <span className="font-display text-[24px] font-bold" style={{ color: '#FF6B35' }}>
                        {maxStreak}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-[12px] font-sans" style={{ color: subClr }}>
                        Racha actual: <span style={{ color: currentStreak > 0 ? '#FF6B35' : subClr, fontWeight: 600 }}>{currentStreak} días</span>
                    </span>
                    <span className="text-[11px] font-sans" style={{ color: subClr }}>
                        {maxStreak} días máx.
                    </span>
                </div>
                {/* Progress toward next milestone */}
                {(() => {
                    const milestones = [7, 14, 30, 60, 90, 365]
                    const next = milestones.find(m => m > maxStreak)
                    if (!next) return (
                        <div className="mt-2">
                            <div className="h-2 rounded-full" style={{ backgroundColor: '#FF6B35' }} />
                            <span className="text-[10px] font-sans mt-1 block" style={{ color: '#FF6B35' }}>¡Todas las rachas desbloqueadas! 🎉</span>
                        </div>
                    )
                    const prev = milestones[milestones.indexOf(next) - 1] || 0
                    const pct = Math.min(100, ((maxStreak - prev) / (next - prev)) * 100)
                    return (
                        <div className="mt-2">
                            <div className="relative h-2 rounded-full overflow-hidden" style={{ backgroundColor: barTrack }}>
                                <div className="absolute left-0 top-0 h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: '#FF6B35' }} />
                            </div>
                            <span className="text-[10px] font-sans mt-1 block" style={{ color: subClr }}>
                                {maxStreak}/{next} días para el próximo logro
                            </span>
                        </div>
                    )
                })()}
            </div>

            {/* Summary */}
            <p className="text-[13px] font-sans" style={{ color: subClr }}>
                {desbloqueados.length} de {badges.length} desbloqueados
            </p>

            {/* Badges section header */}
            <div className="flex items-center gap-3 -mt-3">
                <div className="w-5 h-[2px] rounded-sm" style={{ backgroundColor: '#FF6B35' }} />
                <span className="text-[11px] font-bold tracking-[2px] font-sans uppercase" style={{ color: sectionLbl }}>
                    COLECCIÓN
                </span>
            </div>

            {/* Badge grid */}
            <div className="grid grid-cols-3 gap-3">
                {badges.map(badge => {
                    const unlocked = badge.desbloqueado
                    return (
                        <div
                            key={badge.id}
                            className="rounded-[20px] p-4 flex flex-col items-center gap-2 text-center relative"
                            style={{
                                backgroundColor: unlocked ? cardBg : isDark ? 'rgba(21,25,37,0.30)' : 'rgba(240,241,244,0.60)',
                                border: `1px solid ${unlocked ? border : 'transparent'}`,
                                opacity: unlocked ? 1 : 0.55,
                            }}
                        >
                            {!unlocked && (
                                <Lock
                                    className="absolute top-3 right-3 size-3"
                                    style={{ color: subClr }}
                                />
                            )}

                            <div
                                className="text-[28px] leading-none"
                                style={{ filter: unlocked ? 'none' : 'grayscale(100%)' }}
                            >
                                {badge.icono}
                            </div>

                            <span
                                className="text-[12px] font-[600] font-sans leading-tight"
                                style={{ color: unlocked ? textClr : subClr }}
                            >
                                {badge.nombre}
                            </span>

                            <span
                                className="text-[10px] font-sans leading-tight line-clamp-2"
                                style={{ color: subClr }}
                            >
                                {badge.descripcion}
                            </span>

                            {unlocked && badge.desbloqueado_en && (
                                <span
                                    className="text-[9px] font-sans"
                                    style={{ color: accentClr }}
                                >
                                    {new Date(badge.desbloqueado_en).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                </span>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
