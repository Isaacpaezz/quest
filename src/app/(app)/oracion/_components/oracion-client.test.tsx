import type { ComponentProps } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { actualizarProgresoOracionAction } from '@/app/(app)/home/actions'
import { OracionClient } from './oracion-client'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/app/(app)/home/actions', () => ({
  actualizarProgresoOracionAction: vi.fn(),
}))

vi.mock('@/app/(app)/peticiones/actions', () => ({
  generarOracionesGuiaBatch: vi.fn(),
  registrarIntercesionesBatch: vi.fn(),
}))

vi.mock('@/hooks/use-keep-awake', () => ({
  useKeepAwake: vi.fn(),
}))

vi.mock('@/components/ui/sonner', () => ({
  Toaster: () => null,
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}))

vi.mock('./preparacion-oracion', () => ({
  PreparacionOracion: () => null,
}))

vi.mock('./resumen-oracion', () => ({
  ResumenOracion: () => <div>Prayer summary</div>,
}))

vi.mock('./guided-prayer-container', () => ({
  GuidedPrayerContainer: () => null,
}))

const actualizarProgresoOracionActionMock = vi.mocked(actualizarProgresoOracionAction)
const toastMock = vi.mocked(toast)

function renderOracionClient(overrides: Partial<ComponentProps<typeof OracionClient>> = {}) {
  return render(
    <OracionClient
      minutosRequeridos={0.01 / 60}
      segundosIniciales={0}
      capituloId={123}
      oracionCompletada={false}
      bonusMinutos={1 / 60}
      bonusXp={10}
      currentUserId="user-1"
      {...overrides}
    />
  )
}

async function startAndReachBaseCompletion() {
  fireEvent.click(screen.getByLabelText('Iniciar oración'))

  await waitFor(() => {
    expect(actualizarProgresoOracionActionMock).toHaveBeenCalledTimes(1)
  })
}

describe('OracionClient completion persistence', () => {
  beforeEach(() => {
    localStorage.clear()
    actualizarProgresoOracionActionMock.mockReset()
    vi.mocked(toastMock.success).mockReset()
    vi.mocked(toastMock.error).mockReset()
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => (
      window.setTimeout(() => callback(performance.now()), 1)
    ))
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      window.clearTimeout(id)
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('does not show completion success or block retry when the completion save fails', async () => {
    actualizarProgresoOracionActionMock
      .mockResolvedValueOnce({ error: 'Error en la base de datos.' })
      .mockResolvedValueOnce({ message: 'Progreso guardado.', xpGanado: 50 })

    renderOracionClient()

    await startAndReachBaseCompletion()

    expect(toastMock.success).not.toHaveBeenCalledWith('¡Oración completada!', expect.anything())
    expect(toastMock.error).toHaveBeenCalledWith(
      'Error en la base de datos.',
      expect.objectContaining({ description: 'Reintentá en unos segundos.' })
    )
    expect(screen.getByLabelText('Iniciar oración')).toBeTruthy()

    fireEvent.click(screen.getByLabelText('Iniciar oración'))
    await waitFor(() => {
      expect(actualizarProgresoOracionActionMock).toHaveBeenCalledTimes(2)
    })
    expect(toastMock.success).toHaveBeenCalledWith(
      '¡Oración completada!',
      expect.objectContaining({ description: '+50 XP 🙏' })
    )
  })

  it('does not show bonus success or clear local progress when the bonus save fails', async () => {
    actualizarProgresoOracionActionMock
      .mockResolvedValueOnce({ message: 'Progreso guardado.', xpGanado: 50 })
      .mockResolvedValueOnce({ error: 'No se pudo guardar el bonus.' })
      .mockResolvedValueOnce({ message: 'Bonus guardado.', xpGanado: 10 })

    renderOracionClient({ bonusMinutos: 0.02 / 60 })

    fireEvent.click(screen.getByLabelText('Iniciar oración'))

    await waitFor(() => {
      expect(actualizarProgresoOracionActionMock).toHaveBeenCalledTimes(2)
    })

    expect(toastMock.success).not.toHaveBeenCalledWith(
      '¡Bonus de oración! +10 XP 🔥',
      expect.anything()
    )
    expect(toastMock.error).toHaveBeenCalledWith(
      'No se pudo guardar el bonus.',
      expect.objectContaining({ description: 'Reintentá en unos segundos.' })
    )
    const retryState = localStorage.getItem('quest_prayer_timer')
    expect(retryState).not.toBeNull()
    expect(JSON.parse(retryState!).elapsed).toBeLessThan(0.02)
    expect(screen.queryByText('Prayer summary')).toBeNull()
    expect(screen.getByLabelText('Iniciar oración')).toBeTruthy()

    fireEvent.click(screen.getByLabelText('Iniciar oración'))

    await waitFor(() => {
      expect(actualizarProgresoOracionActionMock).toHaveBeenCalledTimes(3)
    })

    expect(toastMock.success).toHaveBeenCalledWith(
      '¡Bonus de oración! +10 XP 🔥',
      expect.objectContaining({ description: 'Tu dedicación extra fue recompensada' })
    )
    expect(localStorage.getItem('quest_prayer_timer')).toBeNull()
    expect(screen.getByText('Prayer summary')).toBeTruthy()
  })

  it('does not restore failed bonus saves as completed after remount or clear retry state on close', async () => {
    actualizarProgresoOracionActionMock
      .mockResolvedValueOnce({ message: 'Progreso guardado.', xpGanado: 50 })
      .mockResolvedValueOnce({ error: 'No se pudo guardar el bonus.' })

    const { unmount } = renderOracionClient({ bonusMinutos: 0.02 / 60 })

    fireEvent.click(screen.getByLabelText('Iniciar oración'))

    await waitFor(() => {
      expect(actualizarProgresoOracionActionMock).toHaveBeenCalledTimes(2)
    })

    const retryState = localStorage.getItem('quest_prayer_timer')
    expect(retryState).not.toBeNull()
    expect(JSON.parse(retryState!).elapsed).toBeLessThan(0.02)

    unmount()

    renderOracionClient({
      segundosIniciales: 0.01,
      oracionCompletada: true,
      bonusMinutos: 0.02 / 60,
    })

    expect(screen.queryByText('Prayer summary')).toBeNull()
    expect(screen.getByLabelText('Iniciar oración')).toBeTruthy()

    fireEvent.click(screen.getByLabelText('Cerrar oración'))

    expect(localStorage.getItem('quest_prayer_timer')).toBe(retryState)
  })
})
