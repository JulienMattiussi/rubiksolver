import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube, stateKey } from '@/lib/core/cube'
import { emptyEdit, slotsFor } from '@/lib/editor/edit'
import { CORNER_FORMULAS, FLIP_EDGES } from '@/lib/methods/flat/floppy'
import { solveExhaustively } from '@/lib/solve/exhaustive'
import { movesFor } from '@/lib/core/moves'
import { formatMoves } from '@/lib/core/notation'
import { methodsFor } from '@/lib/solve/solver'
import { applyMove, applyMoves } from '@/lib/core/turn'
import type { Cube, Move } from '@/lib/core/types'
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

  it('is offered after its manual method, before the optimal search', () => {
    expect(methodsFor('331').map((m) => m.id)).toEqual([
      'floppyEdgesFirst',
      'cornersFirst',
      'optimal',
    ])
  })
})

/** The places whose piece a formula moves or turns, from solved. */
function changedBy(moves: readonly Move[]): string[] {
  const after = applyMoves(SOLVED, moves)
  return after
    .flatMap((c, i) => (stateKey([c]) === stateKey([SOLVED[i]!]) ? [] : [c.position.join(',')]))
    .sort()
}

/** Where the piece of the front right corner comes from. */
const comesFrom = (moves: readonly Move[]) =>
  SOLVED[applyMoves(SOLVED, moves).findIndex((c) => c.position.join() === '1,0,1')]!.position.join()

describe('Edges then corners (Floppy manual method)', () => {
  it('cycles three corners with each formula of its manual, the edges left', () => {
    expect(CORNER_FORMULAS.map(changedBy)).toEqual([
      ['-1,0,1', '1,0,-1', '1,0,1'],
      ['-1,0,-1', '-1,0,1', '1,0,1'],
      ['-1,0,1', '1,0,-1', '1,0,1'],
      ['-1,0,-1', '1,0,-1', '1,0,1'],
      ['-1,0,-1', '1,0,-1', '1,0,1'],
    ])
    // The first corner from the front left, the back left, the back right;
    // the second from the back right or the back left.
    expect(CORNER_FORMULAS.map(comesFrom)).toEqual([
      '-1,0,1',
      '-1,0,-1',
      '1,0,-1',
      '1,0,-1',
      '-1,0,-1',
    ])
  })

  it('solves every state: a half turn per flipped edge, then a formula per corner', () => {
    const method = methodsFor('331').find((m) => m.id === 'floppyEdgesFirst')!
    for (const { cube } of stateSpace().values()) {
      const steps = method.solve(cube)
      const cross = steps.find((s) => s.key === 'stepTutorialFloppyCross')
      const corners = steps.find((s) => s.key === 'stepTutorialFloppyCycle')
      expect(cross?.moves.length ?? 0).toBeLessThanOrEqual(4)
      expect(corners?.moves.length ?? 0).toBeLessThanOrEqual(8)
    }
  })
})
