import { describe, expect, it } from 'vitest'
import {
  cubeOrientations,
  cubeShape,
  isSolved,
  solvedCube,
  stateKey,
  stickersTotal,
} from '@/lib/cube'
import { normalIndex } from '@/lib/geometry'
import { applyMove, applyMoves } from '@/lib/turn'
import { formatMoves, movesFor, scramble } from '@/lib/moves'
import { solveFlat123 } from '@/lib/methods/flat123'
import { solve } from '@/lib/solver'
import { buildCube, cubeToEdit } from '@/lib/editor'
import { validateCube } from '@/lib/validate'
import type { Cube } from '@/lib/types'
import { seededRng } from '../helpers'

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
  it('has six pieces and twenty-two stickers', () => {
    expect(SOLVED).toHaveLength(6)
    expect(cubeShape(SOLVED)).toBe('123')
    expect(stickersTotal('123')).toBe(22)
    // Its thin axis is exposed on both sides, so the four end pieces show four
    // facelets and the two middle ones show three.
    const counts = SOLVED.map((c) => c.stickers.length).sort()
    expect(counts.filter((n) => n === 4)).toHaveLength(4)
    expect(counts.filter((n) => n === 3)).toHaveLength(2)
  })

  it('only allows half turns, and none at all on its thin axis', () => {
    // A quarter turn would swap two axes of different lengths, and the front
    // face is the puzzle's only layer, so turning it is a whole-puzzle rotation.
    expect(formatMoves(movesFor('123'))).toBe('U2 D2 L2 R2')
  })

  it('has four whole-puzzle orientations, not twenty-four', () => {
    expect(cubeOrientations(SOLVED)).toHaveLength(4)
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
  it('leaves a solved puzzle alone', () => {
    expect(solve(SOLVED)).toEqual([])
    expect(solveFlat123(SOLVED)).toEqual([])
  })

  it('solves every reachable state, none needing more than six half turns', () => {
    const states = reachableStates()
    // Small enough that the whole puzzle is provable, not just sampled.
    expect(states.size).toBe(96)
    let longest = 0
    for (const cube of states.values()) {
      const moves = solveFlat123(cube)
      expect(isSolved(applyMoves(cube, moves))).toBe(true)
      longest = Math.max(longest, moves.length)
    }
    // Feeds MAX_DEPTH_123 in solver.ts: one more proves a puzzle impossible.
    expect(longest).toBe(6)
  })

  it('solves random scrambles', () => {
    const rng = seededRng(17)
    for (let i = 0; i < 20; i++) {
      const scrambled = applyMoves(SOLVED, scramble('123', 10, rng))
      expect(isSolved(applyMoves(scrambled, solve(scrambled)))).toBe(true)
    }
  })
})

describe('1x2x3 editor and validation', () => {
  it('accepts a real state and rebuilds it sticker for sticker', () => {
    // Cubies keep their array index (piece identity) through a move, while a
    // rebuilt cube lists them by slot, and sticker order follows: compare the
    // arrangements themselves, by position and sorted stickers.
    const canonical = (c: Cube) =>
      c
        .map((cubie) =>
          [
            cubie.position.join(','),
            ...cubie.stickers.map((s) => `${normalIndex(s.normal)}${s.color}`).sort(),
          ].join(' '),
        )
        .sort()
        .join(' | ')
    const scrambled = applyMoves(SOLVED, scramble('123', 10, seededRng(4)))
    const rebuilt = buildCube(cubeToEdit(scrambled), '123')
    expect(canonical(rebuilt)).toBe(canonical(scrambled))
    expect(validateCube(rebuilt)).toEqual({ ok: true })
  })

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
    expect(validateCube(flipped)).toEqual({ ok: false, error: 'impossible' })
  })
})
