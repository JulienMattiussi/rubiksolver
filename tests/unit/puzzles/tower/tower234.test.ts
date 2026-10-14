import { describe, expect, it } from 'vitest'
import { isBoxed, solvedCube } from '@/lib/core/cube'
import { TOWER234_FORMULAS as F } from '@/lib/methods/tower/tower234'
import { formatMove, movesFor, NOTATION_US, parseMoves } from '@/lib/core/moves'
import { applyMoves, turnAllowed } from '@/lib/core/turn'
import type { Cube, Move } from '@/lib/core/types'

const SOLVED = solvedCube('234')

/** The slots whose piece a sequence changes, played from the solved
 *  tower, each turn checked possible where it is played. */
function changed(moves: readonly Move[]): string[] {
  let cube: Cube = SOLVED
  for (const m of moves) {
    expect(turnAllowed(cube, m), formatMove(m, NOTATION_US)).toBe(true)
    cube = applyMoves(cube, [m])
  }
  expect(isBoxed(cube)).toBe(true)
  const look = (c: Cube[number]) =>
    c.stickers
      .map((s) => `${s.normal.join()}${s.color}`)
      .sort()
      .join()
  return cube
    .filter((c) => look(c) !== look(SOLVED.find((s) => s.position.join() === c.position.join())!))
    .map((c) => c.position.join(' '))
    .sort()
}

const turns = (shape: Cube) => movesFor('234').filter((m) => turnAllowed(shape, m))
const names = (moves: readonly Move[]) => moves.map((m) => formatMove(m, NOTATION_US)).join(' ')

describe('2x3x4 tower', () => {
  it('turns its side columns by quarters, the rest by halves', () => {
    expect(names(turns(SOLVED))).toBe("U2 2U2 Uw2 D2 2D2 Dw2 L L2 L' R R2 R' Fw2 Bw2")
  })

  it('blocks a layer that is not whole, as the 2x2x4 does', () => {
    expect(names(turns(applyMoves(SOLVED, parseMoves('R'))))).toBe(
      "Uw2 Dw2 L L2 L' R R2 R' Fw2 Bw2",
    )
  })

  it('swaps two corners with P(H*D.G.H*D)³P, an equator pair with them', () => {
    expect(changed(F.cornersD)).toEqual(['-1 1 -1', '-1 3 -1', '1 1 1', '1 3 1'])
    expect(changed(F.cornersG)).toEqual(['-1 1 1', '-1 3 1', '1 1 -1', '1 3 -1'])
  })

  it('swaps two edges with (D²H)³, (D²A)³ and PB.(D²A)³.BP', () => {
    expect(changed(F.edgesTop).filter((p) => p.startsWith('0'))).toEqual(['0 3 -1', '0 3 1'])
    expect(changed(F.edgesFront)).toEqual(['0 -3 1', '0 3 1'])
    expect(changed(F.edgesBack)).toEqual(['0 3 -1', '0 3 1'])
  })

  it.each(['equatorD', 'equatorG', 'equatorH', 'equatorA', 'equatorParity'] as const)(
    'moves the equator alone with %s',
    (name) => {
      const slots = changed(F[name])
      expect(slots.length).toBeGreaterThan(0)
      for (const slot of slots) {
        const [x, y] = slot.split(' ').map(Number) as [number, number]
        expect([Math.abs(x), Math.abs(y)]).toEqual([1, 1])
      }
    },
  )
})
