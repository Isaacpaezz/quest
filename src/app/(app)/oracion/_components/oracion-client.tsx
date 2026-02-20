'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { X, Play, Pause, Square } from 'lucide-react'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { actualizarProgresoOracionAction } from '@/app/(app)/home/actions'

// ── Types & Constants ──────────────────────────────────────────────────

type Props = {
    minutosRequeridos: number
    segundosIniciales: number
    capituloId: number
    oracionCompletada: boolean
}

const LS_KEY = 'quest_prayer_timer'
const SYNC_MS = 30_000

const VERSES = [
    { text: '«Orad sin cesar.»', ref: '— 1 Tesalonicenses 5:17' },
    { text: '«Velad y orad, para que no entréis en tentación.»', ref: '— Mateo 26:41' },
    { text: '«Clama a mí, y yo te responderé.»', ref: '— Jeremías 33:3' },
    { text: '«Pedid, y se os dará.»', ref: '— Mateo 7:7' },
    { text: '«El Señor está cerca de los que lo invocan.»', ref: '— Salmos 145:18' },
]

const fmt = (s: number) => {
    const t = Math.max(0, Math.floor(s))
    return `${Math.floor(t / 60).toString().padStart(2, '0')}:${(t % 60).toString().padStart(2, '0')}`
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

// ── Wake Lock ──────────────────────────────────────────────────────────

let _wake: WakeLockSentinel | null = null
async function wakeOn() {
    try { if ('wakeLock' in navigator) _wake = await navigator.wakeLock.request('screen') } catch { /* ok */ }
}
async function wakeOff() {
    try { await _wake?.release() } catch { /* ok */ }
    _wake = null
}

// ── Compute initial seconds (localStorage wins over server prop) ──────

function getInitialElapsed(serverSeconds: number): number {
    if (typeof window === 'undefined') return serverSeconds
    const saved = lsRead()
    if (saved !== null && saved > serverSeconds) return saved
    return serverSeconds
}

// ── Component ──────────────────────────────────────────────────────────

export function OracionClient({ minutosRequeridos, segundosIniciales, capituloId, oracionCompletada }: Props) {
    const router = useRouter()
    const { resolvedTheme } = useTheme()
    const isDark = resolvedTheme === 'dark'
    const totalSecs = Math.max(0, minutosRequeridos * 60)

    // Compute initial elapsed ONCE
    const initialElapsed = useRef(getInitialElapsed(segundosIniciales)).current

    // ── State ──
    const [elapsed, setElapsed] = useState(initialElapsed)
    const [isRunning, setIsRunning] = useState(false)
    const [isComplete, setIsComplete] = useState(oracionCompletada)
    const [saving, setSaving] = useState(false)
    const [pauseCount, setPauseCount] = useState(0)

    // Refs for animation
    const elapsedRef = useRef(initialElapsed) // tracks accumulated seconds when paused
    const runStartRef = useRef<number | null>(null) // Date.now() when current run started
    const rafId = useRef<number | null>(null)

    const [verse] = useState(() => VERSES[Math.floor(Math.random() * VERSES.length)])

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
        const clamped = Math.min(Math.floor(secs), totalSecs)
        try {
            const result = await actualizarProgresoOracionAction({
                segundosAcumulados: clamped,
                capituloId,
                oracionCompletada: done,
            })
            if (done) {
                const xp = result?.xpGanado ?? 0
                toast.success('¡Oración completada!', {
                    description: xp > 0 ? `+${xp} XP 🙏` : '¡Has completado tu tiempo de oración!',
                })
            }
        } catch (e) {
            console.error('Save error:', e)
        }
    }, [capituloId, totalSecs])

    // ── Handle completion (async, awaits save) ──
    const handleCompletion = useCallback(async () => {
        rafId.current = null
        runStartRef.current = null
        elapsedRef.current = totalSecs
        setElapsed(totalSecs)
        setIsRunning(false)
        setIsComplete(true)
        setSaving(true)
        lsClear()
        void wakeOff()
        try {
            await save(totalSecs, true)
        } finally {
            setSaving(false)
        }
    }, [totalSecs, save])

    // ── RAF loop ──
    const loop = useCallback(() => {
        const cur = Math.min(now(), totalSecs)
        setElapsed(cur)

        if (cur >= totalSecs) {
            // DONE — delegate to async handler
            void handleCompletion()
            return
        }

        rafId.current = requestAnimationFrame(loop)
    }, [now, totalSecs, handleCompletion])

    // ── Start / Pause ──
    const doStart = useCallback(() => {
        if (isComplete) return
        runStartRef.current = Date.now()
        setIsRunning(true)
        rafId.current = requestAnimationFrame(loop)
        void wakeOn()
    }, [isComplete, loop])

    const doPause = useCallback((): number => {
        // Freeze current time
        const cur = Math.min(now(), totalSecs)
        if (rafId.current !== null) cancelAnimationFrame(rafId.current)
        rafId.current = null
        runStartRef.current = null
        elapsedRef.current = cur
        setIsRunning(false)
        setElapsed(cur)
        lsWrite(cur)
        void wakeOff()
        return cur
    }, [now, totalSecs])

    // ── Periodic sync every 30s ──
    useEffect(() => {
        if (!isRunning || isComplete) return
        const id = setInterval(() => {
            const cur = Math.min(now(), totalSecs)
            lsWrite(cur)
            void save(cur, false)
        }, SYNC_MS)
        return () => clearInterval(id)
    }, [isRunning, isComplete, now, totalSecs, save])

    // ── Visibility change: auto pause on background ──
    useEffect(() => {
        const handler = () => {
            if (document.hidden && runStartRef.current !== null && !isComplete) {
                const frozen = doPause()
                setPauseCount(p => p + 1)
                void save(frozen, false)
                // Web notification
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
    }, [isComplete, doPause, save])

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
            void wakeOff()
        }
    }, [])

    // ── Handlers ──

    const handlePlayPause = async () => {
        if (isRunning) {
            const frozen = doPause()
            setPauseCount(p => p + 1)
            setSaving(true)
            await save(frozen, false)
            setSaving(false)
            toast.info('Progreso guardado', { description: `${fmt(frozen)} acumulados` })
        } else {
            doStart()
        }
    }

    const handleStop = async () => {
        const frozen = doPause()
        setSaving(true)
        await save(frozen, false)
        setSaving(false)
        lsClear()
        router.push('/home')
    }

    const handleClose = async () => {
        if (isRunning) {
            const frozen = doPause()
            setSaving(true)
            await save(frozen, false)
            setSaving(false)
        }
        // Keep localStorage for persistence on return
        router.push('/home')
    }

    // ── Display ──
    const cur = Math.min(elapsed, totalSecs)
    const pct = totalSecs > 0 ? cur / totalSecs : 0
    const R = 112
    const C = 2 * Math.PI * R

    const tp = isDark ? '#FFFFFF' : '#111318'
    const ts = isDark ? '#5A6075' : '#8C9099'
    const teal = isDark ? '#2DDAB0' : '#1AAF8B'

    return (
        <div
            className="fixed inset-0 z-[60] flex flex-col"
            style={{
                background: isDark
                    ? 'radial-gradient(ellipse 140% 160% at 50% 35%, #1A1E2A 0%, #10131C 45%, #080A10 100%)'
                    : 'radial-gradient(ellipse 140% 160% at 50% 35%, #FFFFFF 0%, #F5F6F8 45%, #ECEEF2 100%)',
            }}
        >
            {/* Top Bar */}
            <div className="flex h-[54px] items-center justify-between px-6 pt-[18px] pb-3">
                <button onClick={handleClose} disabled={saving}>
                    <X className="h-6 w-6" style={{ color: isDark ? '#FFFFFF50' : '#11131850' }} />
                </button>
                <span className="text-[15px] font-semibold" style={{ color: tp }}>Tiempo de Oración</span>
                <div className="w-6" />
            </div>

            {/* Center */}
            <div className="flex flex-1 flex-col items-center justify-center gap-8">
                {/* Circle */}
                <div className="relative flex h-60 w-60 items-center justify-center">
                    <svg className="absolute inset-0 -rotate-90" viewBox="0 0 240 240">
                        <circle cx="120" cy="120" r={R} fill="none" stroke={isDark ? '#1E233060' : '#E8EBF060'} strokeWidth="6" />
                        <circle cx="120" cy="120" r={R} fill="none" stroke={teal} strokeWidth="6"
                            strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
                            style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                        />
                    </svg>
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-[56px] font-extralight tabular-nums" style={{ color: tp, letterSpacing: 2 }}>
                            {fmt(cur)}
                        </span>
                        <span className="text-sm font-medium" style={{ color: ts }}>minutos</span>
                    </div>
                </div>

                {/* Verse */}
                <div className="flex flex-col items-center gap-2 px-8">
                    <p className="text-center text-base font-medium italic" style={{ color: isDark ? '#FFFFFF80' : '#11131880' }}>
                        {verse.text}
                    </p>
                    <p className="text-center text-[13px]" style={{ color: ts }}>{verse.ref}</p>
                </div>

                {saving && <p className="text-xs animate-pulse" style={{ color: teal }}>Guardando…</p>}

                {isComplete && (
                    <div className="mt-4 flex flex-col items-center gap-3">
                        <div className="rounded-2xl px-6 py-3" style={{ background: isDark ? '#2DDAB020' : '#1AAF8B15' }}>
                            <span className="text-lg font-semibold" style={{ color: teal }}>✓ ¡Oración completada!</span>
                        </div>
                        {pauseCount > 0 && (
                            <p className="text-xs" style={{ color: ts }}>
                                {pauseCount} pausa{pauseCount > 1 ? 's' : ''} · {fmt(totalSecs)} de oración
                            </p>
                        )}
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
            {!isComplete && (
                <div className="flex items-center justify-center gap-8 px-6 pb-12">
                    <button
                        onClick={handlePlayPause} disabled={saving}
                        className="flex h-[72px] w-[72px] items-center justify-center rounded-full active:scale-90 disabled:opacity-50"
                        style={{ background: teal }}
                    >
                        {isRunning
                            ? <Pause className="h-7 w-7" style={{ color: isDark ? '#080A10' : '#FFFFFF' }} />
                            : <Play className="h-7 w-7 ml-1" style={{ color: isDark ? '#080A10' : '#FFFFFF' }} />
                        }
                    </button>
                    <button
                        onClick={handleStop} disabled={saving}
                        className="flex h-[52px] w-[52px] items-center justify-center rounded-[26px] border active:scale-90 disabled:opacity-50"
                        style={{
                            background: isDark ? '#1E233070' : '#FFFFFFE8',
                            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
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
