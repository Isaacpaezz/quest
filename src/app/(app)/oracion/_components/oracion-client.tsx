'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, Play, Pause, Square } from 'lucide-react'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { actualizarProgresoOracionAction } from '@/app/(app)/home/actions'
import { useKeepAwake } from '@/hooks/use-keep-awake'

// ── Types & Constants ──────────────────────────────────────────────────

type Props = {
    minutosRequeridos: number
    segundosIniciales: number
    capituloId: number
    oracionCompletada: boolean
    bonusMinutos: number
    bonusXp: number
}

type Phase = 'timer' | 'bonus' | 'complete'

const LS_KEY = 'quest_prayer_timer'
const SYNC_MS = 30_000

const VERSES = [
    { text: '«Orad sin cesar.»', ref: '— 1 Tesalonicenses 5:17' },
    { text: '«Velad y orad, para que no entréis en tentación.»', ref: '— Mateo 26:41' },
    { text: '«Clama a mí, y yo te responderé.»', ref: '— Jeremías 33:3' },
    { text: '«Pedid, y se os dará.»', ref: '— Mateo 7:7' },
    { text: '«El Señor está cerca de los que lo invocan.»', ref: '— Salmos 145:18' },
]

// Motivational prompts for bonus phase — rotate during prayer
const BONUS_PROMPTS = [
    { emoji: '🙌', text: 'Toma este momento para alabar a Dios por quién Él es', sub: 'Exprésale tu adoración' },
    { emoji: '🙏', text: 'Ora por las personas que Dios puso en tu corazón', sub: 'Intercede por otros' },
    { emoji: '❤️', text: 'Dale gracias por sus bendiciones de hoy', sub: 'Cultiva un corazón agradecido' },
    { emoji: '🕊️', text: 'Pídele dirección para tus decisiones', sub: 'Busca su voluntad' },
    { emoji: '🔥', text: 'Adora al Señor con todo tu ser', sub: 'Él es digno de toda honra' },
    { emoji: '💪', text: 'Presenta tus peticiones con confianza', sub: 'Él escucha cada palabra' },
    { emoji: '🌅', text: 'Medita en su fidelidad a lo largo de tu vida', sub: 'Su amor es eterno' },
    { emoji: '✨', text: 'Pide la llenura del Espíritu Santo', sub: 'Deja que Él te guíe hoy' },
]

// Daily motivational messages shown after bonus is completed
const DAILY_MESSAGES = [
    '«Cada minuto en su presencia transforma tu carácter.»',
    '«La oración no cambia a Dios — te cambia a ti.»',
    '«Hoy fuiste más allá de lo mínimo. Dios lo nota.»',
    '«Los que esperan en el Señor renovarán sus fuerzas.» — Isaías 40:31',
    '«Tu fidelidad en lo secreto trae recompensa visible.»',
    '«Cada segundo extra fue una semilla sembrada en el Espíritu.»',
    '«La intimidad con Dios es el mayor tesoro que puedes encontrar.»',
    '«Hoy decidiste quedarte más tiempo. Eso habla de tu hambre espiritual.»',
    '«Bienaventurados los que tienen hambre y sed de justicia.» — Mateo 5:6',
    '«Tu perseverancia en oración fortalece tu fe.»',
    '«El tiempo con Dios nunca es tiempo perdido.»',
    '«Dios se deleita en los que buscan su rostro con todo el corazón.»',
    '«Has elegido la mejor parte, y no te será quitada.» — Lucas 10:42',
    '«Orar más allá de lo necesario es el lenguaje del amor.»',
    '«Tu disciplina espiritual inspira a los que te rodean.»',
    '«Dios honra a los que le honran.» — 1 Samuel 2:30',
    '«Esta oración extendida dejó una marca en el cielo.»',
    '«Los guerreros de oración cambian naciones desde sus rodillas.»',
    '«Hoy cultivaste un hábito que perdurará para siempre.»',
    '«La oración constante es la respiración del alma.»',
    '«Cada minuto extra fue una declaración de fe.»',
    '«El Señor pelea por ti mientras tú estás en su presencia.» — Éxodo 14:14',
    '«Tu dedicación hoy cuenta para la eternidad.»',
    '«Más cerca de Dios, más fuerte tu espíritu.»',
    '«Has decidido priorizar lo eterno sobre lo temporal.»',
    '«La oración es el arma más poderosa que tienes.»',
    '«Dios anhela este tiempo contigo tanto como tú con Él.»',
    '«Hoy plantaste una semilla que dará fruto en su tiempo.»',
    '«Tu constancia muestra que tu fe es genuina.»',
    '«Los héroes de la fe oraban más de lo esperado.»',
    '«Cada día que oras de más, tu relación con Dios crece.»',
]

