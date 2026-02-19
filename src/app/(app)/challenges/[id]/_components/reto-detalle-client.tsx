'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Gift, TriangleAlert, Users, Trophy, CircleCheck, Timer, Check, X, Trash2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { unirseRetoAction, responderInvitacionAction, eliminarRetoAction } from '../../actions'
import { toast } from 'sonner'

type RetoDetalle = {
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
    creador: { nombre_usuario: string } | null
    reto_participantes: {
        id: string
        usuario_id: string | null
        progreso: number | null
        completado: boolean | null
        estado: string | null
        completado_en: string | null
        perfiles: { nombre_usuario: string; nivel: number | null; xp: number | null } | null
    }[]
}

export function RetoDetalleClient({ reto, userId }: { reto: RetoDetalle; userId: string }) {
    const [pending, startTransition] = useTransition()
    const [xpInput, setXpInput] = useState(String(reto.recompensa_xp || 100))
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const router = useRouter()
    const isCreator = reto.creador_id === userId
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === 'dark'

    const criterio = reto.criterio as { action?: string; count?: number } | null
    const miParticipacion = reto.reto_participantes.find(p => p.usuario_id === userId)
    const yaParticipo = !!miParticipacion
    const isPendiente = miParticipacion?.estado === 'pendiente'
    const totalAceptados = reto.reto_participantes.filter(p => p.estado === 'aceptado').length

    const diasRestantes = Math.max(0, Math.ceil(
        (new Date(reto.fecha_fin).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    ))

    const progreso = miParticipacion?.progreso || 0
    const total = criterio?.count || 1
    const progresoPercent = Math.min(100, (progreso / total) * 100)

    const isPersonal = reto.tipo === 'personal'
    const accentColor = isPersonal ? '#2DDAB0' : '#FF6B35'
    const badgeBg = isPersonal
        ? (isDark ? 'rgba(45,218,176,0.09)' : 'rgba(45,218,176,0.08)')
        : (isDark ? 'rgba(255,107,53,0.09)' : 'rgba(255,107,53,0.08)')

    // Colors from Pencil
    const cardBg = isDark ? 'rgba(30,35,48,0.44)' : 'rgba(245,246,248,0.9)'
    const cardStroke = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'
    const trackBg = isDark ? 'rgba(30,35,48,0.5)' : 'rgba(0,0,0,0.08)'
    const titleClr = isDark ? '#FFFFFF' : '#1A1A2E'
    const metaClr = isDark ? '#5A6075' : '#8890A5'
    const descClr = isDark ? '#5A6075' : '#6B7280'
    const rewardClr = isDark ? 'rgba(255,255,255,0.82)' : '#374151'

    const handleUnirse = () => {
        startTransition(async () => {
            const result = await unirseRetoAction(reto.id)
            if (result.error) toast.error(result.error)
            else toast.success(result.message)
        })
    }

    const handleRespond = (aceptar: boolean) => {
        startTransition(async () => {
            const xpValue = aceptar ? parseInt(xpInput) || (reto.recompensa_xp || 100) : undefined
            const result = await responderInvitacionAction(reto.id, aceptar, xpValue)
            if (result.error) toast.error(result.error)
            else toast.success(result.message)
        })
    }

    const getInitials = (name: string) => {
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    }

    return (
        <div className="flex flex-col gap-5 pb-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between">
                <Link href="/challenges" className="flex items-center gap-2 active:opacity-70 transition-opacity">
                    <ArrowLeft className="size-6" style={{ color: titleClr }} />
                </Link>
                <span className="text-[15px] font-sans font-semibold" style={{ color: titleClr }}>Detalle del Reto</span>
                <div className="size-6" /> {/* spacer */}
            </div>

            {/* Hero Card */}
            <div className="rounded-[20px] p-5 flex flex-col gap-4" style={{ backgroundColor: cardBg, border: `1px solid ${cardStroke}` }}>
                {/* Badge Row */}
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-sans font-bold px-2.5 py-1 rounded-full" style={{ color: accentColor, backgroundColor: badgeBg }}>
                        {isPersonal ? 'Personal' : 'Grupal'}
                    </span>
                    {diasRestantes <= 3 && (
                        <span className="text-[11px] font-sans font-bold px-2.5 py-1 rounded-full" style={{ color: '#FF6B35', backgroundColor: 'rgba(255,107,53,0.09)' }}>
                            {diasRestantes} días restantes
                        </span>
                    )}
                    {reto.completado && (
                        <span className="text-[11px] font-sans font-bold px-2.5 py-1 rounded-full" style={{ color: '#2DDAB0', backgroundColor: 'rgba(45,218,176,0.09)' }}>
                            ✅ Completado
                        </span>
                    )}
                </div>

                {/* Title */}
                <h1 className="text-[20px] font-sans font-extrabold" style={{ color: titleClr }}>{reto.titulo}</h1>

                {/* Description */}
                {reto.descripcion && (
                    <p className="text-[13px] font-sans leading-[1.5]" style={{ color: descClr }}>{reto.descripcion}</p>
                )}

                {/* Progress */}
                {yaParticipo && miParticipacion?.estado === 'aceptado' && (
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[13px] font-sans font-semibold" style={{ color: metaClr }}>Progreso</span>
                            <span className="text-[13px] font-sans font-bold" style={{ color: accentColor }}>
                                {progreso}/{total} días
                            </span>
                        </div>
                        <div className="h-2 rounded-[4px] overflow-hidden" style={{ backgroundColor: trackBg }}>
                            <div className="h-full rounded-[4px] transition-all duration-300" style={{ width: `${progresoPercent}%`, backgroundColor: accentColor }} />
                        </div>
                    </div>
                )}

                {/* Reward */}
                {(reto.recompensa_xp ?? 0) > 0 && (
                    <div className="flex items-center gap-2.5">
                        <Gift className="size-[18px]" style={{ color: accentColor }} />
                        <span className="text-[14px] font-sans font-medium" style={{ color: rewardClr }}>+{reto.recompensa_xp} XP</span>
                    </div>
                )}

                {/* Penalty */}
                {(reto.penalizacion_monto ?? 0) > 0 && (
                    <div className="flex items-center gap-2.5">
                        <TriangleAlert className="size-[18px]" style={{ color: '#FF6B35' }} />
                        <span className="text-[14px] font-sans font-medium" style={{ color: rewardClr }}>Pagar ${reto.penalizacion_monto} al grupo</span>
                    </div>
                )}

                {/* Dates */}
                <div className="flex items-center gap-4 text-[12px] font-sans" style={{ color: metaClr }}>
                    <span>Inicio: {new Date(reto.fecha_inicio + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short' })}</span>
                    <span>·</span>
                    <span>Fin: {new Date(reto.fecha_fin + 'T12:00:00').toLocaleDateString('es', { day: 'numeric', month: 'short' })}</span>
                </div>
            </div>

            {/* Invitation buttons */}
            {isPendiente && (
                <div className="flex flex-col gap-3">
                    {/* XP Proposal for group challenges */}
                    {reto.tipo === 'grupal' && (
                        <div className="flex items-center gap-3 rounded-[14px] p-3" style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: `1px solid ${cardStroke}` }}>
                            <Gift className="size-5 shrink-0" style={{ color: accentColor }} />
                            <div className="flex flex-col gap-1 flex-1">
                                <span className="text-[11px] font-sans font-medium" style={{ color: metaClr }}>Sugerido: +{reto.recompensa_xp || 0} XP</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[12px] font-sans font-semibold whitespace-nowrap" style={{ color: titleClr }}>Tu propuesta:</span>
                                    <input
                                        type="number"
                                        min="0"
                                        value={xpInput}
                                        onChange={e => setXpInput(e.target.value)}
                                        className="flex-1 h-8 rounded-[8px] px-3 text-[14px] font-sans font-bold text-center outline-none"
                                        style={{
                                            backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                            border: `1px solid ${cardStroke}`,
                                            color: titleClr,
                                        }}
                                    />
                                    <span className="text-[12px] font-sans font-bold" style={{ color: accentColor }}>XP</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleRespond(true)}
                            disabled={pending}
                            className="flex-1 h-12 rounded-[14px] font-sans font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-50"
                            style={{ backgroundColor: '#2DDAB0', color: '#080A10' }}
                        >
                            <Check className="size-5" /> Aceptar
                        </button>
                        <button
                            onClick={() => handleRespond(false)}
                            disabled={pending}
                            className="flex-1 h-12 rounded-[14px] font-sans font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform disabled:opacity-50"
                            style={{ backgroundColor: cardBg, border: `1px solid ${cardStroke}`, color: metaClr }}
                        >
                            <X className="size-5" /> Rechazar
                        </button>
                    </div>
                </div>
            )}

            {/* Join Button (for non-participants) */}
            {!yaParticipo && reto.tipo === 'grupal' && (
                <button
                    onClick={handleUnirse}
                    disabled={pending}
                    className="w-full h-12 rounded-[14px] font-sans font-bold text-[15px] active:scale-[0.98] transition-transform disabled:opacity-50"
                    style={{ backgroundColor: '#2DDAB0', color: '#080A10' }}
                >
                    {pending ? 'Uniéndose...' : '🏆 Unirme al reto'}
                </button>
            )}

            {/* Participants Section */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <span className="text-[13px] font-sans font-bold uppercase" style={{ color: metaClr, letterSpacing: 1.5 }}>
                        Participantes
                    </span>
                    <span className="text-[13px] font-sans font-semibold" style={{ color: accentColor }}>{totalAceptados}</span>
                </div>

                {reto.reto_participantes
                    .filter(p => p.estado === 'aceptado')
                    .map((p) => {
                        const name = p.perfiles?.nombre_usuario || 'Usuario'
                        const initials = getInitials(name)
                        const pProgreso = p.progreso || 0
                        const pCompleted = p.completado

                        // Determine avatar and status colours
                        const avatarColor = pCompleted ? '#2DDAB0' : (pProgreso > 0 ? '#2DDAB0' : '#FF6B35')
                        const avatarBg = pCompleted ? 'rgba(45,218,176,0.12)' : (pProgreso > 0 ? 'rgba(45,218,176,0.12)' : 'rgba(255,107,53,0.12)')

                        let statusText = `${pProgreso}/${total} días`
                        let statusColor = metaClr
                        if (pCompleted) {
                            statusText = `${total}/${total} días • ¡Completado! 🎉`
                            statusColor = '#2DDAB0'
                        }

                        return (
                            <div
                                key={p.id}
                                className="flex items-center gap-3 rounded-[16px] p-3"
                                style={{ backgroundColor: cardBg, border: `1px solid ${cardStroke}` }}
                            >
                                {/* Avatar */}
                                <div
                                    className="size-[38px] rounded-full flex items-center justify-center shrink-0"
                                    style={{ backgroundColor: avatarBg }}
                                >
                                    <span className="text-[14px] font-sans font-bold" style={{ color: avatarColor }}>{initials}</span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[14px] font-sans font-semibold truncate" style={{ color: titleClr }}>{name}</p>
                                    <p className="text-[12px] font-sans" style={{ color: statusColor }}>{statusText}</p>
                                </div>

                                {/* Status icon */}
                                {pCompleted ? (
                                    <Trophy className="size-5 shrink-0" style={{ color: '#2DDAB0' }} />
                                ) : pProgreso > 0 ? (
                                    <CircleCheck className="size-5 shrink-0" style={{ color: '#2DDAB0' }} />
                                ) : (
                                    <Timer className="size-5 shrink-0" style={{ color: '#FF6B35' }} />
                                )}
                            </div>
                        )
                    })}
            </div>

            {/* Delete Button — only visible to creator */}
            {isCreator && (
                <div className="mt-2">
                    {!showDeleteConfirm ? (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full h-11 rounded-[14px] font-sans font-bold text-[13px] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
                            style={{ backgroundColor: isDark ? 'rgba(255,59,48,0.1)' : 'rgba(255,59,48,0.08)', color: '#FF3B30' }}
                        >
                            <Trash2 className="size-4" /> Eliminar Reto
                        </button>
                    ) : (
                        <div className="rounded-[14px] p-4 flex flex-col gap-3" style={{ backgroundColor: isDark ? 'rgba(255,59,48,0.08)' : 'rgba(255,59,48,0.05)', border: '1px solid rgba(255,59,48,0.2)' }}>
                            <p className="text-[13px] font-sans font-semibold text-center" style={{ color: '#FF3B30' }}>
                                ¿Estás seguro? Esta acción no se puede deshacer.
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 h-10 rounded-[10px] font-sans font-bold text-[13px] active:scale-[0.97] transition-transform"
                                    style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', color: metaClr }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => {
                                        startTransition(async () => {
                                            const result = await eliminarRetoAction(reto.id)
                                            if (result.error) toast.error(result.error)
                                            else {
                                                toast.success(result.message)
                                                router.push('/challenges')
                                            }
                                        })
                                    }}
                                    disabled={pending}
                                    className="flex-1 h-10 rounded-[10px] font-sans font-bold text-[13px] flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform disabled:opacity-50"
                                    style={{ backgroundColor: '#FF3B30', color: '#FFFFFF' }}
                                >
                                    <Trash2 className="size-4" /> {pending ? 'Eliminando...' : 'Sí, eliminar'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
