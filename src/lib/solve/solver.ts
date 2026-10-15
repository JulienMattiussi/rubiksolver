import { cubeShape } from '../core/cube'
import { BEGINNER_2_PLAN, OPTIMAL_2_PLAN, solveOptimal2 } from '../methods/standard/cube2'
import { DOMINO_PLAN } from '../methods/tower/domino'
import { optimalPlan } from './exhaustive'
import { FLOPPY_PLAN } from '../methods/flat/floppy'
import { GHOST_PLAN } from '../methods/flat/ghost'
import { BARREL_PLAN } from '../methods/round/barrel'
import { BEGINNER_PLAN, CFOP_PLAN } from '../methods/standard/layers3'
import { twistPlan } from '../methods/twisted/twist'
import { fisherPlan } from '../methods/diagonal/fisher'
import { mmorphPlan } from '../methods/pyramid/mmorph'
import { TORI_PLAN } from '../methods/holey/tori'
import { PUCK_PLAN } from '../methods/round/puck'
import { EDGE_ONLY_PLAN } from '../methods/holey/edgeOnly'
import { VOID_CUBE_PLAN } from '../methods/holey/voidCube'
import { COPTER3_PLAN, COPTER_PLAN } from '../methods/diagonal/copter'
import { LATCH_PLAN } from '../methods/twisted/latch'
import { voidPlan } from '../methods/holey/voidFrames'
import { CAMO_PLAN } from '../methods/tower/camo'
import { QUARTER_PLAN } from '../methods/twisted/quarter'
import { AI_PLAN } from '../methods/bandaged/ai'
import { ROADBLOCK_PLAN } from '../methods/bandaged/roadblock'
import { BIG_BLOCK_PLAN } from '../methods/bandaged/bigBlock'
import { FUSED_PLAN } from '../methods/bandaged/fused'
import { SQUAREBIK_PLAN } from '../methods/bandaged/squarebik'
import { ALCATRAZ_PLAN } from '../methods/bandaged/alcatraz'
import { BANDAGE_PLAN } from '../methods/bandaged/bandage'
import { DETOUR_PLAN } from '../methods/bandaged/detour'
import { DIAMOND_PLAN } from '../methods/bandaged/diamond'
import { FUSED_STRIPE_PLAN } from '../methods/bandaged/fusedStripe'
import { QUAD_PLAN } from '../methods/bandaged/quad'
import { QUAD_STRIPE_PLAN } from '../methods/bandaged/quadStripe'
import { STRIPE_PLAN } from '../methods/bandaged/stripe'
import { PETRUS_PLAN } from '../methods/standard/petrus'
import { PYRAMINX_PLAN, TETRAMINX_PLAN } from '../methods/pyramid/pyraminx'
import { PYRAMINX4_PLAN } from '../methods/pyramid/pyraminx4'
import { PYRAMINX5_PLAN } from '../methods/pyramid/pyraminx5'
import { JING_PLAN } from '../methods/pyramid/jing'
import { MORPH_PLAN } from '../methods/pyramid/morph'
import { OCT4_PLAN } from '../methods/polyhedron/oct4'
import { GEM_PLAN, VTO_PLAN } from '../methods/polyhedron/vto'
import { RAINBOW_PLAN } from '../methods/polyhedron/rainbow'
import { CRYSTAL_PLAN, MEGAMINX_PLAN } from '../methods/polyhedron/megaminx'
import { GEAR_PLAN, GEAR_ULTIMATE_PLAN } from '../methods/gear/gear'
import { DINO_PLAN } from '../methods/diagonal/dino'
import { DINO_CYL_PLAN } from '../methods/round/dinoCyl'
import { REX_PLAN } from '../methods/diagonal/rex'
import { FTO_PLAN } from '../methods/polyhedron/fto'
import { SKEWB_U_PLAN } from '../methods/polyhedron/skewbU'
import { SKEWB_PLAN } from '../methods/diagonal/skewb'
import { MASTER_SKEWB_PLAN } from '../methods/diagonal/masterSkewb'
import { TOWER334_PLAN } from '../methods/tower/tower334'
import { TOWER443_PLAN, TOWER445_PLAN } from '../methods/tower/tower44'
import { TOWER554_PLAN } from '../methods/tower/tower554'
import { TOWER234_PLAN } from '../methods/tower/tower234'
import { GEAR_EXTREME_PLAN } from '../methods/gear/gearExtreme'
import { PURPLE_OPTIMAL_PLAN, PURPLE_SHAPE_FIRST_PLAN } from '../methods/twisted/purple'
import { withCentersHome } from '../methods/standard/recenter'
import { ROUX_PLAN } from '../methods/standard/roux'
import { SLIM_TOWER_PLAN } from '../methods/tower/slimTower'
import { STAR_PLAN } from '../methods/round/starPrism'
import { STAR4_PLAN } from '../methods/round/starPrism4'
import { TOWER_PLAN } from '../methods/tower/tower'
import { ZZ_PLAN } from '../methods/standard/zz'
import { reductionPlan } from '../methods/standard/solver4/steps'
import { reduction5Plan } from '../methods/standard/solver5/steps'
import { super4Plan, super5Plan } from '../methods/standard/superCube'
import { reduction6Plan } from '../methods/standard/solver6/steps'
import { buildSteps, planOutline, type MethodPlan, type SolveStep } from './solverKit'
import type { Cube, CubeShape, Turn } from '../core/types'

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
  // The Barrel's layer by layer, its middle edges' way round unseen.
  { id: 'barrelLayers', plans: { barrel: BARREL_PLAN } },
  {
    id: 'beginner',
    plans: {
      '2': BEGINNER_2_PLAN,
      '3': withCentersHome(BEGINNER_PLAN),
      void: voidPlan(BEGINNER_PLAN),
      twist: twistPlan(BEGINNER_PLAN),
      fisher: fisherPlan(withCentersHome(BEGINNER_PLAN)),
      windmill: fisherPlan(withCentersHome(BEGINNER_PLAN)),
      mmorph: mmorphPlan(withCentersHome(BEGINNER_PLAN)),
      fused: FUSED_PLAN,
      squarebik: SQUAREBIK_PLAN,
    },
  },
  {
    id: 'cfop',
    plans: {
      '3': withCentersHome(CFOP_PLAN),
      void: voidPlan(CFOP_PLAN),
      twist: twistPlan(CFOP_PLAN),
      barrel: CFOP_PLAN,
      fisher: fisherPlan(withCentersHome(CFOP_PLAN)),
      windmill: fisherPlan(withCentersHome(CFOP_PLAN)),
      mmorph: mmorphPlan(withCentersHome(CFOP_PLAN)),
    },
  },
  { id: 'roux', plans: { '3': withCentersHome(ROUX_PLAN), void: voidPlan(ROUX_PLAN) } },
  {
    id: 'petrus',
    plans: {
      '3': withCentersHome(PETRUS_PLAN),
      void: voidPlan(PETRUS_PLAN),
      twist: twistPlan(PETRUS_PLAN),
      barrel: PETRUS_PLAN,
      fisher: fisherPlan(withCentersHome(PETRUS_PLAN)),
      windmill: fisherPlan(withCentersHome(PETRUS_PLAN)),
      mmorph: mmorphPlan(withCentersHome(PETRUS_PLAN)),
    },
  },
  {
    id: 'zz',
    plans: {
      '3': withCentersHome(ZZ_PLAN),
      void: voidPlan(ZZ_PLAN),
      twist: twistPlan(ZZ_PLAN),
      barrel: ZZ_PLAN,
      fisher: fisherPlan(withCentersHome(ZZ_PLAN)),
      windmill: fisherPlan(withCentersHome(ZZ_PLAN)),
      mmorph: mmorphPlan(withCentersHome(ZZ_PLAN)),
    },
  },
  {
    id: 'reduction',
    plans: {
      '4': reductionPlan(BEGINNER_PLAN),
      super4: super4Plan(reductionPlan(BEGINNER_PLAN)),
      '5': reduction5Plan(BEGINNER_PLAN),
      super5: super5Plan(reduction5Plan(BEGINNER_PLAN)),
      '6': reduction6Plan(BEGINNER_PLAN),
    },
  },
  {
    id: 'reductionCfop',
    plans: {
      '4': reductionPlan(CFOP_PLAN),
      super4: super4Plan(reductionPlan(CFOP_PLAN)),
      '5': reduction5Plan(CFOP_PLAN),
      super5: super5Plan(reduction5Plan(CFOP_PLAN)),
      '6': reduction6Plan(CFOP_PLAN),
    },
  },
  { id: 'twoPockets', plans: { '224': TOWER_PLAN } },
  { id: 'tower234Steps', plans: { '234': TOWER234_PLAN } },
  { id: 'doubleDomino', plans: { '334': TOWER334_PLAN } },
  {
    id: 'towerReduction',
    plans: { '443': TOWER443_PLAN, '445': TOWER445_PLAN, '554': TOWER554_PLAN },
  },
  { id: 'camoReduction', plans: { camo: CAMO_PLAN } },
  { id: 'quarterEdgesFirst', plans: { quarter: QUARTER_PLAN } },
  { id: 'aiBlocks', plans: { ai: AI_PLAN } },
  { id: 'rbCenters', plans: { roadblock: ROADBLOCK_PLAN } },
  {
    id: 'fromStart',
    plans: {
      quadStripe: QUAD_STRIPE_PLAN,
      detour: DETOUR_PLAN,
      diamond: DIAMOND_PLAN,
      bandage: BANDAGE_PLAN,
      quad: QUAD_PLAN,
      stripe: STRIPE_PLAN,
      fusedStripe: FUSED_STRIPE_PLAN,
      alcatraz: ALCATRAZ_PLAN,
    },
  },
  { id: 'equatorFirst', plans: { '223': SLIM_TOWER_PLAN } },
  { id: 'centersFirst', plans: { pyra: PYRAMINX_PLAN, tetra: TETRAMINX_PLAN } },
  { id: 'wingsFirst', plans: { pyra4: PYRAMINX4_PLAN, pyra5: PYRAMINX5_PLAN } },
  { id: 'jingCornersFirst', plans: { jing: JING_PLAN } },
  { id: 'asPocket', plans: { morph: MORPH_PLAN } },
  { id: 'octCornersFirst', plans: { oct4: OCT4_PLAN } },
  { id: 'vtoCentersFirst', plans: { vto: VTO_PLAN } },
  { id: 'gemCentersFirst', plans: { gem: GEM_PLAN } },
  { id: 'extendedTriangle', plans: { rainbow: RAINBOW_PLAN } },
  { id: 'megaStar', plans: { megaminx: MEGAMINX_PLAN, holey: MEGAMINX_PLAN } },
  { id: 'crystalCornersFirst', plans: { crystal: CRYSTAL_PLAN } },
  { id: 'dinoLayers', plans: { dino: DINO_PLAN } },
  { id: 'dinoCylLayers', plans: { dinoCyl: DINO_CYL_PLAN } },
  { id: 'rexEdgesFirst', plans: { rex: REX_PLAN } },
  { id: 'skewbTopFirst', plans: { skewb: SKEWB_PLAN, skewbU: SKEWB_U_PLAN } },
  { id: 'skewbFirst', plans: { masterSkewb: MASTER_SKEWB_PLAN } },
  { id: 'ftoCornersFirst', plans: { fto: FTO_PLAN } },
  { id: 'gearCornersFirst', plans: { gearCube: GEAR_PLAN, gearU: GEAR_ULTIMATE_PLAN } },
  { id: 'gearEquatorFirst', plans: { gearX: GEAR_EXTREME_PLAN } },
  { id: 'shapeFirst', plans: { purple: PURPLE_SHAPE_FIRST_PLAN } },
  { id: 'extendedCross', plans: { tori: TORI_PLAN, edge: EDGE_ONLY_PLAN } },
  { id: 'voidCornersFirst', plans: { void: VOID_CUBE_PLAN } },
  { id: 'copterEdgesFirst', plans: { copter: COPTER_PLAN, copter3: COPTER3_PLAN } },
  { id: 'latchEdgesFirst', plans: { latch: LATCH_PLAN } },
  { id: 'isolateFirst', plans: { star: STAR_PLAN } },
  { id: 'twoStars', plans: { star4: STAR4_PLAN } },
  { id: 'puckIsolate', plans: { puck: PUCK_PLAN } },
  {
    id: 'cornersFirst',
    plans: { '332': DOMINO_PLAN, '331': FLOPPY_PLAN, ghost: GHOST_PLAN, bigBlock: BIG_BLOCK_PLAN },
  },
  {
    id: 'optimal',
    plans: {
      '2': OPTIMAL_2_PLAN,
      '123': optimalPlan('123'),
      '331': optimalPlan('331'),
      ghost: optimalPlan('ghost'),
      purple: PURPLE_OPTIMAL_PLAN,
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
