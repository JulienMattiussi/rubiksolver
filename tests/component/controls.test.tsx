import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { Controls } from '@/components/controls/Controls'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'

beforeEach(() => {
  useCube.getState().reset()
  useI18n.getState().setLocale('fr')
})

describe('<Controls />', () => {
  it('renders the French title and actions by default', () => {
    render(<Controls />)
    expect(screen.getByRole('heading', { name: 'Rubik Solver' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mélanger' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Résoudre' })).toBeInTheDocument()
  })

  it('queues moves when a face button is pressed', async () => {
    const user = userEvent.setup()
    render(<Controls />)
    expect(useCube.getState().queue).toHaveLength(0)
    // Move buttons expose a descriptive tooltip as their accessible name.
    await user.click(
      screen.getByRole('button', { name: 'Tourner la face de droite dans le sens horaire' }),
    )
    expect(useCube.getState().queue).toHaveLength(1)
    expect(useCube.getState().queue[0]).toEqual({ face: 'R', amount: 1 })
  })

  it('switches language to English', async () => {
    const user = userEvent.setup()
    render(<Controls />)
    await user.click(screen.getByRole('button', { name: 'en' }))
    expect(screen.getByRole('button', { name: 'Scramble' })).toBeInTheDocument()
  })
})
