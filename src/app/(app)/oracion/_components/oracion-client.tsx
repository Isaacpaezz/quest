'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { X, Play, Pause, Square } from 'lucide-react'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { actualizarProgresoOracionAction } from '@/app/(app)/home/actions'
import { generarOracionesGuiaBatch, registrarIntercesionesBatch } from '@/app/(app)/peticiones/actions'
import { useKeepAwake } from '@/hooks/use-keep-awake'
import type { SectionDuration } from '@/lib/prayer-sections'
import { PreparacionOracion } from './preparacion-oracion'
import { ResumenOracion } from './resumen-oracion'
import { GuidedPrayerContainer } from './guided-prayer-container'

// ── Types & Constants ──────────────────────────────────────────────────

type PeticionPropia = {
    id: string
    titulo: string
    descripcion: string | null
    categoria: string
    oraciones_count: number
}

type PeticionComunidad = {
    id: string
    titulo: string
    descripcion: string | null
    categoria: string
    usuario_nombre: string
    oraciones_count: number
    oracion_guia: string | null
}

type Props = {
    minutosRequeridos: number
    segundosIniciales: number
    capituloId: number
    oracionCompletada: boolean
    bonusMinutos: number
    bonusXp: number
    currentUserId: string
    // Guided Prayer Flow props
    peticionesPropias?: PeticionPropia[]
    peticionesComunidad?: PeticionComunidad[]
    tieneGrupo?: boolean
    // Guided prayer section durations (from admin config)
    sectionDurations?: SectionDuration[]
}

type Phase = 'timer' | 'bonus' | 'complete'

const LS_KEY = 'quest_prayer_timer'
const GUIDE_KEY = 'quest_prayer_guided_state'
const SYNC_MS = 30_000

// Fallback verses for legacy timer mode (guided prayer sections define their own)
const FALLBACK_VERSES = [
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

const fmt = (s: number) => {
    const t = Math.max(0, Math.floor(s))
    return `${Math.floor(t / 60).toString().padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`
}

// ── localStorage ───────────────────────────────────────────────────────

function todayKey(): string {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function lsRead(): number | null {
    try {
        const raw = localStorage.getItem(LS_KEY)
        if (!raw) return null
        const d = JSON.parse(raw)
        if (d.date !== todayKey()) return null
        if (typeof d.elapsed === 'number' && d.elapsed > 0) return d.elapsed
    } catch { /* ignore */ }
    return null
}
function lsWrite(elapsed: number) {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ date: todayKey(), elapsed })) } catch { /* ignore */ }
}
function lsClear() {
    try { localStorage.removeItem(LS_KEY) } catch { /* ignore */ }
}

type GuidedPrayerState = {
    date: string
    userId: string
    version: number
    selectedPetitionIds: string[]
    prayedPetitionIds: string[]
    generatedPrayers: Record<string, string>
    preparacionShown: boolean
}

const GUIDE_STATE_VERSION = 2

function guideRead(userId: string): GuidedPrayerState | null {
    try {
        if (typeof window === 'undefined') return null
        const raw = localStorage.getItem(GUIDE_KEY)
        if (!raw) return null
        const d = JSON.parse(raw) as Partial<GuidedPrayerState>
        if (d.date !== todayKey()) return null
        if (d.userId !== userId) return null
        if (d.version !== GUIDE_STATE_VERSION) return null
        return {
            date: d.date,
            userId: d.userId,
            version: d.version,
            selectedPetitionIds: Array.isArray(d.selectedPetitionIds) ? d.selectedPetitionIds : [],
            prayedPetitionIds: Array.isArray(d.prayedPetitionIds) ? d.prayedPetitionIds : [],
            generatedPrayers: d.generatedPrayers && typeof d.generatedPrayers === 'object' && !Array.isArray(d.generatedPrayers)
                ? Object.fromEntries(
                    Object.entries(d.generatedPrayers).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
                )
                : {},
            preparacionShown: Boolean(d.preparacionShown),
        }
    } catch { /* ignore */ }
    return null
}

