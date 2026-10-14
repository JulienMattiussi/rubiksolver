import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Controls } from '@/components/controls/Controls'
import { useI18n } from '@/i18n/i18nStore'
import { cubeShape, solvedCube, stateKey } from '@/lib/cube'
import { applyMoves } from '@/lib/turn'
import { parseMoves } from '@/lib/moves'
import { useCube } from '@/store/cubeStore'
import { useSaved } from '@/store/savedStore'
import { useView } from '@/store/viewStore'

/** Choose a puzzle through the picker: open it, its category, then the puzzle. */
async function pickCube(user: ReturnType<typeof userEvent.setup>, category: string, name: string) {
  await user.click(screen.getByRole('button', { name: /^Choix du cube/ }))
  await user.click(screen.getByRole('button', { name: new RegExp(`^${category}`) }))
  await user.click(screen.getByRole('button', { name }))
}

beforeEach(() => {
  useCube.getState().setShape('3')
  useCube.getState().reset()
  useI18n.getState().setLocale('fr')
  useSaved.setState({ saved: {} })
  // An in-memory Storage: the runtime's own may be missing or inert.
  const items = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => items.set(key, value),
  })
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

  it("offers the 3x3's middle slices and wide turns on an advanced tab", async () => {
    const user = userEvent.setup()
    render(<Controls />)
    expect(screen.queryByRole('button', { name: 'Tranche' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Avancé' }))
    expect(
      screen.getByRole('button', {
        name: /^On tourne la tranche du milieu, parallèle à la face de gauche, d’un quart de tour dans le sens des aiguilles/,
      }),
    ).toBeInTheDocument()
    await user.click(
      screen.getByRole('button', {
        name: /^On tourne la tranche du milieu, parallèle à la face du bas, d’un quart de tour dans le sens inverse/,
      }),
    )
    expect(useCube.getState().queue.at(-1)).toEqual({ face: 'D', amount: 3, depth: 2 })
    useCube.getState().stop()
  })

  it('offers inner-slice and wide turns on the 4x4', async () => {
    const user = userEvent.setup()
    render(<Controls />)

    await pickCube(user, 'Standards', '4x4 (Revenge)')
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

  it('saves a state and restores it after the cube moved on', async () => {
    const user = userEvent.setup()
    render(<Controls />)
    const restore = screen.getByRole('button', { name: 'Restaurer' })
    expect(restore).toBeDisabled()

    const scrambled = applyMoves(solvedCube('3'), parseMoves("R U F' L2 D"))
    useCube.getState().loadCube(scrambled)
    await user.click(screen.getByRole('button', { name: 'Mémoriser' }))
    // Saving the very state it holds again would be a no-op.
    expect(screen.getByRole('button', { name: 'Mémoriser' })).toBeDisabled()
    expect(localStorage.getItem('rubiksolver.saved')).toContain('"3"')

    await user.click(screen.getByRole('button', { name: 'Réinitialiser' }))
    expect(restore).toBeEnabled()
    await user.click(restore)
    expect(stateKey(useCube.getState().cube)).toBe(stateKey(scrambled))
  })

  it('asks before replacing another saved state, not before a first save', async () => {
    const user = userEvent.setup()
    render(<Controls />)
    const first = applyMoves(solvedCube('3'), parseMoves('R U'))
    useCube.getState().loadCube(first)
    await user.click(screen.getByRole('button', { name: 'Mémoriser' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()

    const second = applyMoves(solvedCube('3'), parseMoves("F' D2"))
    useCube.getState().loadCube(second)
    const savedKey = () => useSaved.getState().saved['3']?.cube
    const before = savedKey()

    // Cancelling keeps the first state.
    await user.click(screen.getByRole('button', { name: 'Mémoriser' }))
    expect(
      screen.getByRole('alertdialog', { name: 'Remplacer l’état mémorisé ?' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Annuler' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(savedKey()).toBe(before)

    // Escape cancels too; confirming replaces it.
    await user.click(screen.getByRole('button', { name: 'Mémoriser' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Mémoriser' }))
    await user.click(screen.getByRole('button', { name: 'Remplacer' }))
    expect(savedKey()).not.toBe(before)
    expect(screen.getByRole('button', { name: 'Mémoriser' })).toBeDisabled()
  })

  it('on the 2x2x4 tower, offers outer and wide turns, jamming incomplete ends', async () => {
    const user = userEvent.setup()
    render(<Controls />)
    await pickCube(user, 'Tours', '2x2x4')
    // A 4x4x4 mechanism with pieces missing: no inner slice to pick.
    expect(screen.queryByRole('button', { name: 'Tranche' })).not.toBeInTheDocument()
    const jammed = (face: string) =>
      screen.getAllByRole('button', {
        name: `Bloqué : la ${face} ne peut pas tourner dans cette position`,
      })[0]
    // In its box, only its ends turn as outer layers; R has nothing to turn.
    expect(jammed('face de droite')).toBeDisabled()
    await user.click(
      screen.getByRole('button', { name: 'Tourner la face du haut dans le sens horaire' }),
    )
    expect(useCube.getState().queue.at(-1)).toEqual({ face: 'U', amount: 1 })
    useCube.getState().stop()

    // Wide turns always go: Rw lays the right half down.
    await user.click(screen.getByRole('button', { name: 'Large' }))
    await user.click(
      screen.getByRole('button', {
        name: 'Tourner les deux couches de la face de droite dans le sens anti-horaire',
      }),
    )
    expect(useCube.getState().queue.at(-1)).toEqual({ face: 'R', amount: 3, depth: 2, wide: true })
    useCube.getState().stop()

    // Then the top end keeps two cubes only: U jams.
    useCube.getState().loadCube(applyMoves(solvedCube('224'), parseMoves('Rw')))
    await user.click(screen.getByRole('button', { name: 'Externe' }))
    expect(jammed('face du haut')).toBeDisabled()
  })

  it('previews the pieces of a turn while its button is hovered', async () => {
    const user = userEvent.setup()
    render(<Controls />)
    const button = screen.getByRole('button', {
      name: 'Tourner la face de droite dans le sens horaire',
    })
    await user.hover(button)
    expect(useView.getState().preview).toEqual({ face: 'R', amount: 1 })
    await user.unhover(button)
    expect(useView.getState().preview).toBeNull()
  })

  it('picks a puzzle by category, then by thumbnail', async () => {
    const user = userEvent.setup()
    render(<Controls />)
    // The picker always opens on the categories, the current one marked.
    await user.click(screen.getByRole('button', { name: 'Choix du cube : 3x3' }))
    expect(screen.getByRole('dialog', { name: 'Choisir un cube' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Standards, 5 puzzles' })).toHaveAttribute(
      'aria-current',
      'true',
    )
    await user.click(screen.getByRole('button', { name: 'Standards, 5 puzzles' }))
    expect(screen.getByRole('button', { name: '3x3' })).toHaveAttribute('aria-current', 'true')
    await user.click(screen.getByRole('button', { name: 'Toutes les catégories' }))
    await user.click(screen.getByRole('button', { name: 'Plats, 3 puzzles' }))
    await user.click(screen.getByRole('button', { name: '3x3x1 (Floppy)' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(cubeShape(useCube.getState().cube)).toBe('331')
    expect(
      screen.getByRole('button', { name: 'Choix du cube : 3x3x1 (Floppy)' }),
    ).toBeInTheDocument()
  })

  it('on the slim tower, offers wide turns on U and D only', async () => {
    const user = userEvent.setup()
    render(<Controls />)
    await pickCube(user, 'Tours', '2x2x3 (Slim Tower)')
    await user.click(screen.getByRole('button', { name: 'Large' }))
    // Its sides are two layers deep: no wide turn there.
    expect(
      screen.getByRole('button', {
        name: 'Pas de coup large pour la face de droite sur ce puzzle',
      }),
    ).toBeDisabled()
    await user.click(
      screen.getByRole('button', {
        name: 'Tourner les deux couches de la face du haut dans le sens horaire',
      }),
    )
    expect(useCube.getState().queue.at(-1)).toEqual({ face: 'U', amount: 1, depth: 2, wide: true })
  })
})
