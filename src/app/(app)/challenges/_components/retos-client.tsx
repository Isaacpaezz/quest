'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Plus, Users, Gift, Trophy, Check, X, Clock, Calendar, User } from 'lucide-react'
import { useTheme } from 'next-themes'
import { CrearRetoForm } from './crear-reto-form'
import { responderInvitacionAction } from '../actions'
import { toast } from 'sonner'

type Reto = {
    id: string
    titulo: string
    descripcion: string | null
    tipo: string
    criterio: { action?: string; count?: number } | null
    recompensa_xp: number | null
    penalizacion_monto: number | null
    fecha_inicio: string
    fecha_fin: string
    completado: boolean | null
    creador_id: string | null
    reto_participantes: {
        usuario_id: string | null
        progreso: number | null
        completado: boolean | null
        estado: string | null
        perfiles: { nombre_usuario: string } | null
    }[]
}

type Perfil = {
    id: string
    nombre_usuario: string
    xp: number | null
    nivel: number | null
}

const LEVEL_THRESHOLDS = [0, 100, 500, 1000, 1500, 2500, 3500, 5000, 7500, 10000]
const LEVEL_NAMES = ['', 'Novato', 'Aprendiz', 'Discípulo', 'Explorador', 'Guerrero', 'Maestro', 'Sabio', 'Profeta', 'Leyenda']

export function RetosClient({
    retos,
    userId,
    perfil,
}: {
    retos: Reto[]
    userId: string
    perfil: Perfil | null
}) {
    const [showCrear, setShowCrear] = useState(false)
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === 'dark'

    const nivel = perfil?.nivel || 1
    const xp = perfil?.xp || 0
    const currentThreshold = LEVEL_THRESHOLDS[nivel - 1] || 0
    const nextThreshold = LEVEL_THRESHOLDS[nivel] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
    const xpInLevel = xp - currentThreshold
    const xpForLevel = nextThreshold - currentThreshold
    const progressPercent = xpForLevel > 0 ? Math.min(100, (xpInLevel / xpForLevel) * 100) : 100

    const cardBg = isDark ? 'rgba(30,35,48,0.44)' : 'rgba(245,246,248,0.9)'
    const cardStroke = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'
    const trackBg = isDark ? 'rgba(30,35,48,0.5)' : 'rgba(0,0,0,0.08)'
    const titleClr = isDark ? '#FFFFFF' : '#1A1A2E'
    const metaClr = isDark ? '#5A6075' : '#8890A5'

    const today = new Date().toISOString().split('T')[0]

    // Categorize retos
    const pendientes = retos.filter(r => {
        const p = r.reto_participantes.find(p => p.usuario_id === userId)
        return p?.estado === 'pendiente'
    })

    const activos = retos.filter(r => {
        const p = r.reto_participantes.find(p => p.usuario_id === userId)
        return p?.estado === 'aceptado' && r.fecha_inicio <= today && r.fecha_fin >= today
    })

    const proximos = retos.filter(r => {
        const p = r.reto_participantes.find(p => p.usuario_id === userId)
        return p?.estado === 'aceptado' && r.fecha_inicio > today
    })

    return (
        <div className="flex flex-col gap-6 pb-6">
            {/* XP Section */}
            {perfil && (
                <div className="rounded-[20px] p-4 flex flex-col gap-2" style={{ backgroundColor: cardBg, border: `1px solid ${cardStroke}` }}>
                    <div className="flex items-center justify-between">
                        <span className="text-[15px] font-sans font-bold" style={{ color: titleClr }}>
                            Nivel {nivel} — {LEVEL_NAMES[nivel] || 'Explorador'}
                        </span>
                        <span className="text-[13px] font-sans font-medium" style={{ color: metaClr }}>
                            {xp.toLocaleString()} / {nextThreshold.toLocaleString()} XP
                        </span>
                    </div>
                    <div className="h-2 rounded-[4px] overflow-hidden" style={{ backgroundColor: trackBg }}>
                        <div className="h-full rounded-[4px] transition-all duration-300" style={{ width: `${progressPercent}%`, backgroundColor: '#2DDAB0' }} />
                    </div>
                </div>
            )}

            {/* Pendientes (invitations) */}
            {pendientes.length > 0 && (
                <Section label="Invitaciones" metaClr={metaClr}>
                    {pendientes.map(reto => (
                        <InvitationCard key={reto.id} reto={reto} isDark={isDark} titleClr={titleClr} metaClr={metaClr} cardBg={cardBg} cardStroke={cardStroke} />
                    ))}
                </Section>
            )}

            {/* Activos */}
            <Section label="Activos" metaClr={metaClr}>
                {activos.length === 0 ? (
                    <EmptyState isDark={isDark} metaClr={metaClr} titleClr={titleClr} />
                ) : (
                    activos.map(reto => (
                        <RetoCard key={reto.id} reto={reto} userId={userId} isDark={isDark} titleClr={titleClr} metaClr={metaClr} cardBg={cardBg} cardStroke={cardStroke} trackBg={trackBg} />
                    ))
                )}
            </Section>

            {/* Próximos */}
            {proximos.length > 0 && (
                <Section label="Próximos" metaClr={metaClr}>
                    {proximos.map(reto => (
                        <RetoCard key={reto.id} reto={reto} userId={userId} isDark={isDark} titleClr={titleClr} metaClr={metaClr} cardBg={cardBg} cardStroke={cardStroke} trackBg={trackBg} />
                    ))}
                </Section>
            )}

            {/* FAB */}
            <button
                onClick={() => setShowCrear(!showCrear)}
                className="fixed bottom-24 right-6 z-30 size-10 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                style={{ backgroundColor: '#2DDAB0' }}
            >
                <Plus className="size-5" style={{ color: '#080A10' }} />
            </button>

            {showCrear && <CrearRetoForm onClose={() => setShowCrear(false)} />}
        </div>
    )
}

