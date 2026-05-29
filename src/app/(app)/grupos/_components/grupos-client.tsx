'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Users, Plus, LogIn, Check, Copy, LogOut,
    Crown, ChevronRight, Loader2, UsersRound, Share2
} from 'lucide-react'
import {
    crearGrupoAction,
    unirseAGrupoAction,
    cambiarGrupoActivoAction,
    salirDeGrupoAction,
} from '../actions'
import { useActionState } from 'react'
import type { ActionState } from '@/types/definitions'

interface Grupo {
    id: string
    nombre: string
    descripcion: string | null
    codigo_invitacion: string | null
    max_miembros: number | null
    creador_id: string | null
    activo: boolean
    miRol: string
    miembrosCount: number
    esActivo: boolean
    created_at: string | null
}

interface GruposClientProps {
    grupos: Grupo[]
    grupoActivoId: string | null
    userId: string
}

export function GruposClient({ grupos, grupoActivoId, userId }: GruposClientProps) {
    const router = useRouter()
    const [showCreate, setShowCreate] = useState(false)
    const [showJoin, setShowJoin] = useState(false)
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const [createState, createAction] = useActionState(crearGrupoAction, {})
    const [joinState, joinAction] = useActionState(unirseAGrupoAction, {})

    // Auto-close forms on success
    useEffect(() => {
        if (createState.success) {
            const t = setTimeout(() => { setShowCreate(false); router.refresh() }, 800)
            return () => clearTimeout(t)
        }
    }, [createState.success, router])

    useEffect(() => {
        if (joinState.success) {
            const t = setTimeout(() => { setShowJoin(false); router.refresh() }, 800)
            return () => clearTimeout(t)
        }
    }, [joinState.success, router])

    // ── Design tokens (CSS variables) ──
    const cardBg = 'hsl(var(--bg-surface) / 0.44)'
    const cardStroke = 'hsl(var(--border))'
    const titleClr = 'hsl(var(--foreground))'
    const metaClr = 'hsl(var(--muted-foreground))'
    const accentClr = 'hsl(var(--primary))'
    const inputBg = 'hsl(var(--input))'
    const sectionLbl = 'hsl(var(--quest-text-secondary))'

    const copyCode = async (code: string, grupoId: string) => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(code)
            } else {
                // Fallback for non-HTTPS / mobile contexts
                const textArea = document.createElement('textarea')
                textArea.value = code
                textArea.style.position = 'fixed'
                textArea.style.opacity = '0'
                document.body.appendChild(textArea)
                textArea.select()
                document.execCommand('copy')
                document.body.removeChild(textArea)
            }
            setCopiedId(grupoId)
            setTimeout(() => setCopiedId(null), 2000)
        } catch {
            // Silent fail
        }
    }

    const shareCode = async (code: string, groupName: string) => {
        const shareText = `¡Únete a mi grupo "${groupName}" en Quest! 🙏\n\nUsa este código para unirte:\n${code}`
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Únete a ${groupName} en Quest`,
                    text: shareText,
                })
            } catch {
                // User cancelled share — silent
            }
        } else {
            // Desktop fallback: copy the full message
            await copyCode(shareText, 'share-fallback')
        }
    }

    const handleSwitch = (grupoId: string) => {
        startTransition(async () => {
            await cambiarGrupoActivoAction(grupoId)
            router.refresh()
        })
    }

    const handleLeave = (grupoId: string) => {
        if (!confirm('¿Estás seguro de que quieres salir de este grupo?')) return
        startTransition(async () => {
            await salirDeGrupoAction(grupoId)
            router.refresh()
        })
    }

    return (
        <div className="flex flex-col gap-6">

            {/* Header */}
            <div>
                <h1 className="text-[22px] font-display font-bold" style={{ color: titleClr }}>
                    Mis Grupos
                </h1>
                <p className="text-[13px] font-sans mt-1" style={{ color: metaClr }}>
                    Gestiona tus grupos y cambia entre ellos
                </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
                <button
                    onClick={() => { setShowCreate(!showCreate); setShowJoin(false) }}
                    className="flex items-center gap-1.5 h-10 px-4 rounded-[12px] text-[13px] font-sans font-bold active:scale-[0.97] transition-transform"
                    style={{ backgroundColor: '#2DDAB0', color: '#080A10' }}
                >
                    <Plus className="size-4" />
                    Crear Grupo
                </button>
                <button
                    onClick={() => { setShowJoin(!showJoin); setShowCreate(false) }}
                    className="flex items-center gap-1.5 h-10 px-4 rounded-[12px] text-[13px] font-sans font-bold active:scale-[0.97] transition-transform"
                    style={{ backgroundColor: inputBg, border: `1px solid ${cardStroke}`, color: titleClr }}
                >
                    <LogIn className="size-4" />
                    Unirse con Código
                </button>
            </div>

            {/* Create form */}
            {showCreate && (
                <form
                    action={createAction}
                    className="rounded-[20px] p-5 flex flex-col gap-4"
                    style={{ backgroundColor: cardBg, border: `1px solid ${cardStroke}` }}
                >
                    <h3 className="text-[17px] font-sans font-bold" style={{ color: titleClr }}>
                        Crear nuevo grupo
                    </h3>
                    <div>
                        <label className="text-[11px] font-sans font-bold uppercase tracking-[1px] mb-1 block" style={{ color: metaClr }}>
                            Nombre del grupo
                        </label>
                        <input
                            name="nombre"
                            type="text"
                            required
                            placeholder="Ej: Varones de Fe"
                            className="w-full h-11 rounded-[10px] px-3 text-[14px] font-sans outline-none transition-colors"
                            style={{ backgroundColor: inputBg, border: `1px solid ${cardStroke}`, color: titleClr }}
                        />
                    </div>
                    <div>
                        <label className="text-[11px] font-sans font-bold uppercase tracking-[1px] mb-1 block" style={{ color: metaClr }}>
                            Descripción (opcional)
                        </label>
                        <textarea
                            name="descripcion"
                            placeholder="Describe el propósito del grupo..."
                            rows={2}
                            className="w-full rounded-[10px] px-3 py-2.5 text-[14px] font-sans outline-none transition-colors resize-none"
                            style={{ backgroundColor: inputBg, border: `1px solid ${cardStroke}`, color: titleClr }}
                        />
                    </div>
                    {createState.error && (
                        <p className="text-[12px] font-sans" style={{ color: '#FF6B6B' }}>{createState.error}</p>
                    )}
                    {createState.success && (
                        <p className="text-[12px] font-sans" style={{ color: accentClr }}>{createState.success}</p>
                    )}
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="flex-1 h-10 rounded-[12px] text-[13px] font-sans font-bold active:scale-[0.97] transition-transform"
                            style={{ backgroundColor: '#2DDAB0', color: '#080A10' }}
                        >
                            Crear Grupo
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowCreate(false)}
                            className="flex-1 h-10 rounded-[12px] text-[13px] font-sans font-bold active:scale-[0.97] transition-transform"
                            style={{ backgroundColor: inputBg, color: metaClr }}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* Join form */}
            {showJoin && (
                <form
                    action={joinAction}
                    className="rounded-[20px] p-5 flex flex-col gap-4"
                    style={{ backgroundColor: cardBg, border: `1px solid ${cardStroke}` }}
                >
                    <h3 className="text-[17px] font-sans font-bold" style={{ color: titleClr }}>
                        Unirse a un grupo
                    </h3>
                    <div>
                        <label className="text-[11px] font-sans font-bold uppercase tracking-[1px] mb-1 block" style={{ color: metaClr }}>
                            Código de invitación
                        </label>
                        <input
                            name="codigo"
                            type="text"
                            required
                            placeholder="Ej: AbCd1234"
                            className="w-full h-11 rounded-[10px] px-3 text-[14px] font-sans font-bold text-center tracking-[3px] outline-none transition-colors"
                            style={{ backgroundColor: inputBg, border: `1px solid ${cardStroke}`, color: titleClr }}
                        />
                    </div>
                    {joinState.error && (
                        <p className="text-[12px] font-sans" style={{ color: '#FF6B6B' }}>{joinState.error}</p>
                    )}
                    {joinState.success && (
                        <p className="text-[12px] font-sans" style={{ color: accentClr }}>{joinState.success}</p>
                    )}
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="flex-1 h-10 rounded-[12px] text-[13px] font-sans font-bold active:scale-[0.97] transition-transform"
                            style={{ backgroundColor: '#2DDAB0', color: '#080A10' }}
                        >
                            Unirse
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowJoin(false)}
                            className="flex-1 h-10 rounded-[12px] text-[13px] font-sans font-bold active:scale-[0.97] transition-transform"
                            style={{ backgroundColor: inputBg, color: metaClr }}
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* Groups list */}
            {grupos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div
                        className="size-14 rounded-2xl flex items-center justify-center mb-3"
                        style={{ backgroundColor: 'hsl(var(--bg-surface) / 0.44)' }}
                    >
                        <UsersRound className="size-7" style={{ color: metaClr }} />
                    </div>
                    <p className="text-[13px] font-sans" style={{ color: titleClr }}>Sin grupos aún.</p>
                    <p className="text-[11px] font-sans mt-1" style={{ color: metaClr }}>Crea un grupo o únete con un código.</p>
                </div>
            ) : (
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-5 h-[2px] rounded-sm" style={{ backgroundColor: '#FF6B35' }} />
                        <span
                            className="text-[11px] font-bold tracking-[2px] font-sans uppercase"
                            style={{ color: sectionLbl }}
                        >
                            MIS GRUPOS
                        </span>
                    </div>
                    <div className="flex flex-col gap-3">
                        {grupos.map(grupo => (
                            <div
                                key={grupo.id}
                                className="rounded-[20px] p-4 flex flex-col gap-3"
                                style={{
                                    backgroundColor: cardBg,
                                    border: grupo.esActivo
                                        ? `2px solid hsl(var(--primary) / 0.40)`
                                        : `1px solid ${cardStroke}`,
                                }}
                            >
                                {/* Top row: badges */}
                                <div className="flex items-center gap-2 flex-wrap">
                                    {grupo.esActivo && (
                                        <span
                                            className="text-[11px] font-sans font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                                            style={{ color: accentClr, backgroundColor: 'hsl(var(--primary) / 0.09)' }}
                                        >
                                            <Check className="size-3" />
                                            Activo
                                        </span>
                                    )}
                                    {grupo.miRol === 'admin' && (
                                        <span
                                            className="text-[11px] font-sans font-bold px-2.5 py-1 rounded-full flex items-center gap-1"
                                            style={{ color: '#FF6B35', backgroundColor: 'rgba(255,107,53,0.09)' }}
                                        >
                                            <Crown className="size-3" />
                                            Admin
                                        </span>
                                    )}
                                </div>

                                {/* Title + description */}
                                <div>
                                    <h3 className="text-[17px] font-sans font-bold truncate" style={{ color: titleClr }}>
                                        {grupo.nombre}
                                    </h3>
                                    {grupo.descripcion && (
                                        <p className="text-[13px] font-sans mt-0.5" style={{ color: metaClr }}>
                                            {grupo.descripcion}
                                        </p>
                                    )}
                                </div>

                                {/* Meta row */}
                                <div className="flex items-center gap-3 flex-wrap">
                                    <div className="flex items-center gap-1 text-[12px] font-sans" style={{ color: metaClr }}>
                                        <Users className="size-3.5" />
                                        {grupo.miembrosCount} miembro{grupo.miembrosCount !== 1 ? 's' : ''}
                                    </div>
                                    {grupo.miRol === 'admin' && grupo.codigo_invitacion && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => copyCode(grupo.codigo_invitacion!, grupo.id)}
                                                className="flex items-center gap-1 text-[12px] font-sans active:scale-95 transition-transform"
                                                style={{ color: copiedId === grupo.id ? accentClr : metaClr }}
                                            >
                                                {copiedId === grupo.id ? (
                                                    <><Check className="size-3.5" /> Copiado</>
                                                ) : (
                                                    <><Copy className="size-3.5" /> {grupo.codigo_invitacion}</>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => shareCode(grupo.codigo_invitacion!, grupo.nombre)}
                                                className="flex items-center gap-1 text-[12px] font-sans active:scale-95 transition-transform"
                                                style={{ color: accentClr }}
                                            >
                                                <Share2 className="size-3.5" /> Invitar
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 mt-1">
                                    {!grupo.esActivo && (
                                        <button
                                            onClick={() => handleSwitch(grupo.id)}
                                            disabled={isPending}
                                            className="flex-1 h-10 rounded-[12px] font-sans font-bold text-[13px] flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform disabled:opacity-50"
                                            style={{ backgroundColor: '#2DDAB0', color: '#080A10' }}
                                        >
                                            {isPending ? <Loader2 className="size-4 animate-spin" /> : <ChevronRight className="size-4" />}
                                            Activar
                                        </button>
                                    )}
                                    {!grupo.esActivo && (
                                        <button
                                            onClick={() => handleLeave(grupo.id)}
                                            disabled={isPending}
                                            className="h-10 px-4 rounded-[12px] font-sans font-bold text-[13px] flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform disabled:opacity-50"
                                            style={{
                                                backgroundColor: 'rgba(255,107,107,0.07)',
                                                color: '#FF6B6B',
                                            }}
                                        >
                                            <LogOut className="size-4" />
                                            Salir
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
