import { isSolved } from '../cube'
import { colorsOf, homesOf } from '../pieces'
import { normalIndex } from '../geometry'
import { solvePieces } from '../pieceSearch'
import type { MethodPlan } from '../solverKit'
import type { Color, Cube, Cubie, PyraMove } from '../types'
import {
  alignCorners,
  cornersDone,
  faceColors,
  formula as pyraFormula,
  FORMULAS_ONLY,
  fromEverySide,
  pyraSet,
  showsFaces,
} from './pyraKit'

/**
 * Pyraminx Jing, "corners first", as taught on fan2cube.fr (pyraminxjing2):
 *
 *   1. Corners          each corner twisted to match the others with its own
 *                       turn (the only piece a turn twists in place)
 *   2. Edges placed     with the hook [DH] = D H D' H', (BA)->(AD)->(GD),
 *                       from every side (G[DH]G' among them)
 *   3. Edges flipped    two at a time, [DH'][G'H]: (AG)° (BA)°
 *   4. Centers          [DH]³ swaps them two by two, (B,A)(G,D)
 *
 * The corners never move, so they say which color each face takes (see
 * pyraKit). Every formula is a commutator, which leaves them be; the hooks
 * also swap centers two by two, which step 4 settles: with the corners
 * right, the centers can only be two by two out of place (each turn twists
 * one corner and cycles three centers together, fan2cube's twist law).
 * Each formula's effect is asserted in tests/unit/jing.test.ts.
 */

const SIZE = 2
const formula = pyraFormula(SIZE)

const deep = (vertex: PyraMove['vertex']) => ({ vertex, deep: true as const })
const TURNS = pyraSet(deep)

const isEdge = (c: Cubie) => c.stickers.length === 2
const isCenter = (c: Cubie) => c.stickers.length === 1

const HOOKS = ['[DH]', "G[DH]G'"].flatMap((f) => fromEverySide(formula(f)))
const FLIPS = fromEverySide(formula("[DH'][G'H]"))
const CENTER_SWAPS = fromEverySide(formula('[DH][DH][DH]'))

/** Whether a piece is in the slot of its colors, whichever way round. */
const inSlot = (faces: Map<number, Color>) => (c: Cubie) =>
  c.stickers.every((s) => c.stickers.some((t) => t.color === faces.get(normalIndex(s.normal))))

/** A search over the edges or the centers, by fan2cube's formulas only:
 *  every one home, or (`placed`) in its slot whichever way round. */
const solveGroup =
  (keep: (c: Cubie) => boolean, macros: PyraMove[][], placed = false) =>
  (cube: Cube) => {
    const faces = faceColors(cube, SIZE)
    const right = placed ? inSlot(faces) : showsFaces(faces)
    return solvePieces<PyraMove>(cube, {
      track: homesOf('jing', keep),
      moves: FORMULAS_ONLY,
      macros,
      goal: (pieces) => pieces.every(right),
      ...(placed && {
        key: (pieces: readonly Cubie[]) =>
          pieces.map((c) => `${c.position.join()}:${colorsOf(c)}`).join(' '),
      }),
      maxDepth: 8,
    })
  }

const goal = (edges: 'placed' | 'home') => (cube: Cube) => {
  const faces = faceColors(cube, SIZE)
  const right = edges === 'placed' ? inSlot(faces) : showsFaces(faces)
  return cornersDone(cube, SIZE, false) && cube.filter(isEdge).every(right)
}

export const JING_PLAN: MethodPlan = [
  {
    key: 'stepJingCorners',
    goal: (c) => cornersDone(c, SIZE, false),
    moves: TURNS,
    phases: [alignCorners(SIZE, false, deep)],
  },
  {
    key: 'stepPlaceEdges',
    goal: goal('placed'),
    moves: TURNS,
    phases: [solveGroup(isEdge, HOOKS, true)],
  },
  { key: 'stepFlipEdges', goal: goal('home'), moves: TURNS, phases: [solveGroup(isEdge, FLIPS)] },
  {
    key: 'stepPlaceCenters',
    goal: isSolved,
    moves: TURNS,
    phases: [solveGroup(isCenter, CENTER_SWAPS)],
  },
]
