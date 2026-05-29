'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { BookOpen, DollarSign, Users, Settings, ChevronRight, Zap, AlertTriangle, Flame, Plus, Share2 } from 'lucide-react'
import { toast } from 'sonner'

type AlertItem = { type: 'streak_danger' | 'high_debt'; name: string; value: string }

export function AdminDashboardClient({
    totalMembers,
    activePlan,
    totalDebt,
    avgXp,
    avgStreak,
    alerts,
    inviteCode,
}: {
    totalMembers: number
    activePlan: string
    totalDebt: number
    avgXp: number
    avgStreak: number
    alerts: AlertItem[]
    inviteCode: string | null
}) {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])
    const isDark = !mounted ? true : resolvedTheme === 'dark'

    const cardBg = isDark ? 'rgba(21,25,37,0.44)' : 'rgba(255,255,255,0.91)'
    const cardBorder = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.031)'
    const textPrimary = isDark ? '#FFFFFF' : '#111318'
    const textSecondary = isDark ? '#5A6075' : '#8C9099'
    const accent = isDark ? '#2DDAB0' : '#1AAF8B'

    const adminLinks = [
        { href: '/admin/planes', icon: BookOpen, label: 'Planes de Lectura', desc: 'Gestiona la cola de planes del grupo' },
        { href: '/admin/penalizaciones', icon: DollarSign, label: 'Penalizaciones', desc: 'Pagos y deudas pendientes' },
        { href: '/admin/miembros', icon: Users, label: 'Miembros', desc: 'Gestiona roles y miembros' },
        { href: '/admin/configuracion', icon: Settings, label: 'Configuración', desc: 'Parámetros y días libres' },
    ]

    const handleShare = async () => {
        if (!inviteCode) return
        const shareData = {
            title: 'Unirse a Quest',
            text: `Únete a mi grupo en Quest con el código: ${inviteCode}`,
            url: `${window.location.origin}/join/${inviteCode}`,
        }
        try {
            if (navigator.share) {
                await navigator.share(shareData)
            } else {
                await navigator.clipboard.writeText(shareData.url!)
                toast.success('Link copiado al portapapeles')
            }
        } catch {
            // User cancelled share
        }
    }

    return (
        <div className="flex flex-col gap-6">
            {/* ─── STATS GRID ─── */}
            <div className="grid grid-cols-2 gap-3">
                {[
                    { label: 'Miembros', value: totalMembers, color: accent },
                    { label: 'Deuda Total', value: `$${totalDebt.toFixed(2)}`, color: '#FF6B6B' },
                    { label: 'XP Promedio', value: avgXp, color: '#A78BFA' },
                    { label: 'Racha Prom.', value: `${avgStreak}d`, color: '#F5A623' },
                ].map(stat => (
                    <div
                        key={stat.label}
                        className="flex flex-col items-center justify-center p-4 rounded-2xl gap-1"
                        style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
                    >
                        <span
                            className="font-display text-[24px] font-bold tracking-[-1px]"
                            style={{ color: stat.color }}
                        >
                            {stat.value}
                        </span>
                        <span className="text-[11px] font-sans" style={{ color: textSecondary }}>
                            {stat.label}
                        </span>
                    </div>
                ))}
            </div>

            {/* ─── PLAN ACTIVO ─── */}
            <div
                className="flex items-center gap-3 p-4 rounded-2xl"
                style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
            >
                <BookOpen className="size-5 shrink-0" style={{ color: accent }} />
                <div className="flex-1 min-w-0">
                    <span className="text-[11px] font-sans block" style={{ color: textSecondary }}>Plan Activo</span>
                    <span className="text-[14px] font-semibold font-sans truncate block" style={{ color: textPrimary }}>
                        {activePlan}
                    </span>
                </div>
            </div>

            {/* ─── ALERTS ─── */}
            {alerts.length > 0 && (
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-[2px] rounded-sm bg-[#FF6B35]" />
                        <span
                            className="text-[11px] font-bold tracking-[2px] font-sans uppercase"
                            style={{ color: isDark ? '#7A8090' : '#6B7080' }}
                        >
                            ALERTAS
                        </span>
                    </div>
                    <div
                        className="rounded-[20px] overflow-hidden"
                        style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
                    >
                        {alerts.slice(0, 5).map((alert, i) => (
                            <div key={`${alert.type}-${alert.name}-${i}`}>
                                <div className="flex items-center gap-3 px-4 py-3">
                                    {alert.type === 'streak_danger' ? (
                                        <Flame className="size-4 shrink-0" style={{ color: '#F5A623' }} />
                                    ) : (
                                        <AlertTriangle className="size-4 shrink-0" style={{ color: '#FF6B6B' }} />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <span className="text-[13px] font-sans block" style={{ color: textPrimary }}>
                                            {alert.name}
                                        </span>
                                        <span className="text-[11px] font-sans" style={{ color: textSecondary }}>
                                            {alert.type === 'streak_danger'
                                                ? `Racha de ${alert.value} en peligro`
                                                : `Deuda: ${alert.value}`}
                                        </span>
                                    </div>
                                </div>
                                {i < Math.min(alerts.length, 5) - 1 && (
                                    <div
                                        className="mx-4"
                                        style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.031)' }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ─── QUICK ACTIONS ─── */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-[2px] rounded-sm" style={{ backgroundColor: accent }} />
                    <span
                        className="text-[11px] font-bold tracking-[2px] font-sans uppercase"
                        style={{ color: isDark ? '#7A8090' : '#6B7080' }}
                    >
                        ACCIONES RÁPIDAS
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Link
                        href="/challenges"
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all active:scale-[0.97]"
                        style={{
                            backgroundColor: isDark ? 'rgba(167,139,250,0.08)' : 'rgba(167,139,250,0.08)',
                            border: `1px solid ${isDark ? 'rgba(167,139,250,0.15)' : 'rgba(167,139,250,0.12)'}`,
                        }}
                    >
                        <Plus className="size-5" style={{ color: '#A78BFA' }} />
                        <span className="text-[12px] font-semibold font-sans" style={{ color: '#A78BFA' }}>
                            Crear Reto
                        </span>
                    </Link>

                    {inviteCode && (
                        <button
                            onClick={handleShare}
                            className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all active:scale-[0.97]"
                            style={{
                                backgroundColor: isDark ? 'rgba(45,218,176,0.08)' : 'rgba(26,175,139,0.08)',
                                border: `1px solid ${isDark ? 'rgba(45,218,176,0.15)' : 'rgba(26,175,139,0.12)'}`,
                            }}
                        >
                            <Share2 className="size-5" style={{ color: accent }} />
                            <span className="text-[12px] font-semibold font-sans" style={{ color: accent }}>
                                Invitar
                            </span>
                        </button>
                    )}
                </div>
            </div>

            {/* ─── OPCIONES ─── */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-[2px] rounded-sm bg-[#FF6B35]" />
                    <span
                        className="text-[11px] font-bold tracking-[2px] font-sans uppercase"
                        style={{ color: isDark ? '#7A8090' : '#6B7080' }}
                    >
                        OPCIONES
                    </span>
                </div>

                <div
                    className="rounded-[20px] overflow-hidden"
                    style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
                >
                    {adminLinks.map((link, i) => (
                        <div key={link.href}>
                            <Link href={link.href} className="block">
                                <div className="flex items-center gap-3 h-[56px] px-4 w-full">
                                    <link.icon className="size-[18px] shrink-0 text-[#9CA0B5]" />
                                    <div className="flex-1 min-w-0">
                                        <span
                                            className="text-[14px] font-[500] font-sans block"
                                            style={{ color: textPrimary }}
                                        >
                                            {link.label}
                                        </span>
                                        <span className="text-[11px] font-sans" style={{ color: textSecondary }}>
                                            {link.desc}
                                        </span>
                                    </div>
                                    <ChevronRight className="size-4 text-[#6B6F85] shrink-0" />
                                </div>
                            </Link>
                            {i < adminLinks.length - 1 && (
                                <div
                                    className="mx-4"
                                    style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.031)' }}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
