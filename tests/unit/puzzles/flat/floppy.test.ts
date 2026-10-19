import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube, stateKey } from '@/lib/core/cube'
import { emptyEdit, slotsFor } from '@/lib/editor/edit'
import { FLIP_EDGES } from '@/lib/methods/flat/floppy'
import { solveExhaustively } from '@/lib/solve/exhaustive'
import { formatMoves, movesFor } from '@/lib/core/moves'
import { methodsFor } from '@/lib/solve/solver'
import { applyMove, applyMoves } from '@/lib/core/turn'
import type { Cube } from '@/lib/core/types'
import { validateCube } from '@/lib/editor/validate'
import { twistedCorner } from '../../../helpers'

const SOLVED = solvedCube('331')

/** Every reachable state with its distance from solved. */
function stateSpace(): Map<string, { cube: Cube; depth: number }> {
  const seen = new Map([[stateKey(SOLVED), { cube: SOLVED, depth: 0 }]])
  let frontier: Cube[] = [SOLVED]
  for (let depth = 1; frontier.length; depth++) {
    const next: Cube[] = []
    for (const cube of frontier) {
      for (const move of movesFor('331')) {
        const turned = applyMove(cube, move)
        const key = stateKey(turned)
        if (seen.has(key)) continue
        seen.set(key, { cube: turned, depth })
        next.push(turned)
      }
    }
    frontier = next
  }
  return seen
}

describe('Floppy (3x3x1)', () => {
  it('turns its sides by half turns only, and never U nor D', () => {
    expect(formatMoves(movesFor('331'))).toBe('L2 R2 F2 B2')
  })

  it('has 192 states, all within 8 turns (as fan2cube.fr counts them)', () => {
    const space = stateSpace()
    expect(space.size).toBe(192)
    expect(Math.max(...[...space.values()].map((s) => s.depth))).toBe(8)
  })

  it('solves every state optimally', () => {
    for (const { cube, depth } of stateSpace().values()) {
      const moves = solveExhaustively(cube, 9)
      expect(moves).toHaveLength(depth)
      expect(isSolved(applyMoves(cube, moves))).toBe(true)
    }
  })

  it('keeps its fixed center pre-filled in the editor', () => {
    const edit = emptyEdit('331')
    expect(Object.keys(edit)).toHaveLength(2)
    expect(slotsFor('331').filter((s) => s.paintable)).toHaveLength(8)
  })

  it('rejects a twisted corner', () => {
    expect(validateCube(twistedCorner('331'))).toMatchObject({ ok: false, error: 'impossible' })
  })
})

describe('Corners then edges (Floppy method)', () => {
  it('flips the front and right edges with (F2 R2)3, nothing else', () => {
    const flipped = applyMoves(SOLVED, FLIP_EDGES)
    const changed = flipped.flatMap((c, i) =>
      c.stickers.every((s, j) => s.normal.join() === SOLVED[i]!.stickers[j]!.normal.join())
        ? []
        : [c.position.join(',')],
    )
    expect(changed.sort()).toEqual(['0,0,1', '1,0,0'])
  })

  it('is offered first, before the optimal search', () => {
    expect(methodsFor('331').map((m) => m.id)).toEqual(['cornersFirst', 'optimal'])
  })
})
