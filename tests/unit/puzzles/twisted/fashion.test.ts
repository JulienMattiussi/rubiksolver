import { describe, expect, it } from 'vitest'
import { isBoxed, solvedCube } from '@/lib/core/cube'
import { parseMoves, scrambleTurns } from '@/lib/core/moves'
import { applyMoves, turnAllowed } from '@/lib/core/turn'
import type { Move } from '@/lib/core/types'
import { backToBox } from '@/lib/methods/twisted/fashionShape'
import { seededRng } from '../../../helpers'

const SOLVED = solvedCube('fashion')
const goes = (cube: typeof SOLVED, text: string) =>
  parseMoves(text).every((m: Move) => turnAllowed(cube, m))

describe('Fashion-V', () => {
  it('is a 3x3x5 in its box: five layers, its pairs lying', () => {
    expect(new Set(SOLVED.map((c) => c.position[1])).size).toBe(5)
    expect(isBoxed(SOLVED)).toBe(true)
  })

  it('turns a thin layer alone only when its half is laid', () => {
    // Laid: H, h, b, B; the blocks; no side alone, nor the equator (its
    // centers never move).
    expect(goes(SOLVED, 'U 2U 2D D Uw Rw')).toBe(true)
    expect(goes(SOLVED, 'R')).toBe(false)
    expect(goes(SOLVED, '3U')).toBe(false)
    // A side's block a quarter stands its pairs up: H and h lock, the
    // halves' blocks still go.
    const stood = applyMoves(SOLVED, parseMoves('Rw'))
    expect(isBoxed(stood)).toBe(false)
    expect(goes(stood, 'U')).toBe(false)
    expect(goes(stood, '2U')).toBe(false)
    expect(goes(stood, 'Uw Dw')).toBe(true)
  })

  it('lays its pairs back down by blocks alone', () => {
    for (let seed = 1; seed <= 5; seed++) {
      const cube = applyMoves(SOLVED, scrambleTurns('fashion', 30, seededRng(seed), SOLVED))
      const moves = backToBox(cube, 'fashion')
      expect(moves.every((m) => m.wide && m.depth === 2)).toBe(true)
      expect(isBoxed(applyMoves(cube, moves))).toBe(true)
    }
  }, 60000)
})
