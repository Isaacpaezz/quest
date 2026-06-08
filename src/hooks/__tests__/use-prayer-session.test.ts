import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePrayerSession } from '../use-prayer-session'
import type { SectionDuration } from '@/lib/prayer-sections'

// ── Helpers ──────────────────────────────────────────────────────────────

/** Build 5 sections of equal duration with correct offsets. */
function makeSections(totalSeconds: number): SectionDuration[] {
  const keys = ['adoracion', 'confesion', 'gratitud', 'suplica', 'intercesion'] as const
  const per = Math.floor(totalSeconds / 5)
  let offset = 0
  return keys.map((key, i) => {
    const seconds = i === 4 ? totalSeconds - offset : per
    const section: SectionDuration = { key, label: key, seconds, startOffset: offset }
    offset += seconds
    return section
  })
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('usePrayerSession', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // jsdom provides requestAnimationFrame as setTimeout(cb, 0)
    // Ensure it exists
    if (!globalThis.requestAnimationFrame) {
      globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(cb, 0) as unknown as number
    }
    if (!globalThis.cancelAnimationFrame) {
      globalThis.cancelAnimationFrame = (id: number) => clearTimeout(id)
    }
    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts in idle phase', () => {
    const onSync = vi.fn()
    const { result } = renderHook(() =>
      usePrayerSession(60, makeSections(60), 0, onSync)
    )
    const [state] = result.current
    expect(state.phase).toBe('idle')
    expect(state.totalElapsed).toBe(0)
    expect(state.currentSectionIndex).toBe(0)
  })

  it('advances elapsed linearly when running — not accelerated', () => {
    const onSync = vi.fn()
    const { result } = renderHook(() =>
      usePrayerSession(60, makeSections(60), 0, onSync)
    )

    // Start
    act(() => {
      result.current[1].start()
    })
    expect(result.current[0].phase).toBe('running')

    // Advance 3 seconds (3 x RAF frames)
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    const elapsed = result.current[0].totalElapsed
    // Should be approximately 3 seconds (±0.5s tolerance for RAF jitter)
    expect(elapsed).toBeGreaterThanOrEqual(2.5)
    expect(elapsed).toBeLessThanOrEqual(3.5)
  })

  it('does not accelerate after multiple RAF frames', () => {
    const onSync = vi.fn()
    const { result } = renderHook(() =>
      usePrayerSession(120, makeSections(120), 0, onSync)
    )

    act(() => result.current[1].start())

    // Advance 5 seconds
    act(() => vi.advanceTimersByTime(5000))
    const after5 = result.current[0].totalElapsed

    // Advance 5 more seconds
    act(() => vi.advanceTimersByTime(5000))
    const after10 = result.current[0].totalElapsed

    // The delta should be ~5s, not ~10s+ (which would happen with the old bug)
    const delta = after10 - after5
    expect(delta).toBeGreaterThanOrEqual(4.5)
    expect(delta).toBeLessThanOrEqual(5.5)

    // Total should be ~10s
    expect(after10).toBeGreaterThanOrEqual(9)
    expect(after10).toBeLessThanOrEqual(11)
  })

  it('pause freezes elapsed and resume continues from there', () => {
    const onSync = vi.fn()
    const { result } = renderHook(() =>
      usePrayerSession(60, makeSections(60), 0, onSync)
    )

    act(() => result.current[1].start())
    act(() => vi.advanceTimersByTime(3000))

    // Pause
    act(() => {
      const frozen = result.current[1].pause()
      expect(frozen).toBeGreaterThanOrEqual(2.5)
      expect(frozen).toBeLessThanOrEqual(3.5)
    })
    expect(result.current[0].phase).toBe('paused')
    const pausedElapsed = result.current[0].totalElapsed

    // Wait 2 seconds while paused — should not advance
    act(() => vi.advanceTimersByTime(2000))
    expect(result.current[0].totalElapsed).toBe(pausedElapsed)

    // Resume
    act(() => result.current[1].resume())
    act(() => vi.advanceTimersByTime(2000))

    const resumedElapsed = result.current[0].totalElapsed
    // Should be pausedElapsed + ~2s
    expect(resumedElapsed).toBeGreaterThanOrEqual(pausedElapsed + 1.5)
    expect(resumedElapsed).toBeLessThanOrEqual(pausedElapsed + 2.5)
  })

  it('nextSection while running resets run anchor correctly', () => {
    const onSync = vi.fn()
    const sections = makeSections(100) // 20s each
    const { result } = renderHook(() =>
      usePrayerSession(100, sections, 0, onSync)
    )

    act(() => result.current[1].start())
    // Advance to ~3s into the first section
    act(() => vi.advanceTimersByTime(3000))

    // Navigate to next section
    act(() => result.current[1].nextSection())
    expect(result.current[0].currentSectionIndex).toBe(1)

    const beforeAdvance = result.current[0].totalElapsed
    // Should be at section 1 start (20s)
    expect(beforeAdvance).toBeGreaterThanOrEqual(19.5)
    expect(beforeAdvance).toBeLessThanOrEqual(20.5)

    // Advance 2 more seconds — should NOT add old wall time
    act(() => vi.advanceTimersByTime(2000))
    const after = result.current[0].totalElapsed

    // Should be ~22s (20 + 2), not 20 + 3 + 2 = 25 (the old bug)
    expect(after).toBeGreaterThanOrEqual(21.5)
    expect(after).toBeLessThanOrEqual(22.5)
  })

  it('prevSection while running resets run anchor correctly', () => {
    const onSync = vi.fn()
    const sections = makeSections(100)
    const { result } = renderHook(() =>
      usePrayerSession(100, sections, 0, onSync)
    )

    act(() => result.current[1].start())
    // Advance past first section into second (~25s)
    act(() => vi.advanceTimersByTime(25000))

    // Navigate to next (section 2 at 40s)
    act(() => result.current[1].nextSection())
    // Navigate back to section 1 (at 20s)
    act(() => result.current[1].prevSection())

    expect(result.current[0].currentSectionIndex).toBe(1)
    const afterPrev = result.current[0].totalElapsed
    expect(afterPrev).toBeGreaterThanOrEqual(19.5)
    expect(afterPrev).toBeLessThanOrEqual(20.5)

    // Advance 1 second — should be ~21s, not 21 + old wall time
    act(() => vi.advanceTimersByTime(1000))
    const final = result.current[0].totalElapsed
    expect(final).toBeGreaterThanOrEqual(20.5)
    expect(final).toBeLessThanOrEqual(21.5)
  })

  it('completes when elapsed reaches totalSeconds', () => {
    const onSync = vi.fn()
    const { result } = renderHook(() =>
      usePrayerSession(5, makeSections(5), 0, onSync)
    )

    act(() => result.current[1].start())
    act(() => vi.advanceTimersByTime(6000))

    expect(result.current[0].phase).toBe('complete')
    expect(result.current[0].totalElapsed).toBe(5)
  })
})
