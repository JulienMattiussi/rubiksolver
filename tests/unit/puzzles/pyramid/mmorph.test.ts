import { describe, expect, it } from 'vitest'
import { cubeShape, isSolved, solvedCube, stateKey } from '@/lib/core/cube'
import { buildCube, cubeToEdit } from '@/lib/editor/edit'
import { CENTER_HALF, CENTERS_TWO } from '@/lib/methods/pyramid/mmorph'
import { isSmallCorner } from '@/lib/puzzles/pyramid/mmorph'
import { parseMoves } from '@/lib/core/notation'
import { applyMoves } from '@/lib/core/turn'
import { validateCube } from '@/lib/editor/validate'

const SOLVED = solvedCube('mmorph')

/** The pieces a sequence leaves otherwise, by their colors (H: a mark). */
const moved = (moves: string) =>
  applyMoves(SOLVED, parseMoves(moves))
    .filter((c, i) => {
      const home = SOLVED[i]!
      return c.stickers.some((s, k) => s.normal.join() !== home.stickers[k]!.normal.join())
    })
    .map((c) => c.stickers.map((s) => s.color).join(''))
    .sort()

describe('Master Morphinx', () => {
  it('is a 3x3 of its own, its centers marked', () => {
    expect(cubeShape(SOLVED)).toBe('mmorph')
  })

  it('turns two centers, or one by half, as fan2cube.fr says', () => {
    // (H)+(G)- = Hd'h'd.H'd'hd: the top and left centers.
    expect(moved(CENTERS_TWO)).toEqual(['OH', 'WH'])
    // (H)2+ = (H.DGH²D'G')²: the top center a half turn.
    expect(moved(CENTER_HALF)).toEqual(['WH'])
    expect(isSolved(applyMoves(SOLVED, parseMoves(CENTER_HALF)))).toBe(false)
  })

  it('never shows a small corner twisted', () => {
    // Two small top corners twisted in place, each brought to the front
    // right in turn: (R'D'RD)² twists one, (R'D'RD)⁴ the other back.
    const twice = "R' D' R D R' D' R D"
    const twist = applyMoves(SOLVED, parseMoves(`U' ${twice} U2 ${twice} ${twice} U'`))
    expect(
      twist.filter((c, i) => stateKey([c]) !== stateKey([SOLVED[i]!])).every(isSmallCorner),
    ).toBe(true)
    expect(isSolved(twist)).toBe(true)
    // Entered as it shows, then made real: a solved puzzle.
    const entered = buildCube(cubeToEdit(twist), 'mmorph')
    expect(validateCube(entered)).toEqual({ ok: true })
  })
})
