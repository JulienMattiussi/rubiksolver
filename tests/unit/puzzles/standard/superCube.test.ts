import { describe, expect, it } from 'vitest'
import { cubeShape, isSolved, solvedCube } from '@/lib/core/cube'
import { O_CORNER, O_EDGE, TURN_PAIR } from '@/lib/methods/standard/superCube'
import { parseMoves } from '@/lib/core/notation'
import { withoutBorders } from '@/lib/puzzles/standard/superCube'
import { applyMoves } from '@/lib/core/turn'
import type { Cube, Move } from '@/lib/core/types'

/** The pieces a sequence moves or turns, from solved. */
const moved = (solved: Cube, moves: readonly Move[]) => {
  const after = applyMoves(solved, moves)
  return after.filter(
    (c, i) =>
      c.position.join() !== solved[i]!.position.join() ||
      c.stickers.some((s, k) => s.normal.join() !== solved[i]!.stickers[k]!.normal.join()),
  )
}

describe('Super Revenge and Super Professor', () => {
  it('are the big cubes, their centers bordered', () => {
    expect(cubeShape(solvedCube('super4'))).toBe('super4')
    expect(cubeShape(withoutBorders(solvedCube('super4')))).toBe('4')
    expect(cubeShape(withoutBorders(solvedCube('super5')))).toBe('5')
  })

  it('shows its centers turned by (H)+(G)- = Hd*’h*’d*.H’d*’h*d* (fan2cube.fr)', () => {
    // The top's and the left's centers a quarter each: unseen on a Revenge.
    // d* and h*: the two inner layers (2R with 2L the other way...).
    const turn = parseMoves("U 2R' 2L 2U' 2D 2R 2L' U' 2R' 2L 2U 2D' 2R 2L'")
    expect(isSolved(applyMoves(solvedCube('4'), turn))).toBe(true)
    expect(isSolved(applyMoves(solvedCube('super4'), turn))).toBe(false)
    expect(moved(solvedCube('super4'), turn)).toHaveLength(8)
  })

  it('cycles 3 centers by O = g’HdH’.gHd’H’ (fan2cube.fr), nothing else', () => {
    expect(moved(solvedCube('super4'), parseMoves(O_CORNER))).toHaveLength(3)
    expect(moved(solvedCube('super5'), parseMoves(O_CORNER))).toHaveLength(3)
    expect(moved(solvedCube('super5'), parseMoves(O_EDGE))).toHaveLength(3)
  })

  it('turns two middle centers by (H)+(G)- (fan2cube.fr), their faces’ centers with them', () => {
    const solved = solvedCube('super5')
    const after = moved(solved, TURN_PAIR)
    // Only centers: the top's and the left's nine each (a whole block).
    expect(after.every((c) => c.position.filter((v) => Math.abs(v) === 2).length === 1)).toBe(true)
    expect(after.length).toBeLessThanOrEqual(18)
  })
})
