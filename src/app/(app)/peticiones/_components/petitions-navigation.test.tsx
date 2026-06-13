import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PetitionsNavigation } from './petitions-navigation'

describe('PetitionsNavigation', () => {
  it('renders community, personal, and new petition links with expected hrefs', () => {
    render(<PetitionsNavigation active="community" />)

    const communityLink = screen.getByRole('link', { name: 'Comunidad' })
    const mineLink = screen.getByRole('link', { name: 'Mis peticiones' })
    const newLink = screen.getByRole('link', { name: 'Nueva petición' })

    expect(communityLink.getAttribute('href')).toBe('/peticiones')
    expect(mineLink.getAttribute('href')).toBe('/peticiones/mis-peticiones')
    expect(newLink.getAttribute('href')).toBe('/peticiones/nueva')
  })

  it('marks Comunidad as current when active is community', () => {
    render(<PetitionsNavigation active="community" />)

    const communityLink = screen.getByRole('link', { name: 'Comunidad' })
    const mineLink = screen.getByRole('link', { name: 'Mis peticiones' })

    expect(communityLink.getAttribute('aria-current')).toBe('page')
    expect(mineLink.getAttribute('aria-current')).toBeNull()
  })

  it('marks Mis peticiones as current when active is mine', () => {
    render(<PetitionsNavigation active="mine" />)

    const communityLink = screen.getByRole('link', { name: 'Comunidad' })
    const mineLink = screen.getByRole('link', { name: 'Mis peticiones' })

    expect(mineLink.getAttribute('aria-current')).toBe('page')
    expect(communityLink.getAttribute('aria-current')).toBeNull()
  })
})
