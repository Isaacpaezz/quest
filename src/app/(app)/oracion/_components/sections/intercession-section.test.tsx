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

    expect(screen.getByText('Preparando una guía serena para esta petición…')).toBeTruthy()
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
})
