'use client'

import { useState, useEffect } from 'react'
import { cambiarRolAction, eliminarMiembroAction } from '../actions'
import { toast } from 'sonner'
import { Shield, ShieldOff, UserMinus, Crown, ChevronLeft, Flame, DollarSign, Share2, Copy } from 'lucide-react'
import Link from 'next/link'

type Miembro = {
    id: string
    rol: string | null
    xp: number
    nivel: number
    unido_en: string | null
    usuario_id: string | null
    perfiles: { nombre_usuario: string } | null
    racha: number
    deuda: number
}

export function MiembrosClient({
    miembros,
    currentUserId,
    inviteCode,
}: {
    miembros: Miembro[]
    currentUserId: string
    inviteCode: string | null
}) {

    const cardBg = 'hsl(var(--bg-surface) / 0.44)'
    const cardBorder = 'hsl(var(--border))'
    const textPrimary = 'hsl(var(--foreground))'
    const textSecondary = 'hsl(var(--muted-foreground))'
    const accent = 'hsl(var(--primary))'

    const handleRolChange = async (miembroId: string, nuevoRol: string) => {
        const result = await cambiarRolAction(miembroId, nuevoRol)
        if (result.error) toast.error(result.error)
        else if (result.message) toast.success(result.message)
    }

    const handleDelete = async (miembroId: string, nombre: string) => {
        if (!confirm(`¿Estás seguro de eliminar a ${nombre} del grupo?`)) return
        const result = await eliminarMiembroAction(miembroId)
        if (result.error) toast.error(result.error)
        else if (result.message) toast.success(result.message)
    }

    const handleInvite = async () => {
        if (!inviteCode) return
        const url = `${window.location.origin}/join/${inviteCode}`
        const shareData = {
            title: 'Unirse a Quest',
            text: `Únete a mi grupo en Quest con el código: ${inviteCode}`,
            url,
        }
        try {
            if (navigator.share) {
                await navigator.share(shareData)
            } else {
                await navigator.clipboard.writeText(url)
                toast.success('Link copiado al portapapeles')
            }
        } catch {
            // User cancelled
        }
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Back navigation */}
            <div className="flex items-center justify-between">
                <Link href="/admin" className="flex items-center gap-1">
                    <ChevronLeft className="size-4" style={{ color: accent }} />
                    <span className="text-[13px] font-sans" style={{ color: accent }}>Panel Admin</span>
                </Link>

                {inviteCode && (
                    <button
                        onClick={handleInvite}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold font-sans transition-all active:scale-[0.97]"
                        style={{
                            backgroundColor: 'hsl(var(--primary) / 0.10)',
                            border: '1px solid hsl(var(--primary) / 0.18)',
                            color: accent,
                        }}
                    >
                        <Share2 className="size-3.5" />
                        Invitar
                    </button>
                )}
            </div>

            {/* Invite code display */}
            {inviteCode && (
                <div
                    className="flex items-center justify-between p-4 rounded-2xl"
                    style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
                >
                    <div>
                        <span className="text-[11px] font-sans block" style={{ color: textSecondary }}>
                            Código de invitación
                        </span>
                        <span className="text-[16px] font-display font-bold tracking-wide" style={{ color: textPrimary }}>
                            {inviteCode}
                        </span>
                    </div>
                    <button
                        onClick={async () => {
                            await navigator.clipboard.writeText(inviteCode)
                            toast.success('Código copiado')
                        }}
                        className="p-2 rounded-xl transition-all active:scale-[0.95]"
                        style={{
                            backgroundColor: 'hsl(var(--input))',
                        }}
                    >
                        <Copy className="size-4" style={{ color: textSecondary }} />
                    </button>
                </div>
            )}

            {miembros.length === 0 ? (
                <div
                    className="p-8 rounded-3xl text-center"
                    style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
                >
                    <span className="text-[14px] font-sans" style={{ color: textSecondary }}>
                        No hay miembros en el grupo.
                    </span>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {miembros.map((m) => {
                        const isCurrentUser = m.usuario_id === currentUserId
                        const nombre = m.perfiles?.nombre_usuario ?? 'Sin nombre'
                        const isAdmin = m.rol === 'admin'

                        return (
                            <div
                                key={m.id}
                                className="p-4 rounded-[20px]"
                                style={{ backgroundColor: cardBg, border: `1px solid ${cardBorder}` }}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="flex h-10 w-10 items-center justify-center rounded-full shrink-0"
                                            style={{ backgroundColor: 'hsl(var(--muted))' }}
                                        >
                                            <span className="font-display text-sm font-bold" style={{ color: textSecondary }}>
                                                {nombre.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[14px] font-semibold font-sans" style={{ color: textPrimary }}>
                                                    {nombre}
                                                </span>
                                                {isCurrentUser && (
                                                    <span className="text-[11px] font-sans" style={{ color: textSecondary }}>(tú)</span>
                                                )}
                                                {isAdmin && (
                                                    <Crown className="size-3.5" style={{ color: '#F5A623' }} />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-[12px] font-sans" style={{ color: textSecondary }}>
                                                <span>Nv.{m.nivel}</span>
                                                <span>{m.xp} XP</span>
                                            </div>
                                        </div>
                                    </div>

                                    {!isCurrentUser && (
                                        <div className="flex items-center gap-1">
                                            <button
                                                className="p-1.5 rounded-lg"
                                                onClick={() => handleRolChange(m.id, isAdmin ? 'miembro' : 'admin')}
                                                title={isAdmin ? 'Quitar admin' : 'Hacer admin'}
                                            >
                                                {isAdmin ? (
                                                    <ShieldOff className="size-4" style={{ color: '#F5A623' }} />
                                                ) : (
                                                    <Shield className="size-4" style={{ color: textSecondary }} />
                                                )}
                                            </button>
                                            <button
                                                className="p-1.5 rounded-lg"
                                                onClick={() => handleDelete(m.id, nombre)}
                                                title="Eliminar del grupo"
                                            >
                                                <UserMinus className="size-4" style={{ color: '#FF6B6B' }} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Racha & Deuda row */}
                                <div className="flex items-center gap-4 mt-2 ml-[52px]">
                                    <div className="flex items-center gap-1">
                                        <Flame className="size-3" style={{ color: m.racha > 0 ? '#F5A623' : textSecondary }} />
                                        <span className="text-[11px] font-sans" style={{ color: m.racha > 0 ? '#F5A623' : textSecondary }}>
                                            {m.racha}d racha
                                        </span>
                                    </div>
                                    {m.deuda > 0 && (
                                        <div className="flex items-center gap-1">
                                            <DollarSign className="size-3" style={{ color: '#FF6B6B' }} />
                                            <span className="text-[11px] font-semibold font-sans" style={{ color: '#FF6B6B' }}>
                                                ${m.deuda.toFixed(2)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