function Section({ label, metaClr, children }: { label: string; metaClr: string; children: React.ReactNode }) {
    return (
        <div>
            <span className="text-[13px] font-sans font-bold uppercase mb-3 block" style={{ color: metaClr, letterSpacing: 1.5 }}>
                {label}
            </span>
            <div className="flex flex-col gap-4">{children}</div>
        </div>
    )
}

function InvitationCard({ reto, isDark, titleClr, metaClr, cardBg, cardStroke }: {
    reto: Reto; isDark: boolean; titleClr: string; metaClr: string; cardBg: string; cardStroke: string
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

    const isPersonal = reto.tipo === 'personal'
    const accentColor = isPersonal ? '#2DDAB0' : '#FF6B35'
    const badgeBg = isPersonal ? (isDark ? 'rgba(45,218,176,0.09)' : 'rgba(45,218,176,0.08)') : (isDark ? 'rgba(255,107,53,0.09)' : 'rgba(255,107,53,0.08)')

    const totalParticipants = reto.reto_participantes.length
    const aceptados = reto.reto_participantes.filter(p => p.estado === 'aceptado').length
    const creadorName = reto.reto_participantes.find(p => p.perfiles)?.perfiles?.nombre_usuario

    const formatDate = (d: string) => {
        const date = new Date(d + 'T00:00:00')
        return date.toLocaleDateString('es', { day: 'numeric', month: 'short' })
    }

    return (
        <div className="rounded-[20px] p-4 flex flex-col gap-3" style={{ backgroundColor: cardBg, border: `1px solid ${cardStroke}` }}>
            <div className="flex items-center gap-2">
                <span className="text-[11px] font-sans font-bold px-2.5 py-1 rounded-full" style={{ color: accentColor, backgroundColor: badgeBg }}>
                    {isPersonal ? 'Personal' : 'Grupal'}
                </span>
                <span className="text-[11px] font-sans font-bold px-2.5 py-1 rounded-full" style={{ color: '#FF6B35', backgroundColor: 'rgba(255,107,53,0.09)' }}>
                    🔔 Invitación
                </span>
            </div>
            <h3 className="text-[17px] font-sans font-bold" style={{ color: titleClr }}>{reto.titulo}</h3>
            {reto.descripcion && <p className="text-[13px] font-sans" style={{ color: metaClr }}>{reto.descripcion}</p>}
            {/* Details row */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {reto.creador_id && creadorName && (
                    <div className="flex items-center gap-1 text-[12px] font-sans" style={{ color: metaClr }}>
                        <User className="size-3.5" /> {creadorName}
                    </div>
                )}
                <div className="flex items-center gap-1 text-[12px] font-sans" style={{ color: metaClr }}>
                    <Calendar className="size-3.5" /> {formatDate(reto.fecha_inicio)} → {formatDate(reto.fecha_fin)}
                </div>
                <div className="flex items-center gap-1 text-[12px] font-sans" style={{ color: metaClr }}>
                    <Users className="size-3.5" /> {aceptados}/{totalParticipants}
                </div>
                <div className="flex items-center gap-1 text-[12px] font-sans" style={{ color: metaClr }}>
                    <Gift className="size-3.5" /> +{reto.recompensa_xp || 0} XP
                </div>
            </div>
            {/* XP Proposal Input */}
            {reto.tipo === 'grupal' && (
                <div className="flex items-center gap-3">
                    <label className="text-[12px] font-sans font-medium whitespace-nowrap" style={{ color: metaClr }}>Tu propuesta XP:</label>
                    <input
                        type="number"
                        min="0"
                        value={xpInput}
                        onChange={e => setXpInput(e.target.value)}
                        className="flex-1 h-9 rounded-[10px] px-3 text-[14px] font-sans font-bold text-center outline-none"
                        style={{
                            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                            border: `1px solid ${cardStroke}`,
                            color: titleClr,
                        }}
                    />
                    <span className="text-[12px] font-sans font-bold" style={{ color: accentColor }}>XP</span>
                </div>
            )}
            <div className="flex gap-2 mt-1">
                <button
                    onClick={() => handleRespond(true)}
                    disabled={pending}
                    className="flex-1 h-10 rounded-[12px] font-sans font-bold text-[13px] flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform disabled:opacity-50"
                    style={{ backgroundColor: '#2DDAB0', color: '#080A10' }}
                >
                    <Check className="size-4" /> Aceptar
                </button>
                <button
                    onClick={() => handleRespond(false)}
                    disabled={pending}
                    className="flex-1 h-10 rounded-[12px] font-sans font-bold text-[13px] flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform disabled:opacity-50"
                    style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: metaClr }}
                >
                    <X className="size-4" /> Rechazar
                </button>
            </div>
        </div>
    )
}

