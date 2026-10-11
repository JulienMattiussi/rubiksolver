import { cubeShape } from './cube'
import { BEGINNER_2_PLAN, OPTIMAL_2_PLAN, solveOptimal2 } from './methods/cube2'
import { DOMINO_PLAN } from './methods/domino'
import { OPTIMAL_123_PLAN } from './methods/flat123'
import { BEGINNER_PLAN, CFOP_PLAN } from './methods/layers3'
import { PETRUS_PLAN } from './methods/petrus'
import { ROUX_PLAN } from './methods/roux'
import { TOWER_PLAN } from './methods/tower'
import { ZZ_PLAN } from './methods/zz'
import { reductionPlan } from './solver4/steps'
import { buildSteps, type MethodPlan, type SolveStep } from './solverKit'
import type { Cube, CubeShape, Move } from './types'

export type { SolveStep } from './solverKit'

/**
 * The registry of solving methods: for each method, its plan on every shape
 * it supports. This is the single place a method is wired in; the store, the
 * picker and the tests only ever see `methodsFor`.
 *
 * Adding a method to a puzzle:
 *   1. write its plan (src/lib/methods/<method>.ts): a list of steps, each
 *      with its i18n key, the goal it reaches, the turns it may use and the
 *      phases that do the work (blockbuilding with `buildBlock` /
 *      `solvePieces`, algorithms with `solveWithAlgs`, catalogue in algs.ts);
 *   2. add it below, under the shapes it supports;
 *   3. name it and its steps in both languages (i18n/translations.ts).
 * `buildSteps` enforces each step's goal and turns, and the registry-wide
 * test solves scrambles with every entry, so nothing else needs touching.
 */
const SOLVE_METHODS = [
  { id: 'beginner', plans: { '2': BEGINNER_2_PLAN, '3': BEGINNER_PLAN } },
  { id: 'cfop', plans: { '3': CFOP_PLAN } },
  { id: 'roux', plans: { '3': ROUX_PLAN } },
  { id: 'petrus', plans: { '3': PETRUS_PLAN } },
  { id: 'zz', plans: { '3': ZZ_PLAN } },
  { id: 'reduction', plans: { '4': reductionPlan(BEGINNER_PLAN) } },
  { id: 'reductionCfop', plans: { '4': reductionPlan(CFOP_PLAN) } },
  { id: 'optimal', plans: { '2': OPTIMAL_2_PLAN, '123': OPTIMAL_123_PLAN } },
  { id: 'twoPockets', plans: { '224': TOWER_PLAN } },
  { id: 'cornersFirst', plans: { '332': DOMINO_PLAN } },
] as const satisfies ReadonlyArray<{
  id: string
  plans: Readonly<Partial<Record<CubeShape, MethodPlan>>>
}>

/** Identifier of an available solving method. */
export type MethodId = (typeof SOLVE_METHODS)[number]['id']

/** The solving methods available for a given shape, each bound to it. */
export function methodsFor(shape: CubeShape) {
  return SOLVE_METHODS.flatMap((m) => {
    const plan: MethodPlan | undefined = (m.plans as Partial<Record<CubeShape, MethodPlan>>)[shape]
    return plan ? [{ id: m.id as MethodId, solve: (cube: Cube) => buildSteps(cube, plan) }] : []
  })
}

/**
 * Default full solve, kept for validation and callers. Every branch throws on
 * an unsolvable cube after a bounded search, which is what validate.ts needs.
 */
export function solve(cube: Cube): Move[] {
  const shape = cubeShape(cube)
  // On a 2x2 the optimal search is the quickest to prove a cube impossible.
  if (shape === '2') return solveOptimal2(cube)
  // Otherwise the shape's first method (beginner, reduction, ...).
  const method = methodsFor(shape)[0]
  if (!method) throw new Error(`solve: no method for shape ${shape}`)
  return method.solve(cube).flatMap((s: SolveStep) => [...s.moves])
}
