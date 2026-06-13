import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IntercessionSection } from './intercession-section'

const toastSuccessMock = vi.hoisted(() => vi.fn())

vi.mock('sonner', () => ({
  toast: {
    success: toastSuccessMock,
  },
}))

const baseProps = {
  sectionElapsed: 0,
  sectionSeconds: 120,
  secondsPerPetition: 60,
  intercededIds: new Set<string>(),
  guideTextByPetitionId: {},
  guideLoadingByPetitionId: {},
  guideErrorByPetitionId: {},
  onIntercede: vi.fn(),
}

const petitions = [
  {
    id: 'petition-1',
    titulo: 'Healing for Ana',
    descripcion: 'Ana is recovering from surgery.',
    categoria: 'salud',
    usuario_nombre: 'Ana',
    oraciones_count: 2,
  },
  {
    id: 'petition-2',
    titulo: 'Work discernment',
    descripcion: 'A decision is pending.',
    categoria: 'trabajo',
    usuario_nombre: 'Luis',
    oraciones_count: 0,
  },
]

describe('IntercessionSection', () => {
  beforeEach(() => {
    toastSuccessMock.mockClear()
  })

  it('shows a calm empty state when no community petitions are available', () => {
    render(<IntercessionSection {...baseProps} petitions={[]} />)

    expect(screen.getByText('No hay peticiones comunitarias en este momento')).toBeTruthy()
    expect(screen.queryByRole('button', { name: /oré/i })).toBeNull()
  })

  it('shows the active petition identity, metadata, prayer content, and guide text', () => {
    render(
      <IntercessionSection
        {...baseProps}
        petitions={petitions}
        guideTextByPetitionId={{ 'petition-1': 'Lord, guide us as we pray for Ana with faith and peace.' }}
      />
    )

    expect(screen.getByText('Petición 1 de 2')).toBeTruthy()
    expect(screen.getByText('Ora por Ana')).toBeTruthy()
    expect(screen.getByText('Healing for Ana')).toBeTruthy()
    expect(screen.getByText('Ana is recovering from surgery.')).toBeTruthy()
    expect(screen.getByText(/Salud/)).toBeTruthy()
    expect(screen.getByText('🙏 2 oraciones')).toBeTruthy()
    expect(screen.getByText('Lord, guide us as we pray for Ana with faith and peace.')).toBeTruthy()
  })

  it('keeps petition description readable without an internal scrollbar', () => {
    render(<IntercessionSection {...baseProps} petitions={petitions} />)

    const description = screen.getByText('Ana is recovering from surgery.')
    expect(description.className).not.toContain('max-h-20')
    expect(description.className).not.toContain('overflow-y-auto')
  })

  it('shows the active petition based on elapsed section time', () => {
    render(
      <IntercessionSection
        {...baseProps}
        sectionElapsed={75}
        petitions={petitions}
        guideTextByPetitionId={{ 'petition-2': 'Lord, guide Luis with wisdom.' }}
      />
    )

    expect(screen.getByText('Petición 2 de 2')).toBeTruthy()
    expect(screen.getByText('Ora por Luis')).toBeTruthy()
    expect(screen.getByText('Work discernment')).toBeTruthy()
    expect(screen.getByText('Lord, guide Luis with wisdom.')).toBeTruthy()
  })

  it('allows manual navigation between petitions', () => {
    render(<IntercessionSection {...baseProps} petitions={petitions} />)

    expect(screen.getByText('Petición 1 de 2')).toBeTruthy()
    expect(screen.getByText('Ora por Ana')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))

    expect(screen.getByText('Petición 2 de 2')).toBeTruthy()
    expect(screen.getByText('Ora por Luis')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /anterior/i }))

    expect(screen.getByText('Petición 1 de 2')).toBeTruthy()
    expect(screen.getByText('Ora por Ana')).toBeTruthy()
  })

  it('keeps manual navigation active when elapsed time would point elsewhere', () => {
    const { rerender } = render(<IntercessionSection {...baseProps} petitions={petitions} />)

    fireEvent.click(screen.getByRole('button', { name: /siguiente/i }))

    rerender(<IntercessionSection {...baseProps} sectionElapsed={0} petitions={petitions} />)

    expect(screen.getByText('Petición 2 de 2')).toBeTruthy()
    expect(screen.getByText('Ora por Luis')).toBeTruthy()
  })

  it('resets the provided scroll container when the active petition changes', () => {
    const scrollContainer = document.createElement('div')
    const scrollTo = vi.fn()
    Object.defineProperty(scrollContainer, 'scrollTo', { value: scrollTo, configurable: true })
    const scrollContainerRef = { current: scrollContainer }

    const { rerender } = render(
      <IntercessionSection
        {...baseProps}
        petitions={petitions}
        scrollContainerRef={scrollContainerRef}
      />
    )

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })
    scrollTo.mockClear()

    rerender(
      <IntercessionSection
        {...baseProps}
        sectionElapsed={10}
        petitions={petitions}
        scrollContainerRef={scrollContainerRef}
      />
    )

    expect(scrollTo).not.toHaveBeenCalled()

    rerender(
      <IntercessionSection
        {...baseProps}
        sectionElapsed={75}
        petitions={petitions}
        scrollContainerRef={scrollContainerRef}
      />
    )

    expect(scrollTo).toHaveBeenCalledTimes(1)
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })
  })

  it('distributes active petition timing across long capped intercession sections', () => {
    const cappedPetitions = Array.from({ length: 6 }, (_, index) => ({
      id: `petition-${index + 1}`,
      titulo: `Petition ${index + 1}`,
      descripcion: null,
      categoria: 'otro',
      usuario_nombre: `Requester ${index + 1}`,
      oraciones_count: 0,
    }))

    render(
      <IntercessionSection
        {...baseProps}
        sectionElapsed={390}
        sectionSeconds={1200}
        petitions={cappedPetitions}
      />
    )

    expect(screen.getByText('Petición 2 de 6')).toBeTruthy()
    expect(screen.getByText('Ora por Requester 2')).toBeTruthy()
    expect(screen.queryByText('Petición 6 de 6')).toBeNull()
  })

  it('queues the Oré action and prevents duplicates for already-prayed IDs', () => {
    const onIntercede = vi.fn()
    const { rerender } = render(
      <IntercessionSection {...baseProps} petitions={petitions} onIntercede={onIntercede} />
    )

    fireEvent.click(screen.getByRole('button', { name: /oré/i }))

    expect(onIntercede).toHaveBeenCalledTimes(1)
    expect(onIntercede).toHaveBeenCalledWith('petition-1')
    expect(toastSuccessMock).toHaveBeenCalledTimes(1)

    rerender(
      <IntercessionSection
        {...baseProps}
        petitions={petitions}
        intercededIds={new Set(['petition-1'])}
        onIntercede={onIntercede}
      />
    )

    const alreadyPrayedButton = screen.getByRole('button', { name: /Oraste por Ana/i }) as HTMLButtonElement
    expect(alreadyPrayedButton.disabled).toBe(true)
    fireEvent.click(alreadyPrayedButton)
    expect(onIntercede).toHaveBeenCalledTimes(1)
  })

  it('prevents Oré queueing for petitions already prayed before the guided session', () => {
    const onIntercede = vi.fn()
    render(
      <IntercessionSection
        {...baseProps}
        petitions={[{ ...petitions[0], has_prayed: true }]}
        onIntercede={onIntercede}
      />
    )

    const button = screen.getByRole('button', { name: /Ya habías orado por Ana/i }) as HTMLButtonElement
    expect(button.disabled).toBe(true)
    fireEvent.click(button)
    expect(onIntercede).not.toHaveBeenCalled()
  })

  it('shows calm loading and fallback guide copy while Oré remains available', () => {
    const { rerender } = render(
      <IntercessionSection
        {...baseProps}
        petitions={petitions}
        guideLoadingByPetitionId={{ 'petition-1': true }}
      />
    )

    expect(screen.getByText(/Preparando una guía serena para esta petición/)).toBeTruthy()
    expect((screen.getByRole('button', { name: /oré/i }) as HTMLButtonElement).disabled).toBe(false)

    rerender(
      <IntercessionSection
        {...baseProps}
        petitions={petitions}
        guideErrorByPetitionId={{ 'petition-1': 'Generation failed' }}
      />
    )

    expect(screen.getByText(/No se pudo preparar la guía/)).toBeTruthy()
    expect(screen.getByText(/Señor, acompaña a Ana/)).toBeTruthy()
    expect((screen.getByRole('button', { name: /oré/i }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('keeps Oré before the guide area and reserves guide space without hiding overflow content', () => {
    render(
      <IntercessionSection
        {...baseProps}
        petitions={petitions}
        guideLoadingByPetitionId={{ 'petition-1': true }}
      />
    )

    const guideArea = screen.getByText('Guía de oración').parentElement
    const oreButton = screen.getByRole('button', { name: /oré/i })
    expect(oreButton.compareDocumentPosition(screen.getByText('Guía de oración')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(guideArea?.className).toContain('min-h-52')
    expect(guideArea?.className).not.toContain('max-h')
    expect(guideArea?.className).not.toContain('overflow')
  })
})