function guideWrite(userId: string, partial: Partial<Omit<GuidedPrayerState, 'date' | 'userId' | 'version'>>) {
    try {
        const current = guideRead(userId)
        localStorage.setItem(GUIDE_KEY, JSON.stringify({
            date: todayKey(),
            userId,
            version: GUIDE_STATE_VERSION,
            selectedPetitionIds: current?.selectedPetitionIds ?? [],
            prayedPetitionIds: current?.prayedPetitionIds ?? [],
            generatedPrayers: current?.generatedPrayers ?? {},
            preparacionShown: current?.preparacionShown ?? false,
            ...partial,
        }))
    } catch { /* ignore */ }
}

function guideClear() {
    try { localStorage.removeItem(GUIDE_KEY) } catch { /* ignore */ }
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
    currentUserId,
    peticionesPropias = [],
    peticionesComunidad = [],
    tieneGrupo = false,
    sectionDurations,
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

    // ── Guided Prayer Flow State ──
    const hasPetitions = peticionesComunidad.length > 0
    const restoredGuide = useRef<GuidedPrayerState | null>(guideRead(currentUserId)).current
    const [showPreparacion, setShowPreparacion] = useState(false)
    const [selectedPetitionIds, setSelectedPetitionIds] = useState<string[]>(restoredGuide?.selectedPetitionIds ?? [])
    const [prayedPetitions, setPrayedPetitions] = useState<Set<string>>(
        () => new Set(restoredGuide?.prayedPetitionIds ?? [])
    )
    const [guidedPrayers, setGuidedPrayers] = useState<Record<string, string>>(restoredGuide?.generatedPrayers ?? {})
    const [intercessionSaved, setIntercessionSaved] = useState(false)
    const preparacionShownRef = useRef(Boolean(restoredGuide?.preparacionShown))
    const generatingGuidedPrayersRef = useRef(false)

    // Selected petitions for bonus phase display
    const selectedPetitions = useMemo(() => {
        if (!selectedPetitionIds.length) return []
        const idSet = new Set(selectedPetitionIds)
        return peticionesComunidad.filter(p => idSet.has(p.id))
    }, [selectedPetitionIds, peticionesComunidad])

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

    const [verse] = useState(() => FALLBACK_VERSES[Math.floor(Math.random() * FALLBACK_VERSES.length)])

    // Rotate guided petitions/prompts every 20 seconds.
    // Selected petitions take priority during the full prayer session,
    // not only during bonus time.
    useEffect(() => {
        if (phase === 'complete' || !isRunning) return
        // If we have selected petitions, rotate through them instead
        if (selectedPetitions.length > 0) {
            const id = setInterval(() => {
                setBonusPromptIdx(prev => (prev + 1) % selectedPetitions.length)
            }, 20_000)
            return () => clearInterval(id)
        }

        if (phase !== 'bonus') return

        // Otherwise, use generic prompts
        const id = setInterval(() => {
            setBonusPromptIdx(prev => (prev + 1) % BONUS_PROMPTS.length)
        }, 20_000)
        return () => clearInterval(id)
    }, [phase, isRunning, selectedPetitions.length])

    // If a same-day prayer session was restored with selected petitions but
    // without generated prayer text (older localStorage state), generate the
    // missing prayers in the background instead of requiring a full restart.
    useEffect(() => {
        if (phase === 'complete') return
        if (selectedPetitions.length === 0) return
        if (generatingGuidedPrayersRef.current) return

        const missingIds = selectedPetitions
            .filter(p => !guidedPrayers[p.id] && !p.oracion_guia)
            .map(p => p.id)

        if (missingIds.length === 0) return

        generatingGuidedPrayersRef.current = true
        const toastId = toast.loading('Preparando oración guía…')

        generarOracionesGuiaBatch(missingIds)
            .then(result => {
                if (result.success) {
                    const returnedIds = missingIds.filter(id => result.oraciones[id])

                    if (returnedIds.length === 0) {
                        toast.error('No se pudo preparar la oración guía', { id: toastId, duration: 3500 })
                        return
                    }

                    setGuidedPrayers(prev => {
                        const next = { ...prev, ...result.oraciones }
                        guideWrite(currentUserId, { generatedPrayers: next })
                        return next
                    })
                    toast.success('Oración guía lista', { id: toastId, duration: 2500 })
                } else {
                    toast.error(result.error || 'No se pudo preparar la oración guía', { id: toastId, duration: 3500 })
                }
            })
            .catch(error => {
                console.error('Error preparing restored guided prayers:', error)
                toast.error('No se pudo preparar la oración guía', { id: toastId, duration: 3500 })
            })
            .finally(() => {
                generatingGuidedPrayersRef.current = false
            })
    }, [currentUserId, phase, selectedPetitions, guidedPrayers])

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

    // ── Save batch intercessions on completion ──
    useEffect(() => {
        if (phase !== 'complete' || intercessionSaved) return
        if (prayedPetitions.size === 0) return

        setIntercessionSaved(true)
        const ids = Array.from(prayedPetitions)

        registrarIntercesionesBatch(ids)
            .then(result => {
                if (result.success) {
                    guideClear()
                }
                if (result.success && result.inserted > 0) {
                    toast.success(
                        `Intercediste por ${result.inserted} ${result.inserted === 1 ? 'petición' : 'peticiones'}`,
                        { description: result.xpGranted > 0 ? `+${result.xpGranted} XP` : undefined, duration: 3000 }
                    )
                }
            })
            .catch(err => {
                console.error('Error saving batch intercessions:', err)
            })
    }, [phase, prayedPetitions, intercessionSaved])

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

    // Handle "Oré" tap during bonus phase
    const handleOreTap = useCallback((peticionId: string) => {
        setPrayedPetitions(prev => {
            const next = new Set(prev)
            next.add(peticionId)
            guideWrite(currentUserId, { prayedPetitionIds: Array.from(next) })
            return next
        })
        toast.success('Oración registrada 🙏', { duration: 1500 })
    }, [currentUserId])

    // Handle pre-timer confirmation
    const handlePreparacionConfirm = useCallback(async (selectedIds: string[]) => {
        setSaving(true)
        const toastId = toast.loading('Preparando oraciones guía…')

        let nextPrayers = guidedPrayers
        if (selectedIds.length > 0) {
            try {
                const result = await generarOracionesGuiaBatch(selectedIds)
                if (result.success) {
                    nextPrayers = { ...guidedPrayers, ...result.oraciones }
                    setGuidedPrayers(nextPrayers)
                    toast.success('Oraciones listas', { id: toastId, duration: 2500 })
                } else {
                    toast.error(result.error || 'No se pudieron preparar las oraciones', { id: toastId, duration: 3500 })
                }
            } catch (error) {
                console.error('Error preparing guided prayers:', error)
                toast.error('No se pudieron preparar las oraciones', { id: toastId, duration: 3500 })
            }
        } else {
            toast.dismiss(toastId)
        }

        setSelectedPetitionIds(selectedIds)
        setShowPreparacion(false)
        preparacionShownRef.current = true
        guideWrite(currentUserId, { selectedPetitionIds: selectedIds, generatedPrayers: nextPrayers, preparacionShown: true })
        setSaving(false)
        // Start the timer after confirming selections
        doStart()
    }, [currentUserId, doStart, guidedPrayers])

    const handlePlayPause = async () => {
        if (isRunning) {
            const frozen = doPause()
            setPauseCount(p => p + 1)
            setSaving(true)
            await save(frozen, baseSavedRef.current)
            setSaving(false)
            toast.info('Progreso guardado', { description: `${fmt(frozen)} acumulados` })
        } else {
            // If we have community petitions and haven't shown preparacion yet, show it
            if (hasPetitions && !preparacionShownRef.current && phase === 'timer' && !baseSavedRef.current) {
                setShowPreparacion(true)
                return
            }
            doStart()
        }
    }

    const handleStop = async () => {
        const frozen = doPause()
        setSaving(true)
        await save(frozen, baseSavedRef.current)
        // Flush pending intercessions before navigating away
        if (prayedPetitions.size > 0 && !intercessionSaved) {
            setIntercessionSaved(true)
            const result = await registrarIntercesionesBatch(Array.from(prayedPetitions))
            if (!result.success) {
                toast.error('No se pudieron guardar tus intercesiones')
            } else {
                guideClear()
            }
        }
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
        // Flush pending intercessions before navigating away
        if (prayedPetitions.size > 0 && !intercessionSaved) {
            setIntercessionSaved(true)
            const result = await registrarIntercesionesBatch(Array.from(prayedPetitions))
            if (!result.success) {
                toast.error('No se pudieron guardar tus intercesiones')
            } else {
                guideClear()
            }
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

    // Prayer content: selected petitions take priority over generic prompts
    const currentPetition = selectedPetitions.length > 0 && phase !== 'complete'
        ? selectedPetitions[bonusPromptIdx % selectedPetitions.length]
        : null
    const currentGuidedPrayer = currentPetition
        ? guidedPrayers[currentPetition.id] || currentPetition.oracion_guia
        : null
    const bonusPrompt = !currentPetition ? BONUS_PROMPTS[bonusPromptIdx] : null

    // Display time: show elapsed in phase 1, or bonus countdown in phase 2
    const displayTime = isInBonus && bonusReachable
        ? fmt(Math.max(0, bonusSecs - cur))
        : fmt(Math.min(cur, baseSecs))

    const displayLabel = isInBonus ? 'bonus' : 'minutos'

    // ── Guided prayer mode: delegate to GuidedPrayerContainer ──
    if (sectionDurations && sectionDurations.length > 0) {
        return (
            <div className="fixed inset-0 z-[60] flex h-dvh flex-col overflow-hidden quest-bg">
                {/* Guided prayer container — close button is inside the focus-trapped region */}
                <div className="flex min-h-0 flex-1 flex-col">
                    <GuidedPrayerContainer
                        totalSeconds={baseSecs}
                        sections={sectionDurations}
                        initialElapsed={segundosIniciales}
                        onSync={(elapsed) => void save(elapsed, baseSavedRef.current)}
                        onComplete={async (totalElapsed) => { await handleBaseCompletion(totalElapsed) }}
                        peticionesPropias={peticionesPropias}
                        peticionesComunidad={peticionesComunidad}
                        onClose={handleClose}
                        closeDisabled={saving}
                        onIntercessionBatch={async (ids) => {
                            if (ids.length === 0) return
                            const result = await registrarIntercesionesBatch(ids)
                            if (result.success) {
                                guideClear()
                            }
                            if (result.success && result.inserted > 0) {
                                toast.success(
                                    `Intercediste por ${result.inserted} ${result.inserted === 1 ? 'petición' : 'peticiones'}`,
                                    { description: result.xpGranted > 0 ? `+${result.xpGranted} XP` : undefined, duration: 3000 }
                                )
                            }
                        }}
                    />
                </div>

                <Toaster richColors />
            </div>
        )
    }

    return (
        <>
            {/* Pre-timer preparation screen */}
            {showPreparacion && (
                <PreparacionOracion
                    peticionesPropias={peticionesPropias}
                    peticionesComunidad={peticionesComunidad}
                    tieneGrupo={tieneGrupo}
                    onConfirm={handlePreparacionConfirm}
                />
            )}

            {/* Main timer UI */}
            <div
                className={`fixed inset-0 z-[60] flex h-dvh flex-col ${phase === 'complete' ? 'overflow-y-auto' : 'overflow-hidden'} quest-bg ${showPreparacion ? 'invisible' : ''}`}
            >
            {/* Top Bar */}
            <div className="flex h-[calc(env(safe-area-inset-top)+48px)] shrink-0 items-end justify-between px-3 pb-1.5 pt-[env(safe-area-inset-top)]">
                <button
                    onClick={handleClose}
                    disabled={saving}
                    className="flex h-11 w-11 items-center justify-center rounded-full active:scale-95 disabled:opacity-50"
                    aria-label="Cerrar oración"
                >
                    <X className="h-6 w-6 text-muted-foreground/50" />
                </button>
                <span className="text-[15px] font-semibold" style={{ color: tp }}>
                    {isInBonus ? '🔥 Tiempo Bonus' : 'Tiempo de Oración'}
                </span>
                <div className="h-11 w-11" />
            </div>

            {/* Center */}
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[clamp(0.35rem,1.3dvh,1.25rem)] px-4 py-1">
                {/* Bonus badge */}
                {isInBonus && (
                    <div
                        className="shrink-0 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide animate-pulse"
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
                <div className="relative flex h-[clamp(8rem,28dvh,15rem)] w-[clamp(8rem,28dvh,15rem)] shrink-0 items-center justify-center">
                    <svg className="absolute inset-0 -rotate-90" viewBox="0 0 240 240">
                        <circle cx="120" cy="120" r={R} fill="none" stroke="hsl(var(--muted))" strokeWidth="6" />
                        <circle cx="120" cy="120" r={R} fill="none" stroke={activeColor} strokeWidth="6"
                            strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
                            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                        />
                    </svg>
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[clamp(2.5rem,7.5dvh,3.5rem)] font-extralight leading-none tabular-nums" style={{ color: tp, letterSpacing: 2 }}>
                            {displayTime}
                        </span>
                        <span className="text-xs font-medium" style={{ color: isInBonus ? gold : ts }}>{displayLabel}</span>
                    </div>
                </div>

                {/* Verse / Bonus prompt / Petition */}
                {phase !== 'complete' && currentPetition ? (
                    <div className="flex min-h-0 w-full max-w-sm flex-col items-center gap-[clamp(0.2rem,0.8dvh,0.75rem)] transition-opacity duration-500">
                        <span className="text-2xl leading-none [@media(max-height:700px)]:hidden">🙏</span>
                        <p className="text-center text-sm font-medium leading-tight" style={{ color: 'hsl(47 100% 50% / 0.80)' }}>
                            Oración por <strong>{currentPetition.usuario_nombre}</strong>
                        </p>
                        <div className="w-full rounded-xl border border-border/50 bg-card/40 px-3 py-1.5 text-center">
                            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: ts }}>
                                Petición
                            </p>
                            <p className="line-clamp-2 text-[13px] font-medium leading-snug" style={{ color: 'hsl(var(--foreground) / 0.78)' }}>
                                {currentPetition.titulo}
                            </p>
                        </div>
                        {currentGuidedPrayer ? (
                            <div className="flex min-h-0 w-full flex-col rounded-2xl border border-yellow-400/25 bg-yellow-400/10 px-3 py-2 text-center shadow-sm">
                                <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ color: gold }}>
                                    Oración guía
                                </p>
                                <p className="max-h-[18dvh] overflow-y-auto overscroll-contain text-[13px] leading-snug [@media(max-height:700px)]:max-h-[14dvh]" style={{ color: 'hsl(var(--foreground) / 0.90)' }}>
                                    {currentGuidedPrayer}
                                </p>
                            </div>
                        ) : currentPetition.descripcion && (
                            <p className="text-center text-[12px] line-clamp-2" style={{ color: ts }}>
                                {currentPetition.descripcion}
                            </p>
                        )}
                        {/* "Oré" button */}
                        <button
                            onClick={() => handleOreTap(currentPetition.id)}
                            disabled={prayedPetitions.has(currentPetition.id)}
                            className="flex min-h-11 items-center gap-2 rounded-xl px-5 py-2 text-sm font-semibold active:scale-95 disabled:opacity-60 transition-all"
                            style={{
                                background: prayedPetitions.has(currentPetition.id)
                                    ? 'hsl(var(--muted))'
                                    : gold,
                                color: prayedPetitions.has(currentPetition.id)
                                    ? 'hsl(var(--muted-foreground))'
                                    : '#111318',
                            }}
                        >
                            {prayedPetitions.has(currentPetition.id) ? (
                                <>✓ Oraste por {currentPetition.usuario_nombre}</>
                            ) : (
                                <>Oré 🙏</>
                            )}
                        </button>
                        {/* Petition counter */}
                        {selectedPetitions.length > 1 && (
                            <p className="text-[11px] text-muted-foreground [@media(max-height:700px)]:hidden">
                                {(bonusPromptIdx % selectedPetitions.length) + 1} de {selectedPetitions.length} peticiones
                            </p>
                        )}
                    </div>
                ) : phase === 'bonus' && bonusPrompt ? (
                    <div className="flex flex-col items-center gap-1.5 px-4 transition-opacity duration-500">
                        <span className="text-2xl leading-none">{bonusPrompt.emoji}</span>
                        <p className="text-center text-sm font-medium leading-tight" style={{ color: 'hsl(47 100% 50% / 0.80)' }}>
                            {bonusPrompt.text}
                        </p>
                        <p className="text-center text-[13px]" style={{ color: ts }}>{bonusPrompt.sub}</p>
                    </div>
                ) : phase === 'timer' ? (
                    <div className="flex flex-col items-center gap-1.5 px-4">
                        <p className="text-center text-sm font-medium italic leading-tight" style={{ color: 'hsl(var(--foreground) / 0.50)' }}>
                            {verse.text}
                        </p>
                        <p className="text-center text-[13px]" style={{ color: ts }}>{verse.ref}</p>
                    </div>
                ) : null}

                {saving && <p className="text-xs animate-pulse" style={{ color: activeColor }}>Guardando…</p>}

                {/* Completion state — bonus achieved */}
                {phase === 'complete' && bonusReachable && (
                    <ResumenOracion
                        baseSecs={baseSecs}
                        bonusSecs={bonusSecs}
                        elapsed={elapsed}
                        bonusReached={true}
                        bonusXp={bonusXp}
                        saving={saving}
                        pauseCount={pauseCount}
                        peticionesRezadas={selectedPetitions.map(p => ({
                            id: p.id,
                            titulo: p.titulo,
                            autorNombre: p.usuario_nombre,
                            fueOrada: prayedPetitions.has(p.id),
                        }))}
                        onVolver={() => { lsClear(); router.push('/home') }}
                    />
                )}

                {/* Base-only completion (when bonus is not reachable) */}
                {phase === 'complete' && !bonusReachable && (
                    <ResumenOracion
                        baseSecs={baseSecs}
                        bonusSecs={bonusSecs}
                        elapsed={elapsed}
                        bonusReached={false}
                        bonusXp={bonusXp}
                        saving={saving}
                        pauseCount={pauseCount}
                        peticionesRezadas={selectedPetitions.map(p => ({
                            id: p.id,
                            titulo: p.titulo,
                            autorNombre: p.usuario_nombre,
                            fueOrada: prayedPetitions.has(p.id),
                        }))}
                        onVolver={() => { lsClear(); router.push('/home') }}
                    />
                )}
            </div>

            {/* Controls */}
            {phase !== 'complete' && (
                <div className="flex shrink-0 items-center justify-center gap-5 px-6 pb-[max(env(safe-area-inset-bottom),1rem)] pt-1">
                    <button
                        onClick={handlePlayPause} disabled={saving}
                        aria-label={isRunning ? 'Pausar oración' : 'Iniciar oración'}
                        className="flex h-16 w-16 items-center justify-center rounded-full active:scale-90 disabled:opacity-50"
                        style={{ background: activeColor }}
                    >
                        {isRunning
                            ? <Pause className="h-7 w-7" style={{ color: 'hsl(var(--primary-foreground))' }} />
                            : <Play className="h-7 w-7 ml-1" style={{ color: 'hsl(var(--primary-foreground))' }} />
                        }
                    </button>
                    <button
                        onClick={handleStop} disabled={saving}
                        aria-label="Detener oración"
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
        </>
    )
}
