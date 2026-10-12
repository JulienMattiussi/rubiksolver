import { describe, expect, it } from 'vitest'
import { cubeShape, isSolved, solvedCube } from '@/lib/cube'
import { PLACE_LEFT, PLACE_RIGHT } from '@/lib/methods/rainbow'
import { formatMoves, NOTATION_FR, NOTATION_US } from '@/lib/moves'
import { RAINBOW_TURNS } from '@/lib/rainbow'
import { applyMoves } from '@/lib/turn'
import type { RainbowMove } from '@/lib/types'

const SOLVED = solvedCube('rainbow')

/** The pieces a sequence moves from solved (their solved slots). */
const moved = (moves: readonly RainbowMove[]) => {
  const after = applyMoves(SOLVED, moves)
  return SOLVED.filter((c, i) => c.position.join() !== after[i]!.position.join()).length
}

describe('Rainbow', () => {
  it('has 12 pieces of four colors and 8 fixed centers', () => {
    expect(cubeShape(SOLVED)).toBe('rainbow')
    expect(SOLVED.filter((c) => c.stickers.length === 4)).toHaveLength(12)
    expect(SOLVED.filter((c) => c.stickers.length === 1)).toHaveLength(8)
    // Every piece told apart by its colors, no face beside one of its color.
    const colors = (c: (typeof SOLVED)[number]) =>
      c.stickers
        .map((s) => s.color)
        .sort()
        .join()
    const pieces = SOLVED.filter((c) => c.stickers.length === 4)
    expect(new Set(pieces.map(colors)).size).toBe(12)
    for (const c of pieces) expect(new Set(c.stickers.map((s) => s.color)).size).toBe(4)
  })

  it('turns a triangle a third: its three pieces, its center staying put', () => {
    for (const turn of RAINBOW_TURNS) {
      expect(moved([turn])).toBe(3)
      expect(isSolved(applyMoves(SOLVED, [turn, turn, turn]))).toBe(true)
    }
  })

  it("writes fan2cube's letters, and its two formulas cycle three pieces", () => {
    expect(formatMoves(PLACE_LEFT, NOTATION_FR)).toBe("H' G' H G")
    expect(formatMoves(PLACE_RIGHT, NOTATION_US)).toBe("U R U' R'")
    expect(moved(PLACE_LEFT)).toBe(3)
    expect(moved(PLACE_RIGHT)).toBe(3)
  })
})
