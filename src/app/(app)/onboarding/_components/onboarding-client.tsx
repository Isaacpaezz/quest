'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Users, Plus, LogIn, ArrowRight } from 'lucide-react'
import { unirseAGrupoAction, crearGrupoAction } from '../../grupos/actions'
import { useActionState } from 'react'
import type { ActionState } from '@/types/definitions'

type Step = 'welcome' | 'join' | 'create'

export function OnboardingClient() {
    const router = useRouter()
    const [step, setStep] = useState<Step>('welcome')
    const [isPending, startTransition] = useTransition()

    const [joinState, joinAction] = useActionState(unirseAGrupoAction, {})
    const [createState, createAction] = useActionState(crearGrupoAction, {})

    // ── Design tokens (CSS variables) ──
    const cardBg = 'hsl(var(--bg-surface) / 0.44)'
    const cardStroke = 'hsl(var(--border))'
    const titleClr = 'hsl(var(--foreground))'
    const metaClr = 'hsl(var(--muted-foreground))'
    const accentClr = 'hsl(var(--primary))'
    const inputBg = 'hsl(var(--input))'

    const handleSkip = () => {
        startTransition(() => {
            router.push('/')
        })
    }

    // ── Welcome Step ──
    if (step === 'welcome') {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4">
                <div className="max-w-sm w-full flex flex-col items-center text-center gap-6">
                    {/* Icon */}
                    <div
                        className="size-16 rounded-[20px] flex items-center justify-center"
                        style={{ backgroundColor: 'hsl(var(--primary) / 0.12)' }}
                    >
                        <Users className="size-8" style={{ color: accentClr }} />
                    </div>

                    {/* Title */}
                    <div>
                        <h1 className="text-[24px] font-display font-bold" style={{ color: titleClr }}>
                            ¡Bienvenido a Quest!
                        </h1>
                        <p className="text-[13px] font-sans mt-2" style={{ color: metaClr }}>
                            Quest funciona mejor en comunidad. Únete a un grupo para crecer juntos en tu fe.
                        </p>
                    </div>

                    {/* Options */}
                    <div className="flex flex-col gap-3 w-full">
                        <button
                            onClick={() => setStep('join')}
                            className="flex items-center gap-3 w-full rounded-[20px] p-4 text-left active:scale-[0.98] transition-transform"
                            style={{ backgroundColor: cardBg, border: `1px solid ${cardStroke}` }}
                        >
                            <div
                                className="size-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ backgroundColor: 'hsl(var(--primary) / 0.12)' }}
                    >
                        <LogIn className="size-5" style={{ color: accentClr }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[14px] font-sans font-[600] block" style={{ color: titleClr }}>
                                    Tengo un código de grupo
                                </span>
                                <span className="text-[12px] font-sans" style={{ color: metaClr }}>
                                    Únete a un grupo existente
                                </span>
                            </div>
                            <ArrowRight className="size-4 shrink-0" style={{ color: metaClr }} />
                        </button>

                        <button
                            onClick={() => setStep('create')}
                            className="flex items-center gap-3 w-full rounded-[20px] p-4 text-left active:scale-[0.98] transition-transform"
                            style={{ backgroundColor: cardBg, border: `1px solid ${cardStroke}` }}
                        >
                            <div
                                className="size-10 rounded-full flex items-center justify-center shrink-0"
                                style={{ backgroundColor: 'rgba(255,107,53,0.10)' }}
                            >
                                <Plus className="size-5" style={{ color: '#FF6B35' }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <span className="text-[14px] font-sans font-[600] block" style={{ color: titleClr }}>
                                    Crear un grupo nuevo
                                </span>
                                <span className="text-[12px] font-sans" style={{ color: metaClr }}>
                                    Invita amigos con un código
                                </span>
                            </div>
                            <ArrowRight className="size-4 shrink-0" style={{ color: metaClr }} />
                        </button>
                    </div>

                    {/* Skip */}
                    <button
                        onClick={handleSkip}
                        disabled={isPending}
                        className="text-[12px] font-sans transition-opacity active:opacity-60"
                        style={{ color: metaClr }}
                    >
                        No por ahora, continuar solo →
                    </button>
                </div>
            </div>
        )
    }

    // ── Join Step ──
    if (step === 'join') {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4">
                <div className="max-w-sm w-full flex flex-col gap-5">
                    <button
                        onClick={() => setStep('welcome')}
                        className="text-[12px] font-sans self-start active:opacity-60 transition-opacity"
                        style={{ color: metaClr }}
                    >
                        ← Volver
                    </button>

                    <div>
                        <h2 className="text-[22px] font-display font-bold" style={{ color: titleClr }}>
                            Unirse a un grupo
                        </h2>
                        <p className="text-[13px] font-sans mt-1" style={{ color: metaClr }}>
                            Ingresa el código que te compartieron
                        </p>
                    </div>

                    <form action={async (formData: FormData) => {
                        await joinAction(formData)
                    }} className="flex flex-col gap-4">
                        <input
                            name="codigo"
                            type="text"
                            required
                            placeholder="AbCd1234"
                            autoFocus
                            className="w-full h-14 rounded-[16px] px-4 text-[18px] font-sans font-bold text-center tracking-[4px] outline-none"
                            style={{ backgroundColor: inputBg, border: `1px solid ${cardStroke}`, color: titleClr }}
                        />
                        {joinState.error && (
                            <p className="text-[12px] font-sans text-center" style={{ color: '#FF6B6B' }}>{joinState.error}</p>
                        )}
                        {joinState.success ? (
                            <div className="flex flex-col items-center gap-3">
                                <p className="text-[13px] font-sans" style={{ color: accentClr }}>{joinState.success}</p>
                                <button
                                    type="button"
                                    onClick={() => router.push('/')}
                                    className="h-10 px-6 rounded-[12px] text-[13px] font-sans font-bold active:scale-[0.97] transition-transform"
                                    style={{ backgroundColor: '#2DDAB0', color: '#080A10' }}
                                >
                                    Continuar a Quest →
                                </button>
                            </div>
                        ) : (
                            <button
                                type="submit"
                                className="w-full h-12 rounded-[12px] text-[13px] font-sans font-bold active:scale-[0.97] transition-transform"
                                style={{ backgroundColor: '#2DDAB0', color: '#080A10' }}
                            >
                                Unirse al grupo
                            </button>
                        )}
                    </form>
                </div>
            </div>
        )
    }

    // ── Create Step ──
    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="max-w-sm w-full flex flex-col gap-5">
                <button
                    onClick={() => setStep('welcome')}
                    className="text-[12px] font-sans self-start active:opacity-60 transition-opacity"
                    style={{ color: metaClr }}
                >
                    ← Volver
                </button>

                <div>
                    <h2 className="text-[22px] font-display font-bold" style={{ color: titleClr }}>
                        Crear un grupo
                    </h2>
                    <p className="text-[13px] font-sans mt-1" style={{ color: metaClr }}>
                        Crea tu grupo y comparte el código con tu comunidad
                    </p>
                </div>

                <form action={async (formData: FormData) => {
                    await createAction(formData)
                }} className="flex flex-col gap-4">
                    <div>
                        <label className="text-[11px] font-sans font-bold uppercase tracking-[1px] mb-1 block" style={{ color: metaClr }}>
                            Nombre del grupo
                        </label>
                        <input
                            name="nombre"
                            type="text"
                            required
                            placeholder="Ej: Varones de Fe"
                            autoFocus
                            className="w-full h-11 rounded-[10px] px-3 text-[14px] font-sans outline-none"
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
                            className="w-full rounded-[10px] px-3 py-2.5 text-[14px] font-sans outline-none resize-none"
                            style={{ backgroundColor: inputBg, border: `1px solid ${cardStroke}`, color: titleClr }}
                        />
                    </div>
                    {createState.error && (
                        <p className="text-[12px] font-sans text-center" style={{ color: '#FF6B6B' }}>{createState.error}</p>
                    )}
                    {createState.success ? (
                        <div className="flex flex-col items-center gap-3">
                            <p className="text-[13px] font-sans" style={{ color: accentClr }}>{createState.success}</p>
                            <button
                                type="button"
                                onClick={() => router.push('/')}
                                className="h-10 px-6 rounded-[12px] text-[13px] font-sans font-bold active:scale-[0.97] transition-transform"
                                style={{ backgroundColor: '#2DDAB0', color: '#080A10' }}
                            >
                                Continuar a Quest →
                            </button>
                        </div>
                    ) : (
                        <button
                            type="submit"
                            className="w-full h-12 rounded-[12px] text-[13px] font-sans font-bold active:scale-[0.97] transition-transform"
                            style={{ backgroundColor: '#2DDAB0', color: '#080A10' }}
                        >
                            Crear grupo
                        </button>
                    )}
                </form>
            </div>
        </div>
    )
}
