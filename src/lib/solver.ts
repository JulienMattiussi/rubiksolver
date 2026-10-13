import { cubeShape } from './cube'
import { BEGINNER_2_PLAN, OPTIMAL_2_PLAN, solveOptimal2 } from './methods/cube2'
import { DOMINO_PLAN } from './methods/domino'
import { optimalPlan } from './methods/exhaustive'
import { FLOPPY_PLAN } from './methods/floppy'
import { GHOST_PLAN } from './methods/ghost'
import { BEGINNER_PLAN, CFOP_PLAN } from './methods/layers3'
import { PETRUS_PLAN } from './methods/petrus'
import { PYRAMINX_PLAN, TETRAMINX_PLAN } from './methods/pyraminx'
import { PYRAMINX4_PLAN } from './methods/pyraminx4'
import { PYRAMINX5_PLAN } from './methods/pyraminx5'
import { JING_PLAN } from './methods/jing'
import { MORPH_PLAN } from './methods/morph'
import { OCT4_PLAN } from './methods/oct4'
import { GEM_PLAN, VTO_PLAN } from './methods/vto'
import { RAINBOW_PLAN } from './methods/rainbow'
import { GEAR_PLAN, GEAR_ULTIMATE_PLAN } from './methods/gear'
import { DINO_PLAN } from './methods/dino'
import { REX_PLAN } from './methods/rex'
import { GEAR_EXTREME_PLAN } from './methods/gearExtreme'
import { VIOLET_OPTIMAL_PLAN, VIOLET_SHAPE_FIRST_PLAN } from './methods/violet'
import { withCentersHome } from './methods/recenter'
import { ROUX_PLAN } from './methods/roux'
import { SLIM_TOWER_PLAN } from './methods/slimTower'
import { STAR_PLAN } from './methods/starPrism'
import { STAR4_PLAN } from './methods/starPrism4'
import { TOWER_PLAN } from './methods/tower'
import { ZZ_PLAN } from './methods/zz'
import { reductionPlan } from './solver4/steps'
import { reduction5Plan } from './solver5/steps'
import { buildSteps, planOutline, type MethodPlan, type SolveStep } from './solverKit'
import type { Cube, CubeShape, Turn } from './types'

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
  { id: 'beginner', plans: { '2': BEGINNER_2_PLAN, '3': withCentersHome(BEGINNER_PLAN) } },
  { id: 'cfop', plans: { '3': withCentersHome(CFOP_PLAN) } },
  { id: 'roux', plans: { '3': withCentersHome(ROUX_PLAN) } },
  { id: 'petrus', plans: { '3': withCentersHome(PETRUS_PLAN) } },
  { id: 'zz', plans: { '3': withCentersHome(ZZ_PLAN) } },
  {
    id: 'reduction',
    plans: { '4': reductionPlan(BEGINNER_PLAN), '5': reduction5Plan(BEGINNER_PLAN) },
  },
  {
    id: 'reductionCfop',
    plans: { '4': reductionPlan(CFOP_PLAN), '5': reduction5Plan(CFOP_PLAN) },
  },
  { id: 'twoPockets', plans: { '224': TOWER_PLAN } },
  { id: 'equatorFirst', plans: { '223': SLIM_TOWER_PLAN } },
  { id: 'centersFirst', plans: { pyra: PYRAMINX_PLAN, tetra: TETRAMINX_PLAN } },
  { id: 'wingsFirst', plans: { pyra4: PYRAMINX4_PLAN, pyra5: PYRAMINX5_PLAN } },
  { id: 'jingCornersFirst', plans: { jing: JING_PLAN } },
  { id: 'asPocket', plans: { morph: MORPH_PLAN } },
  { id: 'octCornersFirst', plans: { oct4: OCT4_PLAN } },
  { id: 'vtoCentersFirst', plans: { vto: VTO_PLAN } },
  { id: 'gemCentersFirst', plans: { gem: GEM_PLAN } },
  { id: 'extendedTriangle', plans: { rainbow: RAINBOW_PLAN } },
  { id: 'dinoLayers', plans: { dino: DINO_PLAN } },
  { id: 'rexEdgesFirst', plans: { rex: REX_PLAN } },
  { id: 'gearCornersFirst', plans: { gearCube: GEAR_PLAN, gearU: GEAR_ULTIMATE_PLAN } },
  { id: 'gearEquatorFirst', plans: { gearX: GEAR_EXTREME_PLAN } },
  { id: 'shapeFirst', plans: { violet: VIOLET_SHAPE_FIRST_PLAN } },
  { id: 'isolateFirst', plans: { star: STAR_PLAN } },
  { id: 'twoStars', plans: { star4: STAR4_PLAN } },
  { id: 'cornersFirst', plans: { '332': DOMINO_PLAN, '331': FLOPPY_PLAN, ghost: GHOST_PLAN } },
  {
    id: 'optimal',
    plans: {
      '2': OPTIMAL_2_PLAN,
      '123': optimalPlan('123'),
      '331': optimalPlan('331'),
      ghost: optimalPlan('ghost'),
      violet: VIOLET_OPTIMAL_PLAN,
    },
  },
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
    return plan
      ? [
          {
            id: m.id as MethodId,
            solve: (cube: Cube) => buildSteps(cube, plan),
            outline: planOutline(plan),
          },
        ]
      : []
  })
}

/** Every layer the shape's methods turn (their steps' move sets): the
 *  notation a solution may show, beyond the pad's turns (M on a 3x3). */
export function methodTurns(shape: CubeShape): Turn[] {
  return SOLVE_METHODS.flatMap((m) => {
    const plan: MethodPlan | undefined = (m.plans as Partial<Record<CubeShape, MethodPlan>>)[shape]
    return (plan ?? []).flatMap((step) => step.moves.generators)
  })
}

/**
 * Default full solve, kept for validation and callers. Every branch throws on
 * an unsolvable cube after a bounded search, which is what validate.ts needs.
 */
export function solve(cube: Cube): Turn[] {
  const shape = cubeShape(cube)
  // On a 2x2 the optimal search is the quickest to prove a cube impossible.
  if (shape === '2') return solveOptimal2(cube)
  // Otherwise the shape's first method (beginner, reduction, ...).
  const method = methodsFor(shape)[0]
  if (!method) throw new Error(`solve: no method for shape ${shape}`)
  return method.solve(cube).flatMap((s: SolveStep) => [...s.moves])
}