const fmt = (s: number) => {
    const t = Math.max(0, Math.floor(s))
    return `${Math.floor(t / 60).toString().padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`
}

// Daily message: picks based on day of year so it changes daily
function getDailyMessage(): string {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 0)
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000)
    return DAILY_MESSAGES[dayOfYear % DAILY_MESSAGES.length]
}

// ── localStorage ───────────────────────────────────────────────────────

function lsRead(): number | null {
    try {
        const raw = localStorage.getItem(LS_KEY)
        if (!raw) return null
        const d = JSON.parse(raw)
        if (typeof d.elapsed === 'number' && d.elapsed > 0) return d.elapsed
    } catch { /* ignore */ }
    return null
}
function lsWrite(elapsed: number) {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ elapsed })) } catch { /* ignore */ }
}
function lsClear() {
    try { localStorage.removeItem(LS_KEY) } catch { /* ignore */ }
}

// ── Wake Lock (via useKeepAwake hook) ──────────────────────────────────

// ── Compute initial seconds (localStorage wins over server prop) ──────

function getInitialElapsed(serverSeconds: number): number {
    if (typeof window === 'undefined') return serverSeconds
    const saved = lsRead()
    if (saved !== null && saved > serverSeconds) return saved
    return serverSeconds
}

// ── Component ──────────────────────────────────────────────────────────

