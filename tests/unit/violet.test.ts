import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/cube'
import { formatMove, movesFor } from '@/lib/moves'
import { applyMove, applyMoves, turnAllowed } from '@/lib/turn'
import type { Cube } from '@/lib/types'

const SOLVED = solvedCube('violet')

/** What one sees of a state: where the big and the mini cubes stand
 *  (pieces of a kind are alike). */
const look = (cube: Cube) =>
  cube
    .map((c) => `${Math.abs(c.position[0]) % 2}:${c.position.join()}`)
    .sort()
    .join(' ')

describe('Violet', () => {
  it('is 7 big cubes and the 8 minis of A, one hidden: its core', () => {
    const bigs = SOLVED.filter((c) => c.position.every((v) => Math.abs(v) % 2 === 1))
    expect(bigs).toHaveLength(7)
    expect(bigs.every((c) => c.stickers.length === 3)).toBe(true)
    const core = SOLVED.find((c) => c.position.every((v) => v === 0))!
    expect(core.stickers).toHaveLength(0)
  })

  it('turns, solved, only the three faces away from A', () => {
    const faces = new Set(
      movesFor('violet')
        .filter((m) => turnAllowed(SOLVED, m))
        .map((m) => m.face),
    )
    expect([...faces].sort()).toEqual(['B', 'D', 'L'])
  })

  it('leaves its box with any turn, and comes back with four', () => {
    const L = { face: 'L', amount: 1 } as const
    const once = applyMove(SOLVED, L)
    expect(isSolved(once)).toBe(false)
    // A face jams once a big cube straddles its cut: D no longer turns.
    expect(turnAllowed(once, { face: 'D', amount: 1 })).toBe(false)
    expect(isSolved(applyMoves(SOLVED, [L, L, L, L]))).toBe(true)
  })

  it('takes 1160 shapes, none of them stuck, 13 turns apart at most', () => {
    const moves = movesFor('violet')
    const seen = new Set([look(SOLVED)])
    let frontier = [SOLVED]
    let depth = 0
    while (frontier.length) {
      const next: Cube[] = []
      for (const state of frontier) {
        const allowed = moves.filter((m) => turnAllowed(state, m))
        expect(allowed.length).toBeGreaterThan(0)
        for (const m of allowed) {
          const after = applyMove(state, m)
          if (seen.has(look(after))) continue
          seen.add(look(after))
          // Back in its box is back to the cube: there is only one.
          expect(isSolved(after)).toBe(false)
          next.push(after)
        }
      }
      frontier = next
      if (next.length) depth++
    }
    expect(seen.size).toBe(1160)
    expect(depth).toBe(13)
  })

  it('is written like a cube', () => {
    expect(formatMove({ face: 'L', amount: 3 })).toBe("L'")
  })
})
