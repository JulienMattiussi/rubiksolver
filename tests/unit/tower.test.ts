import { describe, expect, it } from 'vitest'
import { applyMove, applyMoves, isBoxed, isSolved, solvedCube, turnAllowed } from '@/lib/cube'
import { formatMove, invertMoves, scramble } from '@/lib/moves'
import { DESCEND, PIVOT, SWAP, TOWER_PLAN } from '@/lib/methods/tower'
import { methodsFor } from '@/lib/solver'
import { buildSteps } from '@/lib/solverKit'
import type { Cube, Move } from '@/lib/types'
import { seededRng } from '../helpers'

const SOLVED = solvedCube('224')

/** Play a formula, checking the tower lets every turn of it through. */
function play(moves: readonly Move[], from: Cube = SOLVED): Cube {
  return moves.reduce((cube, move) => {
    expect(turnAllowed(cube, move)).toBe(true)
    return applyMove(cube, move)
  }, from)
}

/** Positions of the pieces a formula moved or turned, as `from->to`. */
function changes(cube: Cube): string[] {
  return cube.flatMap((c, i) => {
    const was = SOLVED[i]!
    const same =
      c.position.join() === was.position.join() &&
      c.stickers.every((s, j) => s.normal.join() === was.stickers[j]!.normal.join())
    return same ? [] : [`${was.position.join(',')}->${c.position.join(',')}`]
  })
}

describe('tower formulas (from fan2cube.fr)', () => {
  it('pivot lays the two front top bars down, and only them', () => {
    const cube = play(PIVOT)
    expect(isBoxed(cube)).toBe(false)
    // Two corners lie sideways; their middle pieces turn with them, in place.
    expect(changes(cube).sort()).toEqual(
      ['-1,1,1->-1,1,1', '-1,3,1->-3,1,1', '1,1,1->1,1,1', '1,3,1->3,1,1'].sort(),
    )
    // Played backwards, it stands them up again.
    expect(isSolved(play(invertMoves(PIVOT), cube))).toBe(true)
  })

  it('swap exchanges two top-right corners and nothing else', () => {
    expect(changes(play(SWAP)).sort()).toEqual(['1,3,-1->1,3,1', '1,3,1->1,3,-1'])
  })

  it('descend brings a top corner down, flipping the inner front half: hence 2 by 2', () => {
    const once = play(DESCEND)
    expect(changes(once)).toContain('1,3,1->1,-3,1')
    expect(changes(once).some((c) => c.startsWith('1,1,1'))).toBe(true)
    // A second descent, whatever the setup turn of U, puts the middles back.
    const twice = play([...DESCEND, { face: 'U', amount: 1 }, ...DESCEND])
    expect(changes(twice).every((c) => c.split('->')[0]!.split(',')[1]!.match(/^-?3$/))).toBe(true)
  })
})

describe('Two Pockets tower method', () => {
  it('is the method offered for the tower', () => {
    expect(methodsFor('224').map((m) => m.id)).toEqual(['twoPockets'])
  })

  it('declares its move sets: wide turns, then inner, then outer layers', () => {
    expect(TOWER_PLAN.map((s) => s.moves.generators.map((m) => formatMove(m)).join(' '))).toEqual([
      'Uw Dw Rw Fw',
      'Uw Dw Rw2 Fw2',
      'U D Rw2 Fw2',
    ])
  })

  it('solves scrambled towers, every step reaching its goal with legal turns', () => {
    const rng = seededRng(77)
    for (let i = 0; i < 20; i++) {
      let state = applyMoves(SOLVED, scramble('224', 40, rng))
      for (const step of buildSteps(state, TOWER_PLAN)) {
        state = play(step.moves, state)
        expect(TOWER_PLAN.find((s) => s.key === step.key)!.goal(state)).toBe(true)
      }
      expect(isSolved(state)).toBe(true)
    }
  }, 120000)
})
