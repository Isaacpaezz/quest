'use client'

import { useEffect, useRef } from 'react'

/**
 * Keeps the screen awake while `active` is true.
 * Uses Capacitor KeepAwake on native, navigator.wakeLock on web.
 * Falls back gracefully if neither is available.
 */
export function useKeepAwake(active: boolean): void {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const isNativeRef = useRef<boolean>(false)

  useEffect(() => {
    if (!active) return

    let cancelled = false

    async function acquire() {
      // Try Capacitor native first
      try {
        const { Capacitor } = await import('@capacitor/core')
        if (Capacitor.isNativePlatform()) {
          const { KeepAwake } = await import('@capacitor-community/keep-awake')
          await KeepAwake.keepAwake()
          if (!cancelled) {
            isNativeRef.current = true
          }
          return
        }
      } catch {
        // Capacitor or plugin not available, fall through to web API
      }

      // Web fallback: Wake Lock API
      try {
        if ('wakeLock' in navigator) {
          const sentinel = await navigator.wakeLock.request('screen')
          if (!cancelled) {
            wakeLockRef.current = sentinel
          } else {
            await sentinel.release()
          }
        }
      } catch {
        // Wake Lock not supported — graceful degradation
      }
    }

    void acquire()

    return () => {
      cancelled = true
      // Release native
      if (isNativeRef.current) {
        import('@capacitor-community/keep-awake')
          .then(({ KeepAwake }) => KeepAwake.allowSleep())
          .catch(() => { /* ok */ })
        isNativeRef.current = false
      }
      // Release web wake lock
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => { /* ok */ })
        wakeLockRef.current = null
      }
    }
  }, [active])
}
