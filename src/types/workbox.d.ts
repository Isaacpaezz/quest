declare module 'workbox-precaching' {
  export function precacheAndRoute(entries?: unknown): void
}

declare global {
  interface ServiceWorkerGlobalScope {
    __WB_MANIFEST?: unknown
  }
}

export {}
