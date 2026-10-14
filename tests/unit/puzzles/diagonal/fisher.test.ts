import { describe, expect, it } from 'vitest'
import { cubeShape, isSolved, solvedCube } from '@/lib/core/cube'
import { CENTER_TURN } from '@/lib/methods/diagonal/fisher'
import { parseMoves } from '@/lib/core/moves'
import { applyMoves } from '@/lib/core/turn'

const SOLVED = solvedCube('fisher')

/** The pieces a sequence leaves otherwise than solved, by their colors. */
const moved = (moves: string) => {
  const cube = applyMoves(SOLVED, parseMoves(moves))
  return cube
    .filter((c, i) => {
      const home = SOLVED[i]!
      return (
        c.position.join() !== home.position.join() ||
        c.stickers.some((s, k) => s.normal.join() !== home.stickers[k]!.normal.join())
      )
    })
    .map((c) => c.stickers.map((s) => s.color).join(''))
}

describe('Fisher Cube', () => {
  it('is a 3x3 of its own, its side centers marked', () => {
    expect(cubeShape(SOLVED)).toBe('fisher')
  })

  it('turns the left center and the top one by (H)+(G)- = Hd’h’d.H’d’hd', () => {
    // The top center is a square: its turn is not even kept. The left one
    // shows (its mark, H, on its side).
    expect(moved(CENTER_TURN)).toEqual(['OH'])
    expect(isSolved(applyMoves(SOLVED, parseMoves(CENTER_TURN)))).toBe(false)
    expect(isSolved(applyMoves(SOLVED, parseMoves(Array(4).fill(CENTER_TURN).join(' '))))).toBe(
      true,
    )
  })

  it('shows its side centers turned, a half turn too', () => {
    const half = applyMoves(SOLVED, parseMoves(`${CENTER_TURN} ${CENTER_TURN}`))
    expect(moved(`${CENTER_TURN} ${CENTER_TURN}`)).toEqual(['OH'])
    expect(isSolved(half)).toBe(false)
  })
})
