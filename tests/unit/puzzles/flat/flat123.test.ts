import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube, stateKey } from '@/lib/core/cube'
import { applyMove, applyMoves } from '@/lib/core/turn'
import { formatMoves, movesFor } from '@/lib/core/moves'
import { solveExhaustively } from '@/lib/solve/exhaustive'
import { validateCube } from '@/lib/editor/validate'

/**
 * The 1x2x3 is the app's first non-cubic shape: 3 wide, 2 tall, 1 thick. What
 * it can do follows from those dimensions alone, so these tests pin the
 * geometry down, then walk its whole state space.
 */

const SOLVED = solvedCube('123')

/** Every state reachable from solved (small enough to enumerate exhaustively). */
function reachableStates(): Map<string, ReturnType<typeof solvedCube>> {
  const moves = movesFor('123')
  const seen = new Map([[stateKey(SOLVED), SOLVED]])
  let frontier = [SOLVED]
  while (frontier.length) {
    const next = []
    for (const cube of frontier) {
      for (const move of moves) {
        const turned = applyMove(cube, move)
        const key = stateKey(turned)
        if (!seen.has(key)) {
          seen.set(key, turned)
          next.push(turned)
        }
      }
    }
    frontier = next
  }
  return seen
}

describe('1x2x3 shape', () => {
  it('only allows half turns, and none at all on its thin axis', () => {
    // A quarter turn would swap two axes of different lengths, and the front
    // face is the puzzle's only layer, so turning it is a whole-puzzle rotation.
    expect(formatMoves(movesFor('123'))).toBe('U2 D2 L2 R2')
  })

  it('keeps every piece on the grid, and comes back after two half turns', () => {
    for (const move of movesFor('123')) {
      const turned = applyMove(SOLVED, move)
      expect(isSolved(turned)).toBe(false)
      for (const cubie of turned) {
        expect([-1, 0, 1]).toContain(cubie.position[0])
        expect([-1, 1]).toContain(cubie.position[1])
        expect([0]).toContain(cubie.position[2])
      }
      expect(isSolved(applyMove(turned, move))).toBe(true)
    }
  })
})

describe('1x2x3 solver', () => {
  it('solves every reachable state, none needing more than six half turns', () => {
    const states = reachableStates()
    // Small enough that the whole puzzle is provable, not just sampled.
    expect(states.size).toBe(96)
    let longest = 0
    for (const cube of states.values()) {
      const moves = solveExhaustively(cube)
      expect(isSolved(applyMoves(cube, moves))).toBe(true)
      longest = Math.max(longest, moves.length)
    }
    // Feeds MAX_DEPTH_123 in solver.ts: one more proves a puzzle impossible.
    expect(longest).toBe(6)
  })
})

describe('1x2x3 editor and validation', () => {
  it('rejects an unreachable arrangement', () => {
    // Flip one end piece in place: the piece count stays right, but no
    // sequence of half turns produces it.
    const [first, ...rest] = SOLVED
    const flipped = [
      {
        ...first!,
        stickers: first!.stickers.map((s) => ({
          ...s,
          normal: [-s.normal[0], -s.normal[1], -s.normal[2]] as const,
        })),
      },
      ...rest,
    ]
    expect(validateCube(flipped)).toMatchObject({ ok: false, error: 'impossible' })
  })
})