export function OracionClient({
    minutosRequeridos,
    segundosIniciales,
    capituloId,
    oracionCompletada,
    bonusMinutos,
    bonusXp,
}: Props) {
    const router = useRouter()
    const baseSecs = Math.max(0, minutosRequeridos * 60)
    const bonusSecs = Math.max(0, bonusMinutos * 60)
    // If base >= bonus, bonus is already earned at completion
    const bonusReachable = bonusSecs > baseSecs

    // Compute initial elapsed ONCE
    const initialElapsed = useRef(getInitialElapsed(segundosIniciales)).current

    // Determine initial phase
    const getInitialPhase = (): Phase => {
        if (oracionCompletada && initialElapsed >= bonusSecs) return 'complete'
        if (oracionCompletada || initialElapsed >= baseSecs) return 'bonus'
        return 'timer'
    }

    // ── State ──
    const [elapsed, setElapsed] = useState(initialElapsed)
    const [isRunning, setIsRunning] = useState(false)
    const [phase, setPhase] = useState<Phase>(getInitialPhase)
    const [saving, setSaving] = useState(false)
    const [pauseCount, setPauseCount] = useState(0)
    const [bonusPromptIdx, setBonusPromptIdx] = useState(0)

    // Refs for animation
    const elapsedRef = useRef(initialElapsed)
    const runStartRef = useRef<number | null>(null)
    const rafId = useRef<number | null>(null)
    const phaseRef = useRef(getInitialPhase())
    const baseSavedRef = useRef(oracionCompletada) // tracks if base oración was already saved

    // Keep screen awake while timer is running (Capacitor native + Web fallback)
    useKeepAwake(isRunning && phase !== 'complete')

    const [verse] = useState(() => VERSES[Math.floor(Math.random() * VERSES.length)])

    // Rotate bonus prompts every 20 seconds
    useEffect(() => {
        if (phase !== 'bonus' || !isRunning) return
        const id = setInterval(() => {
            setBonusPromptIdx(prev => (prev + 1) % BONUS_PROMPTS.length)
        }, 20_000)
        return () => clearInterval(id)
    }, [phase, isRunning])

    // ── Helper: get current elapsed (running or not) ──
    const now = useCallback((): number => {
        const base = elapsedRef.current
        if (runStartRef.current !== null) {
            return base + (Date.now() - runStartRef.current) / 1000
        }
        return base
    }, [])

    // ── Save to Supabase ──
    const save = useCallback(async (secs: number, done: boolean) => {
        const clamped = Math.floor(secs)
        try {
            const result = await actualizarProgresoOracionAction({
                segundosAcumulados: clamped,
                capituloId,
                oracionCompletada: done,
            })
            return result
        } catch (e) {
            console.error('Save error:', e)
            return null
        }
    }, [capituloId])

    // ── Handle base completion (minimum reached) ──
    const handleBaseCompletion = useCallback(async (currentSecs: number) => {
        if (baseSavedRef.current) return // already saved base
        baseSavedRef.current = true
        phaseRef.current = 'bonus'
        setPhase('bonus')

        // Save as completed
        const result = await save(currentSecs, true)
        const xp = result?.xpGanado ?? 0
        toast.success('¡Oración completada!', {
            description: xp > 0 ? `+${xp} XP 🙏` : '¡Has completado tu tiempo de oración!',
            duration: 4000,
        })

        // If bonus is not reachable (base >= bonusSecs), go straight to complete
        if (!bonusReachable) {
            phaseRef.current = 'complete'
            setPhase('complete')
            setIsRunning(false)
            lsClear()
        }
        // Otherwise: timer keeps running into bonus phase
    }, [save, bonusReachable])

    // ── Handle bonus completion ──
    const handleBonusCompletion = useCallback(async () => {
        rafId.current = null
        runStartRef.current = null
        elapsedRef.current = bonusSecs
        setElapsed(bonusSecs)
        setIsRunning(false)
        phaseRef.current = 'complete'
        setPhase('complete')
        lsClear()

        setSaving(true)
        try {
            await save(bonusSecs, true)
            toast.success(`¡Bonus de oración! +${bonusXp} XP 🔥`, {
                description: 'Tu dedicación extra fue recompensada',
                duration: 5000,
            })
        } finally {
            setSaving(false)
        }
    }, [bonusSecs, bonusXp, save])

    // ── RAF loop ──
    const loop = useCallback(() => {
        const cur = now()
        setElapsed(cur)

        // Check base completion threshold
        if (cur >= baseSecs && !baseSavedRef.current) {
            void handleBaseCompletion(cur)
        }

        // Check bonus completion threshold
        if (bonusReachable && cur >= bonusSecs) {
            void handleBonusCompletion()
            return
        }

        // If bonus not reachable and base is done, stop
        if (!bonusReachable && cur >= baseSecs) {
            return
        }

        rafId.current = requestAnimationFrame(loop)
    }, [now, baseSecs, bonusSecs, bonusReachable, handleBaseCompletion, handleBonusCompletion])

    // ── Start / Pause ──
    const doStart = useCallback(() => {
        if (phase === 'complete') return
        runStartRef.current = Date.now()
        setIsRunning(true)
        rafId.current = requestAnimationFrame(loop)
    }, [phase, loop])

    const doPause = useCallback((): number => {
        const cur = now()
        if (rafId.current !== null) cancelAnimationFrame(rafId.current)
        rafId.current = null
        runStartRef.current = null
        elapsedRef.current = cur
        setIsRunning(false)
        setElapsed(cur)
        lsWrite(cur)
        return cur
    }, [now])

    // ── Periodic sync every 30s ──
    useEffect(() => {
        if (!isRunning || phase === 'complete') return
        const id = setInterval(() => {
            const cur = now()
            lsWrite(cur)
            void save(cur, baseSavedRef.current)
        }, SYNC_MS)
        return () => clearInterval(id)
    }, [isRunning, phase, now, save])

    // ── Visibility change: auto pause on background ──
    useEffect(() => {
        const handler = () => {
            if (document.hidden && runStartRef.current !== null && phase !== 'complete') {
                const frozen = doPause()
                setPauseCount(p => p + 1)
                void save(frozen, baseSavedRef.current)
                try {
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('Tu oración está pausada 🙏', {
                            body: `${fmt(frozen)} acumulados · Vuelve a Quest`,
                            tag: 'quest-prayer',
                        })
                    }
                } catch { /* ok */ }
            }
        }
        document.addEventListener('visibilitychange', handler)
        return () => document.removeEventListener('visibilitychange', handler)
    }, [phase, doPause, save])

    // ── Request notification permission ──
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            void Notification.requestPermission()
        }
    }, [])

    // ── Cleanup ──
    useEffect(() => {
        return () => {
            if (rafId.current !== null) cancelAnimationFrame(rafId.current)
        }
    }, [])

    // ── Handlers ──

    const handlePlayPause = async () => {
        if (isRunning) {
            const frozen = doPause()
            setPauseCount(p => p + 1)
            setSaving(true)
            await save(frozen, baseSavedRef.current)
            setSaving(false)
            toast.info('Progreso guardado', { description: `${fmt(frozen)} acumulados` })
        } else {
            doStart()
        }
    }

    const handleStop = async () => {
        const frozen = doPause()
        setSaving(true)
        await save(frozen, baseSavedRef.current)
        setSaving(false)
        lsClear()
        router.push('/home')
    }

    const handleClose = async () => {
        if (isRunning) {
            const frozen = doPause()
            setSaving(true)
            await save(frozen, baseSavedRef.current)
            setSaving(false)
        }
        router.push('/home')
    }

    // ── Display calculations ──
    const cur = elapsed
    const isInBonus = phase === 'bonus' || (phase !== 'complete' && cur >= baseSecs)

    // Circle progress: phase 1 = 0→baseSecs, phase bonus = baseSecs→bonusSecs
    let pct: number
    if (isInBonus && bonusReachable) {
        pct = Math.min((cur - baseSecs) / (bonusSecs - baseSecs), 1)
    } else {
        pct = baseSecs > 0 ? Math.min(cur / baseSecs, 1) : 0
    }

    const R = 112
    const C = 2 * Math.PI * R

    const tp = 'hsl(var(--foreground))'
    const ts = 'hsl(var(--muted-foreground))'
    const teal = 'hsl(var(--primary))'
    const gold = '#FFD700'

    // Active accent color — teal for base, gold for bonus
    const activeColor = isInBonus ? gold : teal
    const bonusPrompt = BONUS_PROMPTS[bonusPromptIdx]

    // Display time: show elapsed in phase 1, or bonus countdown in phase 2
    const displayTime = isInBonus && bonusReachable
        ? fmt(Math.max(0, bonusSecs - cur))
        : fmt(Math.min(cur, baseSecs))

    const displayLabel = isInBonus ? 'bonus' : 'minutos'

    return (
        <div
            className="fixed inset-0 z-[60] flex flex-col quest-bg"
        >
            {/* Top Bar */}
            <div className="flex h-[54px] items-center justify-between px-6 pt-[18px] pb-3">
                <button onClick={handleClose} disabled={saving}>
                    <X className="h-6 w-6 text-muted-foreground/50" />
                </button>
                <span className="text-[15px] font-semibold" style={{ color: tp }}>
                    {isInBonus ? '🔥 Tiempo Bonus' : 'Tiempo de Oración'}
                </span>
                <div className="w-6" />
            </div>

            {/* Center */}
            <div className="flex flex-1 flex-col items-center justify-center gap-6">
                {/* Bonus badge */}
                {isInBonus && (
                    <div
                        className="rounded-full px-4 py-1.5 text-[12px] font-bold tracking-wide animate-pulse"
                        style={{
                            background: 'rgba(255,215,0,0.11)',
                            color: gold,
                            border: '1px solid rgba(255,215,0,0.22)',
                        }}
                    >
                        ⭐ +{bonusXp} XP BONUS
                    </div>
                )}

                {/* Circle */}
                <div className="relative flex h-60 w-60 items-center justify-center">
                    <svg className="absolute inset-0 -rotate-90" viewBox="0 0 240 240">
                        <circle cx="120" cy="120" r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                        <circle cx="120" cy="120" r={R} fill="none" stroke={activeColor} strokeWidth="6"
                            strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
                            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                        />
                    </svg>
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-[56px] font-extralight tabular-nums" style={{ color: tp, letterSpacing: 2 }}>
                            {displayTime}
                        </span>
                        <span className="text-sm font-medium" style={{ color: isInBonus ? gold : ts }}>{displayLabel}</span>
                    </div>
                </div>

                {/* Verse / Bonus prompt */}
                {phase === 'bonus' && bonusPrompt ? (
                    <div className="flex flex-col items-center gap-2 px-8 transition-opacity duration-500">
                        <span className="text-3xl">{bonusPrompt.emoji}</span>
                        <p className="text-center text-base font-medium" style={{ color: 'hsl(47 100% 50% / 0.80)' }}>
                            {bonusPrompt.text}
                        </p>
                        <p className="text-center text-[13px]" style={{ color: ts }}>{bonusPrompt.sub}</p>
                    </div>
                ) : phase === 'timer' ? (
                    <div className="flex flex-col items-center gap-2 px-8">
                        <p className="text-center text-base font-medium italic" style={{ color: 'hsl(var(--foreground) / 0.50)' }}>
                            {verse.text}
                        </p>
                        <p className="text-center text-[13px]" style={{ color: ts }}>{verse.ref}</p>
                    </div>
                ) : null}

                {saving && <p className="text-xs animate-pulse" style={{ color: activeColor }}>Guardando…</p>}

                {/* Completion state — bonus achieved */}
                {phase === 'complete' && bonusReachable && (
                    <div className="mt-2 flex flex-col items-center gap-4 px-6">
                        <div className="rounded-2xl px-6 py-3" style={{ background: 'hsl(47 100% 50% / 0.10)' }}>
                            <span className="text-lg font-semibold" style={{ color: gold }}>✨ ¡Oración bonus completada!</span>
                        </div>
                        {/* Daily motivational message */}
                        <p
                            className="text-center text-[14px] font-medium italic leading-relaxed max-w-[280px]"
                            style={{ color: 'hsl(var(--foreground) / 0.55)' }}
                        >
                            {getDailyMessage()}
                        </p>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[13px]" style={{ color: ts }}>
                                ⏱ {fmt(baseSecs)} oración + {fmt(Math.max(0, elapsed - baseSecs))} bonus
                            </span>
                            {pauseCount > 0 && (
                                <span className="text-[12px]" style={{ color: ts }}>
                                    {pauseCount} pausa{pauseCount > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        <button
                            onClick={() => { lsClear(); router.push('/home') }}
                            disabled={saving}
                            className="mt-1 rounded-xl px-6 py-3 text-sm font-semibold active:scale-95 disabled:opacity-50"
                            style={{ background: gold, color: '#111318' }}
                        >
                            {saving ? 'Guardando…' : 'Volver al inicio'}
                        </button>
                    </div>
                )}

                {/* Base-only completion (when bonus is not reachable) */}
                {phase === 'complete' && !bonusReachable && (
                    <div className="mt-2 flex flex-col items-center gap-3">
                        <div className="rounded-2xl px-6 py-3" style={{ background: 'hsl(var(--primary) / 0.12)' }}>
                            <span className="text-lg font-semibold" style={{ color: teal }}>✓ ¡Oración completada!</span>
                        </div>
                        <button
                            onClick={() => { lsClear(); router.push('/home') }}
                            disabled={saving}
                            className="mt-1 rounded-xl px-6 py-3 text-sm font-semibold active:scale-95 disabled:opacity-50"
                            style={{ background: teal, color: '#111318' }}
                        >
                            {saving ? 'Guardando…' : 'Volver al inicio'}
                        </button>
                    </div>
                )}
            </div>

            {/* Controls */}
            {phase !== 'complete' && (
                <div className="flex items-center justify-center gap-8 px-6 pb-12">
                    <button
                        onClick={handlePlayPause} disabled={saving}
                        className="flex h-[72px] w-[72px] items-center justify-center rounded-full active:scale-90 disabled:opacity-50"
                        style={{ background: activeColor }}
                    >
                        {isRunning
                            ? <Pause className="h-7 w-7" style={{ color: 'hsl(var(--primary-foreground))' }} />
                            : <Play className="h-7 w-7 ml-1" style={{ color: 'hsl(var(--primary-foreground))' }} />
                        }
                    </button>
                    <button
                        onClick={handleStop} disabled={saving}
                        className="flex h-[52px] w-[52px] items-center justify-center rounded-[26px] border active:scale-90 disabled:opacity-50"
                        style={{
                            background: 'hsl(var(--bg-surface) / 0.90)',
                            borderColor: 'hsl(var(--border))',
                        }}
                    >
                        <Square className="h-5 w-5" style={{ color: '#FF6B6B' }} />
                    </button>
                </div>
            )}

            <Toaster richColors />
        </div>
    )
}