function RetoCard({ reto, userId, isDark, titleClr, metaClr, cardBg, cardStroke, trackBg }: {
    reto: Reto; userId: string; isDark: boolean; titleClr: string; metaClr: string; cardBg: string; cardStroke: string; trackBg: string
}) {
    const miParticipacion = reto.reto_participantes.find(p => p.usuario_id === userId)
    const criterio = reto.criterio as { action?: string; count?: number } | null
    const totalParticipantes = reto.reto_participantes.filter(p => p.estado === 'aceptado').length
    const progreso = miParticipacion?.progreso || 0
    const total = criterio?.count || 1
    const progresoPercent = Math.min(100, (progreso / total) * 100)

    const isPersonal = reto.tipo === 'personal'
    const accentColor = isPersonal ? '#2DDAB0' : '#FF6B35'
    const badgeBg = isPersonal ? (isDark ? 'rgba(45,218,176,0.09)' : 'rgba(45,218,176,0.08)') : (isDark ? 'rgba(255,107,53,0.09)' : 'rgba(255,107,53,0.08)')

    const diasRestantes = Math.max(0, Math.ceil((new Date(reto.fecha_fin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))

    return (
        <Link href={`/challenges/${reto.id}`}>
            <div className="rounded-[20px] p-4 flex flex-col gap-3 active:scale-[0.98] transition-transform" style={{ backgroundColor: cardBg, border: `1px solid ${cardStroke}` }}>
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-sans font-bold px-2.5 py-1 rounded-full" style={{ color: accentColor, backgroundColor: badgeBg }}>
                        {isPersonal ? 'Personal' : 'Grupal'}
                    </span>
                    <span className="text-[13px] font-sans font-semibold" style={{ color: metaClr }}>{progreso}/{total} días</span>
                </div>
                <h3 className="text-[17px] font-sans font-bold" style={{ color: titleClr }}>{reto.titulo}</h3>
                <div className="flex items-center gap-2">
                    {(reto.recompensa_xp ?? 0) > 0 ? (
                        <>
                            <Gift className="size-4" style={{ color: metaClr }} />
                            <span className="text-[13px] font-sans font-medium" style={{ color: metaClr }}>+{reto.recompensa_xp} XP</span>
                        </>
                    ) : (
                        <>
                            <Users className="size-4" style={{ color: metaClr }} />
                            <span className="text-[13px] font-sans font-medium" style={{ color: metaClr }}>{totalParticipantes} participante{totalParticipantes !== 1 ? 's' : ''}</span>
                        </>
                    )}
                </div>
                <div className="h-[6px] rounded-[3px] overflow-hidden" style={{ backgroundColor: trackBg }}>
                    <div className="h-full rounded-[3px] transition-all duration-300" style={{ width: `${progresoPercent}%`, backgroundColor: accentColor }} />
                </div>
            </div>
        </Link>
    )
}

function EmptyState({ isDark, metaClr, titleClr }: { isDark: boolean; metaClr: string; titleClr: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="size-14 rounded-2xl flex items-center justify-center mb-3" style={{ backgroundColor: isDark ? 'rgba(30,35,48,0.44)' : 'rgba(0,0,0,0.04)' }}>
                <Trophy className="size-7" style={{ color: metaClr }} />
            </div>
            <p className="text-[13px] font-sans" style={{ color: titleClr }}>No hay retos activos aún.</p>
            <p className="text-[11px] font-sans mt-1" style={{ color: metaClr }}>Crea uno para empezar a crecer.</p>
        </div>
    )
}
