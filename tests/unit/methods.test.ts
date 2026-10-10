import { describe, expect, it } from 'vitest'
import { applyMoves, isSolved, solvedCube } from '@/lib/cube'
import { LOCALES } from '@/i18n/translations'
import { formatMove, formatMoves, scramble } from '@/lib/moves'
import { moveSet, OUTER_TURNS } from '@/lib/moveSet'
import { PETRUS_PLAN } from '@/lib/methods/petrus'
import { ROUX_PLAN } from '@/lib/methods/roux'
import { ZZ_PLAN } from '@/lib/methods/zz'
import { methodsFor } from '@/lib/solver'
import { buildSteps, type MethodPlan, type SolveStep } from '@/lib/solverKit'
import type { CubeShape, Move } from '@/lib/types'
import { seededRng } from '../helpers'

const DIMS_3 = [3, 3, 3] as const

/** The allowed turns of each step of a plan, as notation. */
function allowedOf(plan: MethodPlan): string[] {
  return plan.map((spec) =>
    spec.moves.generators.map((m) => formatMove(m, undefined, DIMS_3)).join(' '),
  )
}

/** Solve `count` seeded scrambles with a plan, checking every step's goal. */
function solveScrambles(plan: MethodPlan, count: number, seed: number): SolveStep[][] {
  const rng = seededRng(seed)
  return Array.from({ length: count }, () => {
    let state = applyMoves(solvedCube('3'), scramble('3', 25, rng))
    const steps = buildSteps(state, plan)
    for (const step of steps) {
      state = applyMoves(state, step.moves)
      expect(plan.find((s) => s.key === step.key)!.goal(state)).toBe(true)
    }
    expect(isSolved(state)).toBe(true)
    return steps
  })
}

const isQuarterFB = (m: Move) => !m.depth && (m.face === 'F' || m.face === 'B') && m.amount !== 2

describe('method registry', () => {
  it('offers Roux, Petrus and ZZ on the 3x3 only', () => {
    const ids = (shape: CubeShape) => methodsFor(shape).map((m) => m.id)
    expect(ids('3')).toEqual(['beginner', 'cfop', 'roux', 'petrus', 'zz'])
    for (const shape of ['2', '4', '123'] as const) {
      expect(ids(shape)).not.toContain('roux')
    }
  })

  it('names every method and step in both languages', () => {
    const shapes: CubeShape[] = ['2', '3', '4', '123', '224', '332']
    for (const locale of Object.values(LOCALES)) {
      for (const shape of shapes) {
        for (const method of methodsFor(shape)) {
          expect(locale.methods[method.id].name).toBeTruthy()
        }
      }
    }
    for (const plan of [ROUX_PLAN, PETRUS_PLAN, ZZ_PLAN]) {
      for (const { key } of plan) {
        for (const locale of Object.values(LOCALES)) {
          expect((locale.steps as Record<string, string>)[key]).toBeTruthy()
        }
      }
    }
  })
})

describe('buildSteps enforces the step contract', () => {
  const cube = applyMoves(solvedCube('3'), [{ face: 'R', amount: 1 }])

  it('rejects a turn outside the step move set', () => {
    const plan: MethodPlan = [
      { key: 'x', goal: isSolved, moves: moveSet('U'), phases: [() => [{ face: 'R', amount: 3 }]] },
    ]
    expect(() => buildSteps(cube, plan)).toThrow(/not an allowed turn/)
  })

  it('rejects a step stopping short of its goal', () => {
    const plan: MethodPlan = [{ key: 'x', goal: isSolved, moves: OUTER_TURNS, phases: [() => []] }]
    expect(() => buildSteps(cube, plan)).toThrow(/goal not reached/)
  })

  it('exposes the restricted move set on the step, and only then', () => {
    const plan: MethodPlan = [
      {
        key: 'a',
        goal: () => true,
        moves: OUTER_TURNS,
        phases: [() => [{ face: 'R', amount: 3 }]],
      },
    ]
    expect(buildSteps(cube, plan)[0]!.allowed).toBeUndefined()
    const [step] = buildSteps(cube, [{ ...plan[0]!, moves: moveSet('R U') }])
    expect(formatMoves(step!.allowed!)).toBe('R U')
  })
})

describe('Roux', () => {
  it('declares its move sets: <U,R,M,r> second block, <M,U> last six edges', () => {
    expect(allowedOf(ROUX_PLAN)).toEqual([
      'U D L R F B M',
      'U R M Rw',
      'U D L R F B',
      'M U',
      'M U',
      'M U2',
    ])
  })

  it('solves scrambles, every step reaching its goal within its moves', () => {
    for (const steps of solveScrambles(ROUX_PLAN, 25, 101)) {
      expect(steps.map((s) => s.key)).toContain('stepCMLL')
      // The last six edges really are M and U only.
      const lse = steps.filter((s) => s.key.startsWith('stepLSE')).flatMap((s) => s.moves)
      expect(lse.every((m) => m.face === 'U' || (m.face === 'L' && m.depth === 2))).toBe(true)
    }
  }, 120000)
})

describe('Petrus', () => {
  it('declares its move sets: <U,R,F> extension, <R,U> F2L', () => {
    expect(allowedOf(PETRUS_PLAN)).toEqual([
      'U D L R F B',
      'U R F',
      'U R F B',
      'R U',
      'U D L R F B',
      'U D L R F B',
      'U D L R F B',
    ])
  })

  it('solves scrambles, every step reaching its goal within its moves', () => {
    for (const steps of solveScrambles(PETRUS_PLAN, 25, 202)) {
      const f2l = steps.find((s) => s.key === 'stepF2LRU')
      expect(f2l?.moves.every((m) => m.face === 'R' || m.face === 'U') ?? true).toBe(true)
    }
  }, 120000)
})

describe('ZZ', () => {
  it('declares its move sets: <L,U,R> then <R,U> blocks', () => {
    expect(allowedOf(ZZ_PLAN)).toEqual([
      'U D L R F B',
      'L U R',
      'R U',
      'U D L R F B',
      'U D L R F B',
    ])
  })

  it('never turns F or B a quarter turn during the F2L, after EOLine', () => {
    for (const steps of solveScrambles(ZZ_PLAN, 25, 303)) {
      const blocks = steps.filter((s) => s.key === 'stepLeftBlock' || s.key === 'stepRightBlock')
      expect(blocks.flatMap((s) => s.moves).some(isQuarterFB)).toBe(false)
    }
  }, 120000)
})
