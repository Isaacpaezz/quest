import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SectionDuration } from '@/lib/prayer-sections'
import { GuidedPrayerContainer } from './guided-prayer-container'

const generarOracionesGuiaBatchMock = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('@/app/(app)/peticiones/actions', () => ({
  generarOracionesGuiaBatch: generarOracionesGuiaBatchMock,
}))

vi.mock('@/hooks/use-keep-awake', () => ({
  useKeepAwake: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  Toaster: () => null,
}))

const intercessionSections: SectionDuration[] = [
  {
    key: 'intercesion',
    label: 'Intercesión comunitaria',
    seconds: 120,
    startOffset: 0,
  },
]

const selectedPetitions = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    titulo: 'Healing for Ana',
    descripcion: 'Ana is recovering from surgery.',
    categoria: 'salud',
    usuario_nombre: 'Ana',
    oraciones_count: 2,
    creado_en: '2026-06-08T10:00:00.000Z',
    actualizado_en: '2026-06-08T10:00:00.000Z',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    titulo: 'Work discernment',
    descripcion: 'A decision is pending.',
    categoria: 'trabajo',
    usuario_nombre: 'Luis',
    oraciones_count: 0,
    creado_en: '2026-06-08T11:00:00.000Z',
    actualizado_en: '2026-06-08T11:00:00.000Z',
  },
]

function createDeferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((promiseResolve) => {
    resolve = promiseResolve
  })

  return { promise, resolve }
}

function renderGuidedPrayer(petitions = selectedPetitions) {
  return render(
    <GuidedPrayerContainer
      totalSeconds={120}
      sections={intercessionSections}
      initialElapsed={0}
      onSync={vi.fn()}
      onComplete={vi.fn(async () => undefined)}
      peticionesComunidad={petitions}
      onIntercessionBatch={vi.fn(async () => undefined)}
    />
  )
}

