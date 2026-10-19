import { describe, expect, it } from 'vitest'
import { isBlock } from '@/lib/puzzles/bandaged/ai'
import { solvedCube } from '@/lib/core/cube'
import { C } from '@/lib/methods/bandaged/aiFormulas'
import { scrambleTurns } from '@/lib/core/moves'
import { applyMoves, turnAllowed } from '@/lib/core/turn'
import type { Move } from '@/lib/core/types'
import { seededRng } from '../../../helpers'

const SOLVED = solvedCube('ai')

describe('AI Cube', () => {
  it('turns only by halves when solved, its big blocks in quincunx', () => {
    expect(turnAllowed(SOLVED, { face: 'R', amount: 1, depth: 2, wide: true })).toBe(true)
    expect(turnAllowed(SOLVED, { face: 'R', amount: 1 })).toBe(false)
    expect(turnAllowed(SOLVED, { face: 'U', amount: 1, depth: 2 })).toBe(false)
  })

  it('scrambles with outer layers and slices, not only halves', () => {
    const moves = scrambleTurns('ai', 40, seededRng(3), SOLVED) as Move[]
    expect(moves.filter((m) => !m.wide).length).toBeGreaterThan(10)
    // And ends with its big blocks spread out: two in each half.
    const blocks = applyMoves(SOLVED, moves).filter(isBlock)
    for (const axis of [0, 1, 2])
      expect(blocks.filter((c) => c.position[axis]! > 0)).toHaveLength(2)
  })

  it('cycles three centers by C, nothing else (fan2cube.fr)', () => {
    const solved4 = solvedCube('4')
    const after = applyMoves(solved4, C)
    const moved = after.filter(
      (c, i) =>
        c.position.join() !== solved4[i]!.position.join() ||
        c.stickers.some((s, k) => s.normal.join() !== solved4[i]!.stickers[k]!.normal.join()),
    )
    expect(moved).toHaveLength(3)
    expect(moved.every((c) => c.stickers.length === 1)).toBe(true)
  })
})
