import { isSolved } from '../../core/cube'
import { homesOf } from '../../core/pieces'
import { normalIndex, TET_NORMALS } from '../../core/geometry'
import { solvePieces } from '../../solve/pieceSearch'
import type { MethodPlan } from '../../solve/solverKit'
import type { Color, Cube, Cubie, PyraMove } from '../../core/types'
import {
  alignCorners,
  aroundTop,
  cornersDone as pyraCornersDone,
  faceColors as pyraFaceColors,
  formula as pyraFormula,
  FORMULAS_ONLY,
  pyraSet,
  showsFaces,
  undo,
} from './pyraKit'

/**
 * Pyraminx, "centers first", as taught on fan2cube.fr (pyraminx2):
 *
 *   1. Centers         turn each corner's layer until its center piece
 *                      matches the others (the "nuclear hazard" sign on
 *                      every face)
 *   2. Tips            turn each tip to its center piece's colors
 *   3. Bottom edges    the hook [gd'] = g d' g' d, a 3-cycle (AG)->(BA)->(AD)
 *                      bringing a top edge down
 *   4. Top edges       placed with d h d' h d h d', the 3-cycle
 *                      (AG)->(AD)->(GD) of the top
 *   5. Edges flipped   two at a time, with [gd'][h'd]: (AG)° (AD)°
 *
 * The Tetraminx is a Pyraminx without its tips: the same, step 2 gone.
 *
 * The center pieces and tips never leave their corner, so they say which
 * color each face takes: the face opposite a corner wears the one color its
 * center piece lacks. Every formula leaves them be (each layer turns back as
 * often as it turns), and each phase searches over its formulas only, seen
 * from the three sides around the top (and set up by a top turn for the
 * bottom edges); each formula's effect is asserted in
 * tests/unit/puzzles/pyramid/pyraminx.test.ts.
 */

const formula = pyraFormula(3)

/** The page's formulas, as written for the front: a turn of the top; the
 *  hook [gd'], (AG)->(BA)->(AD); the top's 3-cycle dhd'hdhd',
 *  (AG)->(AD)->(GD); two edges flipped, [gd'][h'd]. */
export const PYRA_TOP = formula('h')
export const PYRA_HOOK = formula("[gd']")
export const PYRA_CYCLE = formula("dhd'hdhd'")
export const PYRA_FLIP = formula("[gd'][h'd]")

const TOP = PYRA_TOP
const DOWN = aroundTop(PYRA_HOOK)
/** The hook, also after a top turn (undone after): the edge to bring down
 *  can stand anywhere on top. */
const DOWN_SET_UP = [
  ...DOWN,
  ...DOWN.flatMap((m) => [
    [...TOP, ...m, ...TOP.map(undo)],
    [...TOP.map(undo), ...m, ...TOP],
  ]),
]
const TOP_CYCLE = aroundTop(PYRA_CYCLE)
const FLIP_TWO = aroundTop(PYRA_FLIP)

const LAYERS = pyraSet((vertex) => ({ vertex }))
const TIPS = pyraSet((vertex) => ({ vertex, tip: true }))
const faceColors = (cube: Cube) => pyraFaceColors(cube, 3)
const cornersDone = (cube: Cube, tips: boolean) => pyraCornersDone(cube, 3, tips)

const EDGES = homesOf('pyra', (c) => c.stickers.length === 2)
const BOTTOM = 0 // TET_NORMALS[0]: the face opposite the top

/** Edges of the bottom face home, then (`top`) the others in place. */
function edgesDone(faces: Map<number, Color>, top: 'any' | 'placed' | 'home') {
  const bottomColor = faces.get(normalIndex(TET_NORMALS[BOTTOM]!))!
  const home = showsFaces(faces)
  const placed = (c: Cubie) =>
    c.stickers.every((s) => c.stickers.some((t) => t.color === faces.get(normalIndex(s.normal))))
  return (edges: readonly Cubie[]) =>
    edges.every((e) =>
      e.stickers.some((s) => s.color === bottomColor)
        ? home(e)
        : top === 'any' || (top === 'placed' ? placed(e) : home(e)),
    )
}

const solveEdges = (macros: PyraMove[][], top: 'any' | 'placed' | 'home') => (cube: Cube) =>
  solvePieces(cube, {
    track: EDGES,
    moves: FORMULAS_ONLY,
    macros,
    goal: edgesDone(faceColors(cube), top),
    maxDepth: 8,
  })

const edgesGoal = (top: 'any' | 'placed' | 'home', tips: boolean) => (cube: Cube) =>
  cornersDone(cube, tips) &&
  edgesDone(faceColors(cube), top)(cube.filter((c) => c.stickers.length === 2))

/** The plan, with its tips step on the Pyraminx (the Tetraminx has none). */
const centersFirst = (tips: boolean): MethodPlan => [
  {
    key: 'stepPyraCenters',
    goal: (c) => cornersDone(c, false),
    moves: LAYERS,
    phases: [alignCorners(3, false, (vertex) => ({ vertex }))],
  },
  ...(tips
    ? [
        {
          key: 'stepPyraTips',
          goal: (c: Cube) => cornersDone(c, true),
          moves: TIPS,
          phases: [alignCorners(3, true, (vertex) => ({ vertex, tip: true }))],
        },
      ]
    : []),
  {
    key: 'stepBottomEdges',
    goal: edgesGoal('any', tips),
    moves: LAYERS,
    phases: [solveEdges(DOWN_SET_UP, 'any')],
  },
  {
    key: 'stepPyraTopEdges',
    goal: edgesGoal('placed', tips),
    moves: LAYERS,
    phases: [solveEdges(TOP_CYCLE, 'placed')],
  },
  { key: 'stepFlipEdges', goal: isSolved, moves: LAYERS, phases: [solveEdges(FLIP_TWO, 'home')] },
]

export const PYRAMINX_PLAN = centersFirst(true)
/** The Tetraminx (fan2cube.fr/tetraminx1): solved as the Pyraminx is. */
export const TETRAMINX_PLAN = centersFirst(false)