describe('GuidedPrayerContainer intercession guide generation', () => {
  beforeEach(() => {
    localStorage.clear()
    generarOracionesGuiaBatchMock.mockReset()
    generarOracionesGuiaBatchMock.mockResolvedValue({ success: true, oraciones: {} })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the empty intercession state without requesting AI guides', () => {
    const { container } = renderGuidedPrayer([])

    expect(screen.getByText('No hay peticiones comunitarias en este momento')).toBeTruthy()
    expect(generarOracionesGuiaBatchMock).not.toHaveBeenCalled()
    expect(container.querySelector('.overflow-y-auto')).toBeTruthy()
  })

  it('requests guide generation only for selected petition IDs', async () => {
    generarOracionesGuiaBatchMock.mockResolvedValueOnce({
      success: true,
      oraciones: {
        [selectedPetitions[0].id]: 'Validated guide for Ana.',
        [selectedPetitions[1].id]: 'Validated guide for Luis.',
      },
    })

    renderGuidedPrayer()

    await waitFor(() => {
      expect(generarOracionesGuiaBatchMock).toHaveBeenCalledTimes(1)
    })

    expect(generarOracionesGuiaBatchMock).toHaveBeenCalledWith(selectedPetitions.map(petition => petition.id))
    expect(generarOracionesGuiaBatchMock).not.toHaveBeenCalledWith(
      expect.arrayContaining(['unselected-petition-id'])
    )
  })

  it('renders validated guide text returned by the action and does not repeat calls across re-renders', async () => {
    generarOracionesGuiaBatchMock.mockResolvedValueOnce({
      success: true,
      oraciones: {
        [selectedPetitions[0].id]: 'Validated cached guide for Ana.',
      },
    })

    const { rerender } = renderGuidedPrayer()

    expect(await screen.findByText('Validated cached guide for Ana.')).toBeTruthy()
    expect(generarOracionesGuiaBatchMock).toHaveBeenCalledTimes(1)

    rerender(
      <GuidedPrayerContainer
        totalSeconds={120}
        sections={intercessionSections}
        initialElapsed={0}
        onSync={vi.fn()}
        onComplete={vi.fn(async () => undefined)}
        peticionesComunidad={selectedPetitions}
        onIntercessionBatch={vi.fn(async () => undefined)}
      />
    )

    expect(screen.getByText('Validated cached guide for Ana.')).toBeTruthy()
    expect(generarOracionesGuiaBatchMock).toHaveBeenCalledTimes(1)
  })

  it('requests guides again after a completed request remounts with the same selected IDs', async () => {
    generarOracionesGuiaBatchMock.mockResolvedValueOnce({
      success: true,
      oraciones: {
        [selectedPetitions[0].id]: 'Initial server-validated guide for Ana.',
      },
    }).mockResolvedValueOnce({
      success: true,
      oraciones: {
        [selectedPetitions[0].id]: 'Revalidated guide for Ana after remount.',
      },
    })

    const { unmount } = renderGuidedPrayer()

    expect(await screen.findByText('Initial server-validated guide for Ana.')).toBeTruthy()
    expect(generarOracionesGuiaBatchMock).toHaveBeenCalledTimes(1)

    unmount()
    renderGuidedPrayer(selectedPetitions.map(petition => ({ ...petition })))

    expect(await screen.findByText('Revalidated guide for Ana after remount.')).toBeTruthy()
    expect(generarOracionesGuiaBatchMock).toHaveBeenCalledTimes(2)
  })

  it('reuses an in-flight guide request across remounts and updates the remounted component', async () => {
    const deferred = createDeferred<{
      success: true
      oraciones: Record<string, string>
    }>()
    generarOracionesGuiaBatchMock.mockReturnValueOnce(deferred.promise)

    const { unmount } = renderGuidedPrayer()

    await waitFor(() => {
      expect(generarOracionesGuiaBatchMock).toHaveBeenCalledTimes(1)
    })

    unmount()
    renderGuidedPrayer(selectedPetitions.map(petition => ({ ...petition })))

    expect(generarOracionesGuiaBatchMock).toHaveBeenCalledTimes(1)

    deferred.resolve({
      success: true,
      oraciones: {
        [selectedPetitions[0].id]: 'In-flight guide reused for Ana.',
      },
    })

    expect(await screen.findByText('In-flight guide reused for Ana.')).toBeTruthy()
    expect(generarOracionesGuiaBatchMock).toHaveBeenCalledTimes(1)
  })

  it('does not read or write completed guide text from sessionStorage', async () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem')
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

    generarOracionesGuiaBatchMock.mockResolvedValueOnce({
      success: true,
      oraciones: {
        [selectedPetitions[0].id]: 'Server-only validated guide for Ana.',
      },
    })

    renderGuidedPrayer()

    expect(await screen.findByText('Server-only validated guide for Ana.')).toBeTruthy()
    expect(getItemSpy).not.toHaveBeenCalledWith(expect.stringContaining('quest:guided-intercession-guides'))
    expect(setItemSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('quest:guided-intercession-guides'),
      expect.any(String)
    )

    getItemSpy.mockRestore()
    setItemSpy.mockRestore()
  })

  it('requests guides again when the selected petition fingerprint changes with the same IDs', async () => {
    generarOracionesGuiaBatchMock
      .mockResolvedValueOnce({
        success: true,
        oraciones: {
          [selectedPetitions[0].id]: 'Original guide for Ana.',
        },
      })
      .mockResolvedValueOnce({
        success: true,
        oraciones: {
          [selectedPetitions[0].id]: 'Fresh guide for updated Ana context.',
        },
      })

    const { unmount } = renderGuidedPrayer()

    expect(await screen.findByText('Original guide for Ana.')).toBeTruthy()
    expect(generarOracionesGuiaBatchMock).toHaveBeenCalledTimes(1)

    unmount()
    renderGuidedPrayer([
      {
        ...selectedPetitions[0],
        descripcion: 'Ana is recovering and needs encouragement after a new update.',
        actualizado_en: '2026-06-08T12:00:00.000Z',
      },
      { ...selectedPetitions[1] },
    ])

    await waitFor(() => {
      expect(generarOracionesGuiaBatchMock).toHaveBeenCalledTimes(2)
    })
    expect(await screen.findByText('Fresh guide for updated Ana context.')).toBeTruthy()
  })

  it('requests guides for a new selected ID set after remount', async () => {
    const { unmount } = renderGuidedPrayer()

    await waitFor(() => {
      expect(generarOracionesGuiaBatchMock).toHaveBeenCalledTimes(1)
    })

    unmount()
    renderGuidedPrayer([
      ...selectedPetitions,
      {
        id: '33333333-3333-4333-8333-333333333333',
        titulo: 'Peace for Marta',
        descripcion: 'Marta needs peace.',
        categoria: 'familia',
        usuario_nombre: 'Marta',
        oraciones_count: 1,
        creado_en: '2026-06-08T12:00:00.000Z',
        actualizado_en: '2026-06-08T12:00:00.000Z',
      },
    ])

    await waitFor(() => {
      expect(generarOracionesGuiaBatchMock).toHaveBeenCalledTimes(2)
    })
  })

  it('does not show the completion summary or clear retry state when completion persistence fails', async () => {
    const onClose = vi.fn()
    const onComplete = vi
      .fn()
      .mockRejectedValueOnce(new Error('Database unavailable'))
      .mockResolvedValueOnce(undefined)

    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => (
      window.setTimeout(() => callback(performance.now()), 1)
    ))
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      window.clearTimeout(id)
    })

    const { unmount } = render(
      <GuidedPrayerContainer
        totalSeconds={0.001}
        sections={[{ ...intercessionSections[0], seconds: 0.001 }]}
        initialElapsed={0}
        onSync={vi.fn()}
        onComplete={onComplete}
        onClose={onClose}
        peticionesComunidad={[]}
        onIntercessionBatch={vi.fn(async () => undefined)}
      />
    )

    fireEvent.click(screen.getByLabelText('Iniciar oración'))

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    expect(screen.queryByText('✨ Oración guiada completada')).toBeNull()
    expect(screen.getByText('No se pudo guardar tu oración')).toBeTruthy()
    expect(localStorage.getItem('quest_prayer_session')).toContain('"elapsed":0.001')

    fireEvent.click(screen.getByLabelText('Cerrar oración'))

    expect(onClose).toHaveBeenCalledWith({ clearSession: false })
    expect(localStorage.getItem('quest_prayer_session')).toContain('"elapsed":0.001')

    unmount()

    render(
      <GuidedPrayerContainer
        totalSeconds={0.001}
        sections={[{ ...intercessionSections[0], seconds: 0.001 }]}
        initialElapsed={0}
        onSync={vi.fn()}
        onComplete={onComplete}
        onClose={onClose}
        peticionesComunidad={[]}
        onIntercessionBatch={vi.fn(async () => undefined)}
      />
    )

    fireEvent.click(screen.getByLabelText('Iniciar oración'))

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledTimes(2)
    })
    expect(await screen.findByText('✨ Oración guiada completada')).toBeTruthy()
    expect(localStorage.getItem('quest_prayer_session')).toBeNull()

    fireEvent.click(screen.getByLabelText('Cerrar oración'))

    expect(onClose).toHaveBeenLastCalledWith({ clearSession: true })
  })
})
