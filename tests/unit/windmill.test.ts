import { describe, expect, it } from 'vitest'
import { cubeShape, isSolved, solvedCube } from '@/lib/cube'
import { CENTER_TURN } from '@/lib/methods/fisher'
import { parseMoves } from '@/lib/moves'
import { applyMoves } from '@/lib/turn'

const SOLVED = solvedCube('windmill')
const played = (moves: string) => applyMoves(SOLVED, parseMoves(moves))

describe('Windmill', () => {
  it('is a 3x3 of its own, its side centers marked', () => {
    expect(cubeShape(SOLVED)).toBe('windmill')
    expect(cubeShape(solvedCube('fisher'))).toBe('fisher')
  })

  it('shows a side center turned by (H)+(G)- (fan2cube.fr), a half turn too', () => {
    // A rectangle cut in a slanting side: turned, even a half turn, it
    // sticks out.
    expect(isSolved(played(CENTER_TURN))).toBe(false)
    expect(isSolved(played(`${CENTER_TURN} ${CENTER_TURN}`))).toBe(false)
    expect(isSolved(played(Array(4).fill(CENTER_TURN).join(' ')))).toBe(true)
  })

  it('shows a middle edge turned over, which a Fisher Cube hides', () => {
    // The edge at (1, 0, 1) turned over in place: its two colors swapped.
    const flipped = (cube: typeof SOLVED) =>
      cube.map((c) =>
        c.position.join() === '1,0,1'
          ? {
              ...c,
              stickers: c.stickers.map((s, k) => ({ ...s, normal: c.stickers[1 - k]!.normal })),
            }
          : c,
      )
    expect(isSolved(flipped(SOLVED))).toBe(false)
    expect(isSolved(flipped(solvedCube('fisher')))).toBe(true)
  })
})
