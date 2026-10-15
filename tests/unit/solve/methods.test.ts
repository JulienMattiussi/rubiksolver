import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { applyMoves } from '@/lib/core/turn'
import { formatMove, scramble } from '@/lib/core/moves'
import { moveSet, OUTER_TURNS } from '@/lib/core/moveSet'
import { PETRUS_PLAN } from '@/lib/methods/standard/petrus'
import { ROUX_PLAN } from '@/lib/methods/standard/roux'
import { ZZ_PLAN } from '@/lib/methods/standard/zz'
import { methodsFor } from '@/lib/solve/solver'
import { buildSteps, type MethodPlan, type SolveStep } from '@/lib/solve/solverKit'
import { CUBE_CATEGORIES, CUBE_KINDS, cubeCategory, cubeKindId } from '@/lib/core/types'
import type { CubeShape, Move } from '@/lib/core/types'
import { seededRng } from '../../helpers'

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
  it('outlines each method before solving: its steps, the skippable ones marked', () => {
    const outline = (shape: CubeShape, id: string) =>
      methodsFor(shape)
        .find((m) => m.id === id)!
        .outline.map((s) => `${s.key}${s.optional ? '?' : ''}`)
    expect(outline('3', 'roux')[0]).toBe('stepRecenter?')
    expect(outline('3', 'roux')).toContain('stepLSEMiddle')
    expect(outline('4', 'reduction').slice(0, 3)).toEqual([
      'stepCenters',
      'stepPairEdges',
      'stepParity?',
    ])
  })

  it('offers Roux, Petrus and ZZ on the 3x3 only', () => {
    const ids = (shape: CubeShape) => methodsFor(shape).map((m) => m.id)
    expect(ids('3')).toEqual(['beginner', 'cfop', 'roux', 'petrus', 'zz'])
    for (const shape of ['2', '4', '123'] as const) {
      expect(ids(shape)).not.toContain('roux')
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
      const lse = steps.filter((s) => s.key.startsWith('stepLSE')).flatMap((s) => s.moves as Move[])
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
      expect(
        (f2l?.moves as Move[] | undefined)?.every((m) => m.face === 'R' || m.face === 'U') ?? true,
      ).toBe(true)
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
      expect(blocks.flatMap((s) => s.moves as Move[]).some(isQuarterFB)).toBe(false)
    }
  }, 120000)
})

describe('cube picker', () => {
  it('groups the puzzles: cubes, mirrors, other cuboids, flat ones', () => {
    const groups = Object.fromEntries(
      CUBE_CATEGORIES.map((category) => [
        category,
        CUBE_KINDS.filter((kind) => cubeCategory(kind) === category).map(cubeKindId),
      ]),
    )
    expect(groups).toEqual({
      standard: ['2', '3', '4', '5', '6', 'super4', 'super5'],
      mirror: ['2m', '3m', '4m'],
      tower: ['223', '224', '234', '332', '334', '443', '445', '554', 'camo'],
      flat: ['123', '331', 'ghost'],
      pyramid: ['pyra', 'tetra', 'pyra4', 'pyra5', 'jing', 'morph', 'mmorph'],
      polyhedron: ['oct4', 'vto', 'gem', 'fto', 'rainbow', 'megaminx', 'crystal', 'skewbU'],
      round: ['dinoCyl', 'puck', 'barrel', 'star', 'star4'],
      gear: ['gearCube', 'gearU', 'gearX'],
      diagonal: ['dino', 'skewb', 'masterSkewb', 'copter', 'copter3', 'rex', 'fisher', 'windmill'],
      holey: ['holey', 'void', 'tori', 'edge'],
      twisted: ['purple', 'twist', 'quarter', 'latch', 'fashion'],
      bandaged: [
        'bigBlock',
        'squarebik',
        'quadStripe',
        'detour',
        'fused',
        'diamond',
        'bandage',
        'quad',
        'stripe',
        'fusedStripe',
        'alcatraz',
        'ai',
        'roadblock',
      ],
    })
  })
})
