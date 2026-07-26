import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { Controls } from '@/components/controls/Controls'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'

beforeEach(() => {
  useCube.getState().setSize(3)
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

  it('offers inner-slice and wide turns on the 4x4 only', async () => {
    const user = userEvent.setup()
    render(<Controls />)
    // No layer selector on the 3x3.
    expect(screen.queryByRole('group', { name: 'Couche tournée' })).not.toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Choix du cube'), '4')
    await user.click(screen.getByRole('button', { name: 'Tranche' }))
    await user.click(
      screen.getByRole('button', {
        name: 'Tourner la tranche interne de la face de droite dans le sens horaire',
      }),
    )
    expect(useCube.getState().queue.at(-1)).toEqual({ face: 'R', amount: 1, depth: 2 })

    // Without a 3D loop the queue never drains and keeps the pad disabled.
    useCube.getState().stop()

    await user.click(screen.getByRole('button', { name: 'Large' }))
    await user.click(
      screen.getByRole('button', {
        name: 'Tourner les deux couches de la face de droite dans le sens anti-horaire',
      }),
    )
    expect(useCube.getState().queue.at(-1)).toEqual({ face: 'R', amount: 3, depth: 2, wide: true })
  })
})
