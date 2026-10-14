import { describe, expect, it } from 'vitest'
import { camoBox } from '@/lib/puzzles/tower/camo'
import { isBoxed, isSolved, solvedCube } from '@/lib/core/cube'
import { methodsFor } from '@/lib/solve/solver'
import { backToBox } from '@/lib/puzzles/tower/camoShape'
import { formsOf, notEnterable } from '@/lib/editor/forms'
import { EXCHANGE, evenWings, WING_PARITY } from '@/lib/methods/tower/camo'
import { formatMove, layerTurnsOf, parseMoves, scrambleTurns } from '@/lib/core/moves'
import { applyMoves, turnAllowed } from '@/lib/core/turn'
import { seededRng } from '../../../helpers'

const SOLVED = solvedCube('camo')
const allowed = (cube = SOLVED) =>
  layerTurnsOf('camo')
    .filter((m) => turnAllowed(cube, m))
    .map((m) => formatMove(m))

describe('Camouflage 4x4x2', () => {
  it('is a 4x4 seen from above, two pieces tall, its inner rows thin', () => {
    expect(SOLVED).toHaveLength(32)
    const widths = (x: number) => {
      const [lo, hi] = camoBox(SOLVED.find((c) => c.position.join() === `${x},1,3`)!)[0]!
      return hi - lo
    }
    expect([widths(3), widths(1)]).toEqual([1, 0.5])
  })

  it('turns its top and bottom whole only, the layers of its sides as they like', () => {
    const turns = allowed()
    expect(turns).toEqual(expect.arrayContaining(['Uw', 'R', "2R'", 'Rw', 'R2']))
    expect(turns).not.toContain('U')
    expect(turns).not.toContain('2U')
  })

  it('is jammed out of its box on an axis its pieces stand tall on, never by blocks', () => {
    const out = applyMoves(SOLVED, parseMoves('R'))
    expect(isBoxed(out)).toBe(false)
    const turns = allowed(out)
    expect(turns).toEqual(expect.arrayContaining(['Uw', 'Fw', 'Rw']))
    expect(turns).not.toContain('F')
  })

  it('is entered in its box only: its forms are too many to offer', () => {
    expect(formsOf('camo')).toHaveLength(1)
    expect(notEnterable(applyMoves(SOLVED, parseMoves('R')))).toBe('box')
    expect(notEnterable(SOLVED)).toBeNull()
  })

  it('goes back in its box from far off, in a few turns', () => {
    for (const seed of [1, 2, 3]) {
      const cube = applyMoves(SOLVED, scrambleTurns('camo', 200, seededRng(seed), SOLVED))
      const back = backToBox(cube, SOLVED)!
      expect(back.length).toBeLessThanOrEqual(12)
      expect(isBoxed(applyMoves(cube, back))).toBe(true)
    }
  })

  it('turns the wings’ parity with a way out of the box and back', () => {
    const after = applyMoves(SOLVED, WING_PARITY)
    expect(isBoxed(after)).toBe(true)
    expect(evenWings(after)).toBe(false)
    // Played from the box, every turn goes.
    let cube = SOLVED
    for (const move of WING_PARITY) {
      expect(turnAllowed(cube, move)).toBe(true)
      cube = applyMoves(cube, [move])
    }
  })

  it('is solved in its box with its wings an odd permutation', () => {
    const odd = applyMoves(SOLVED, [...WING_PARITY, ...parseMoves('Uw R2')])
    const [method] = methodsFor('camo')
    const moves = method!.solve(odd).flatMap((step) => [...step.moves])
    expect(isSolved(applyMoves(odd, moves))).toBe(true)
  }, 60000)

  it('exchanges a bottom wing for a top one with D*²H’D²HD*², in its box', () => {
    const after = applyMoves(SOLVED, EXCHANGE)
    expect(isBoxed(after)).toBe(true)
    const from = SOLVED.findIndex((c) => c.position.join() === '1,-1,-3')
    expect(after[from]!.position[1]).toBe(1)
  })
})
