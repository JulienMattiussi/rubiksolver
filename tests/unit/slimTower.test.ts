import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/cube'
import { DESCEND_CORNER, SWAP_CORNERS } from '@/lib/methods/domino'
import { SLIM_TOWER_PLAN } from '@/lib/methods/slimTower'
import { formatMoves, movesFor, scramble } from '@/lib/moves'
import { methodsFor } from '@/lib/solver'
import { buildSteps } from '@/lib/solverKit'
import { applyMoves } from '@/lib/turn'
import type { Move, Vec3 } from '@/lib/types'
import { validateCube } from '@/lib/validate'
import { seededRng, twistedCorner } from '../helpers'

const SOLVED = solvedCube('223')

/** A slim tower position as cubers name it: U/D (none on the equator), F/B, R/L. */
function nameOf([x, y, z]: Vec3): string {
  return (y > 0 ? 'U' : y < 0 ? 'D' : '') + (z > 0 ? 'F' : 'B') + (x > 0 ? 'R' : 'L')
}

/** What a formula moves, from the solved puzzle, as `from->to`. */
function effect(moves: readonly Move[]): string[] {
  return applyMoves(SOLVED, moves)
    .flatMap((c, i) => {
      const was = SOLVED[i]!
      const same =
        c.position.join() === was.position.join() &&
        c.stickers.every((s, j) => s.normal.join() === was.stickers[j]!.normal.join())
      return same ? [] : [`${nameOf(was.position)}->${nameOf(c.position)}`]
    })
    .sort()
}

describe('Slim Tower (2x2x3)', () => {
  it('turns U, D and their blocks freely, its sides by half turns only', () => {
    expect(formatMoves(movesFor('223'))).toBe("U Uw U2 Uw2 U' Uw' D Dw D2 Dw2 D' Dw' L2 R2 F2 B2")
  })

  it('takes the Domino formulas: descend swaps two equator edges along, swap is pure', () => {
    expect(effect(DESCEND_CORNER)).toContain('UFR->DFR')
    expect(effect(DESCEND_CORNER)).toContain('FL->FR')
    expect(effect(SWAP_CORNERS)).toEqual(['UBR->UFR', 'UFR->UBR'])
  })

  it('rejects a twisted corner', () => {
    expect(validateCube(twistedCorner('223'))).toEqual({ ok: false, error: 'impossible' })
  })
})

describe('Equator then corners (Slim Tower method)', () => {
  it('is the method offered for the slim tower', () => {
    expect(methodsFor('223').map((m) => m.id)).toEqual(['equatorFirst'])
  })

  it('solves scrambles, every step reaching its goal', () => {
    const rng = seededRng(29)
    for (let i = 0; i < 20; i++) {
      let state = applyMoves(SOLVED, scramble('223', 20, rng))
      for (const step of buildSteps(state, SLIM_TOWER_PLAN)) {
        state = applyMoves(state, step.moves)
        expect(SLIM_TOWER_PLAN.find((s) => s.key === step.key)!.goal(state)).toBe(true)
      }
      expect(isSolved(state)).toBe(true)
    }
  })
})
