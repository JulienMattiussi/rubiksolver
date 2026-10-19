import { describe, expect, it } from 'vitest'
import { camoBox } from '@/lib/puzzles/tower/camo'
import { isBoxed, isSolved, solvedCube } from '@/lib/core/cube'
import { methodsFor } from '@/lib/solve/solver'
import { backToBox, shapeOf } from '@/lib/puzzles/tower/camoShape'
import { CAMO_FACE_ENTRY, shapeFromViews } from '@/lib/puzzles/tower/camoViews'
import { sightOf } from '@/lib/editor/modes/faceViews'

const camoViewsOf = (cube: Parameters<typeof sightOf>[0]) => sightOf(cube, CAMO_FACE_ENTRY.grid)
import { entryOf } from '@/lib/editor/entry'
import { EXCHANGE, evenWings, WING_PARITY } from '@/lib/methods/tower/camo'
import { layerTurnsOf, scrambleTurns } from '@/lib/core/moves'
import { formatMove, parseMoves } from '@/lib/core/notation'
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

  it('offers no forms to pick: too many, it is entered face by face', () => {
    expect(entryOf('camo').steps.map((s) => s.kind)).toEqual(['canvas'])
  })

  it('is seen from four sides: its front, top, back and bottom, as it tilts toward us', () => {
    // In its box: the front shows its four columns' stickers, a region each
    // (thick, thin, thin, thick across), its top a 4x4 of regions.
    const { views } = camoViewsOf(SOLVED)
    expect(new Set(views[0]!.filter((r) => r >= 0)).size).toBe(8)
    expect(new Set(views[1]!.filter((r) => r >= 0)).size).toBe(16)
    // Its top's front row is the front face's top row, read the same way.
    expect(views[1]!.slice(30, 36).map((r) => r >= 0)).toEqual([true, true, true, true, true, true])
  })

  it('has its shape found again from its four faces alone', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const cube = applyMoves(SOLVED, scrambleTurns('camo', 40, seededRng(seed), SOLVED))
      expect(shapeFromViews(camoViewsOf(cube).views)).toEqual(shapeOf(cube))
    }
    // A face no shape shows: two regions of one piece.
    const { views } = camoViewsOf(SOLVED)
    const front = views[0]!.map((r) => (r === 1 ? 0 : r))
    expect(shapeFromViews([front, ...views.slice(1)])).toBeNull()
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
