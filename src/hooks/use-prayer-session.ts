'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { SectionDuration } from '@/lib/prayer-sections'

// ─── Types ───────────────────────────────────────────────────────────────

type PrayerSessionPhase = 'idle' | 'running' | 'paused' | 'complete'

type PrayerSessionState = {
  phase: PrayerSessionPhase
  currentSectionIndex: number
  totalElapsed: number
  sectionElapsed: number
}

type PrayerSessionActions = {
  start: () => void
  pause: () => number
  resume: () => void
  nextSection: () => void
  prevSection: () => void
}

const LS_KEY = 'quest_prayer_session'
const SYNC_INTERVAL_MS = 30_000

// ─── localStorage ────────────────────────────────────────────────────────

function todayKey(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function readSession(): { elapsed: number; sectionIndex: number } | null {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return null
    const d = JSON.parse(raw)
    if (d.date !== todayKey() || typeof d.elapsed !== 'number' || d.elapsed <= 0) return null
    return { elapsed: d.elapsed, sectionIndex: typeof d.sectionIndex === 'number' ? d.sectionIndex : 0 }
  } catch { return null }
}

function writeSession(elapsed: number, sectionIndex: number): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify({ date: todayKey(), elapsed, sectionIndex })) } catch { /* ignore */ }
}

function clearSession(): void {
  try { localStorage.removeItem(LS_KEY) } catch { /* ignore */ }
}

// ─── Helpers ─────────────────────────────────────────────────────────────

function findSectionIndex(elapsed: number, sections: SectionDuration[]): number {
  for (let i = sections.length - 1; i >= 0; i--) {
    if (elapsed >= sections[i].startOffset) return i
  }
  return 0
}

// ─── Hook ────────────────────────────────────────────────────────────────

/**
 * Manages a guided prayer session: RAF-based timing, section sequencing,
 * pause/resume, localStorage persistence, and 30s periodic sync callback.
 */
export function usePrayerSession(
  totalSeconds: number,
  sections: SectionDuration[],
  initialElapsed: number,
  onSync: (elapsed: number) => void
): [PrayerSessionState, PrayerSessionActions] {
  const restored = typeof window !== 'undefined' ? readSession() : null
  const resolvedElapsed = Math.max(restored?.elapsed ?? 0, initialElapsed)
  const resolvedSection = findSectionIndex(resolvedElapsed, sections)

  const [totalElapsed, setTotalElapsed] = useState(resolvedElapsed)
  const [currentSectionIndex, setCurrentSectionIndex] = useState(resolvedSection)
  const [phase, setPhase] = useState<PrayerSessionPhase>(restored ? 'paused' : 'idle')

  const elapsedRef = useRef(resolvedElapsed)
  const runStartRef = useRef<number | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const phaseRef = useRef<PrayerSessionPhase>(restored ? 'paused' : 'idle')
  const lastSyncRef = useRef(resolvedElapsed)
  const onSyncRef = useRef(onSync)
  onSyncRef.current = onSync

  const currentSection = sections[currentSectionIndex]
  const sectionElapsed = currentSection
    ? Math.min(totalElapsed - currentSection.startOffset, currentSection.seconds)
    : 0

  const now = useCallback((): number => {
    const base = elapsedRef.current
    return runStartRef.current !== null ? base + (Date.now() - runStartRef.current) / 1000 : base
  }, [])

  // ── RAF loop ──
  const loop = useCallback(() => {
    const cur = now()
    elapsedRef.current = cur
    setTotalElapsed(cur)

    const newIdx = findSectionIndex(cur, sections)
    setCurrentSectionIndex((prev) => (prev !== newIdx ? newIdx : prev))

    if (cur - lastSyncRef.current >= SYNC_INTERVAL_MS / 1000) {
      lastSyncRef.current = cur
      onSyncRef.current(cur)
      writeSession(cur, newIdx)
    }

    if (cur >= totalSeconds) {
      elapsedRef.current = totalSeconds
      runStartRef.current = null
      rafIdRef.current = null
      setTotalElapsed(totalSeconds)
      setPhase('complete')
      phaseRef.current = 'complete'
      clearSession()
      onSyncRef.current(totalSeconds)
      return
    }

    rafIdRef.current = requestAnimationFrame(loop)
  }, [now, sections, totalSeconds])

  // ── Actions ──
  const start = useCallback(() => {
    if (phaseRef.current === 'complete') return
    runStartRef.current = Date.now()
    setPhase('running')
    phaseRef.current = 'running'
    rafIdRef.current = requestAnimationFrame(loop)
  }, [loop])

  const pause = useCallback((): number => {
    const cur = now()
    if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current)
    rafIdRef.current = null
    runStartRef.current = null
    elapsedRef.current = cur
    const idx = findSectionIndex(cur, sections)
    setTotalElapsed(cur)
    setCurrentSectionIndex(idx)
    setPhase('paused')
    phaseRef.current = 'paused'
    writeSession(cur, idx)
    return cur
  }, [now, sections])

  const resume = useCallback(() => {
    if (phaseRef.current === 'complete') return
    runStartRef.current = Date.now()
    setPhase('running')
    phaseRef.current = 'running'
    rafIdRef.current = requestAnimationFrame(loop)
  }, [loop])

  const nextSection = useCallback(() => {
    if (phaseRef.current !== 'running' && phaseRef.current !== 'paused') return
    if (currentSectionIndex >= sections.length - 1) return
    const nextIdx = currentSectionIndex + 1
    const nextStart = sections[nextIdx].startOffset
    elapsedRef.current = nextStart
    setCurrentSectionIndex(nextIdx)
    setTotalElapsed(nextStart)
    writeSession(nextStart, nextIdx)
  }, [currentSectionIndex, sections])

  const prevSection = useCallback(() => {
    if (phaseRef.current !== 'running' && phaseRef.current !== 'paused') return
    if (currentSectionIndex <= 0) return
    const prevIdx = currentSectionIndex - 1
    const prevStart = sections[prevIdx].startOffset
    elapsedRef.current = prevStart
    setCurrentSectionIndex(prevIdx)
    setTotalElapsed(prevStart)
    writeSession(prevStart, prevIdx)
  }, [currentSectionIndex, sections])

  useEffect(() => {
    return () => { if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current) }
  }, [])

  const state: PrayerSessionState = {
    phase,
    currentSectionIndex,
    totalElapsed,
    sectionElapsed: Math.max(0, sectionElapsed),
  }

  return [state, { start, pause, resume, nextSection, prevSection }]
}
