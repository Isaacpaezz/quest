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

describe('GuidedPrayerContainer intercession guide display', () => {
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

  it('does not auto-generate guides on mount and renders fallback guide text', () => {
    renderGuidedPrayer()

    expect(generarOracionesGuiaBatchMock).not.toHaveBeenCalled()
    expect(screen.getByText(/Señor, acompaña a Ana en esta necesidad/)).toBeTruthy()
  })

  it('renders provided guide text without requesting new guides across re-renders', () => {
    const petitionsWithGuide = selectedPetitions.map((petition, index) => ({
      ...petition,
      oracion_guia: index === 0 ? 'Stored guide for Ana.' : null,
    }))

    const { rerender } = renderGuidedPrayer(petitionsWithGuide)

    expect(screen.getByText('Stored guide for Ana.')).toBeTruthy()
    expect(generarOracionesGuiaBatchMock).not.toHaveBeenCalled()

    rerender(
      <GuidedPrayerContainer
        totalSeconds={120}
        sections={intercessionSections}
        initialElapsed={0}
        onSync={vi.fn()}
        onComplete={vi.fn(async () => undefined)}
        peticionesComunidad={petitionsWithGuide}
        onIntercessionBatch={vi.fn(async () => undefined)}
      />
    )

    expect(screen.getByText('Stored guide for Ana.')).toBeTruthy()
    expect(generarOracionesGuiaBatchMock).not.toHaveBeenCalled()
  })

  it('does not read or write completed guide text from sessionStorage', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem')
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

    renderGuidedPrayer()

    expect(screen.getByText(/Señor, acompaña a Ana en esta necesidad/)).toBeTruthy()
    expect(getItemSpy).not.toHaveBeenCalledWith(expect.stringContaining('quest:guided-intercession-guides'))
    expect(setItemSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('quest:guided-intercession-guides'),
      expect.any(String)
    )

    getItemSpy.mockRestore()
    setItemSpy.mockRestore()
  })

  it('does not request guides after remounting with a new selected ID set', () => {
    const { unmount } = renderGuidedPrayer()

    expect(generarOracionesGuiaBatchMock).not.toHaveBeenCalled()

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

    expect(generarOracionesGuiaBatchMock).not.toHaveBeenCalled()
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
