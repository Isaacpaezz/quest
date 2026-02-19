'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { useTheme } from 'next-themes'
import { ChevronRight, Check, X, Gift, Trophy, Calendar, Users, User } from 'lucide-react'
import { responderInvitacionAction } from '@/app/(app)/challenges/actions'
import { toast } from 'sonner'

type Reto = {
    id: string
    titulo: string
    descripcion: string | null
    tipo: string
    criterio: { action?: string; count?: number } | null
    recompensa_xp: number | null
    fecha_inicio: string
    fecha_fin: string
    creador_id: string | null
    creador: { nombre_usuario: string } | null
    reto_participantes: {
        usuario_id: string | null
        progreso: number | null
        completado: boolean | null
        estado: string | null
    }[]
}

export function RetosHomeSection({
    pendientes,
    activos,
    proximos,
    userId,
}: {
    pendientes: Reto[]
    activos: Reto[]
    proximos: Reto[]
    userId: string
}) {
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === 'dark'

    const cardBg = isDark ? 'rgba(30,35,48,0.44)' : 'rgba(245,246,248,0.9)'
    const cardStroke = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'
    const titleClr = isDark ? '#FFFFFF' : '#1A1A2E'
    const metaClr = isDark ? '#5A6075' : '#8890A5'
    const trackBg = isDark ? 'rgba(30,35,48,0.5)' : 'rgba(0,0,0,0.08)'

    const hasSomething = pendientes.length > 0 || activos.length > 0 || proximos.length > 0
    if (!hasSomething) return null

    return (
        <div className="flex flex-col gap-4">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <span className="text-[13px] font-sans font-bold uppercase" style={{ color: metaClr, letterSpacing: 1.5 }}>
                    Retos
                </span>
                <Link href="/challenges" className="flex items-center gap-0.5 text-[12px] font-sans font-semibold" style={{ color: '#2DDAB0' }}>
                    Ver todos <ChevronRight className="size-3.5" />
                </Link>
            </div>

            {/* Pending invitations */}
            {pendientes.map(reto => (
                <InvitationMiniCard
                    key={reto.id}
                    reto={reto}
                    isDark={isDark}
                    cardBg={cardBg}
                    cardStroke={cardStroke}
                    titleClr={titleClr}
                    metaClr={metaClr}
                />
            ))}

            {/* Active challenges */}
            {activos.slice(0, 3).map(reto => (
                <MiniRetoCard
                    key={reto.id}
                    reto={reto}
                    userId={userId}
                    isDark={isDark}
                    cardBg={cardBg}
                    cardStroke={cardStroke}
                    titleClr={titleClr}
                    metaClr={metaClr}
                    trackBg={trackBg}
                />
            ))}

            {/* Upcoming */}
            {activos.length === 0 && proximos.slice(0, 2).map(reto => (
                <MiniRetoCard
                    key={reto.id}
                    reto={reto}
                    userId={userId}
                    isDark={isDark}
                    cardBg={cardBg}
                    cardStroke={cardStroke}
                    titleClr={titleClr}
                    metaClr={metaClr}
                    trackBg={trackBg}
                    isUpcoming
                />
            ))}
        </div>
    )
}

function formatDateShort(dateStr: string) {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('es', { day: 'numeric', month: 'short' })
}

function InvitationMiniCard({ reto, isDark, cardBg, cardStroke, titleClr, metaClr }: {
    reto: Reto; isDark: boolean; cardBg: string; cardStroke: string; titleClr: string; metaClr: string
}) {
    const [pending, startTransition] = useTransition()
    const [xpInput, setXpInput] = useState(String(reto.recompensa_xp || 100))

    const handleRespond = (aceptar: boolean) => {
        startTransition(async () => {
            const xpValue = aceptar ? parseInt(xpInput) || (reto.recompensa_xp || 100) : undefined
            const result = await responderInvitacionAction(reto.id, aceptar, xpValue)
            if (result.error) toast.error(result.error)
            else toast.success(result.message)
        })
    }

    const accentColor = '#FF6B35'
    const totalParticipants = reto.reto_participantes.length
    const aceptados = reto.reto_participantes.filter(p => p.estado === 'aceptado').length

    return (
        <div className="rounded-[16px] p-3.5 flex flex-col gap-2.5" style={{ backgroundColor: cardBg, border: `1px solid ${cardStroke}` }}>
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full" style={{ color: '#FF6B35', backgroundColor: 'rgba(255,107,53,0.09)' }}>
                    🔔 Invitación
                </span>
                <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full" style={{ color: '#FF6B35', backgroundColor: 'rgba(255,107,53,0.09)' }}>
                    Grupal
                </span>
            </div>
            <h3 className="text-[14px] font-sans font-bold" style={{ color: titleClr }}>{reto.titulo}</h3>
            {reto.descripcion && (
                <p className="text-[12px] font-sans line-clamp-2" style={{ color: metaClr }}>{reto.descripcion}</p>
            )}
            {/* Meta info row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {reto.creador && (
                    <div className="flex items-center gap-1 text-[11px] font-sans" style={{ color: metaClr }}>
                        <User className="size-3" /> {reto.creador.nombre_usuario}
                    </div>
                )}
                <div className="flex items-center gap-1 text-[11px] font-sans" style={{ color: metaClr }}>
                    <Calendar className="size-3" /> {formatDateShort(reto.fecha_inicio)} → {formatDateShort(reto.fecha_fin)}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-sans" style={{ color: metaClr }}>
                    <Users className="size-3" /> {aceptados}/{totalParticipants}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-sans" style={{ color: metaClr }}>
                    <Gift className="size-3" /> +{reto.recompensa_xp || 0} XP
                </div>
            </div>
            {/* Compact XP proposal */}
            <div className="flex items-center gap-2">
                <span className="text-[11px] font-sans font-medium whitespace-nowrap" style={{ color: metaClr }}>Tu propuesta:</span>
                <input
                    type="number"
                    min="0"
                    value={xpInput}
                    onChange={e => setXpInput(e.target.value)}
                    className="flex-1 h-7 rounded-[8px] px-2 text-[13px] font-sans font-bold text-center outline-none"
                    style={{
                        backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                        border: `1px solid ${cardStroke}`,
                        color: titleClr,
                    }}
                />
                <span className="text-[11px] font-sans font-bold" style={{ color: accentColor }}>XP</span>
            </div>
            <div className="flex gap-2">
                <button
                    onClick={() => handleRespond(true)}
                    disabled={pending}
                    className="flex-1 h-8 rounded-[10px] font-sans font-bold text-[12px] flex items-center justify-center gap-1 active:scale-[0.97] transition-transform disabled:opacity-50"
                    style={{ backgroundColor: '#2DDAB0', color: '#080A10' }}
                >
                    <Check className="size-3.5" /> Aceptar
                </button>
                <button
                    onClick={() => handleRespond(false)}
                    disabled={pending}
                    className="flex-1 h-8 rounded-[10px] font-sans font-bold text-[12px] flex items-center justify-center gap-1 active:scale-[0.97] transition-transform disabled:opacity-50"
                    style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: metaClr }}
                >
                    <X className="size-3.5" /> Rechazar
                </button>
            </div>
        </div>
    )
}

function MiniRetoCard({ reto, userId, isDark, cardBg, cardStroke, titleClr, metaClr, trackBg, isUpcoming }: {
    reto: Reto; userId: string; isDark: boolean; cardBg: string; cardStroke: string; titleClr: string; metaClr: string; trackBg: string; isUpcoming?: boolean
}) {
    const miP = reto.reto_participantes.find(p => p.usuario_id === userId)
    const criterio = reto.criterio as { action?: string; count?: number } | null
    const progreso = miP?.progreso || 0
    const total = criterio?.count || 1
    const progresoPercent = Math.min(100, (progreso / total) * 100)

    const isPersonal = reto.tipo === 'personal'
    const accentColor = isPersonal ? '#2DDAB0' : '#FF6B35'
    const badgeBg = isPersonal ? (isDark ? 'rgba(45,218,176,0.09)' : 'rgba(45,218,176,0.08)') : (isDark ? 'rgba(255,107,53,0.09)' : 'rgba(255,107,53,0.08)')

    const diasRestantes = Math.max(0, Math.ceil((new Date(reto.fecha_fin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

    return (
        <Link href={`/challenges/${reto.id}`}>
            <div className="rounded-[16px] p-3.5 flex flex-col gap-2 active:scale-[0.98] transition-transform" style={{ backgroundColor: cardBg, border: `1px solid ${cardStroke}` }}>
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-sans font-bold px-2 py-0.5 rounded-full" style={{ color: accentColor, backgroundColor: badgeBg }}>
                        {isPersonal ? 'Personal' : 'Grupal'}
                    </span>
                    {isUpcoming ? (
                        <span className="text-[11px] font-sans font-semibold" style={{ color: metaClr }}>
                            Inicia en {Math.max(0, Math.ceil((new Date(reto.fecha_inicio).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}d
                        </span>
                    ) : (
                        <span className="text-[11px] font-sans font-semibold" style={{ color: metaClr }}>
                            {progreso}/{total} días
                        </span>
                    )}
                </div>
                <h3 className="text-[14px] font-sans font-bold" style={{ color: titleClr }}>{reto.titulo}</h3>
                {!isUpcoming && (
                    <div className="h-[5px] rounded-[3px] overflow-hidden" style={{ backgroundColor: trackBg }}>
                        <div className="h-full rounded-[3px] transition-all duration-300" style={{ width: `${progresoPercent}%`, backgroundColor: accentColor }} />
                    </div>
                )}
            </div>
        </Link>
    )
}
