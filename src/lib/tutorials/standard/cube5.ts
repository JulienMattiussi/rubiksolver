import { FACE_NORMAL, vecKey } from '../../core/geometry'
import { applyMoves } from '../../core/turn'
import type { Cube, Move } from '../../core/types'
import { centersDone, placeCenter } from '../../methods/standard/solver5/centers'
import {
  EDGE_PARITY,
  edgePairing,
  edgesPaired,
  fixEdgeParity,
  pairedOrParity,
} from '../../methods/standard/solver5/edges'
import { isMovingCenter } from '../../methods/standard/solver5/kinds'
import { middlesHome } from '../../methods/standard/solver5/steps'
import { projected, tutorialOf, type TutorialPlan } from '../../teach/kit'
import { centerStage } from './bigCenters'
import { FIRST_LAYERS, holdStage } from './cube3'
import { LAST_LAYER } from './cube3LastLayer'
import { nextPairing, PAIR_FORMULAS } from './pair5'
import { PROJECT_5 } from './reduced'
import { CLOCKWISE, CORNER, COUNTERCLOCKWISE, THICKNESSES } from './terms'
import { CENTER5, EDGE5, FIXED_CENTER, INNER5, MIDGE, WING5 } from './termsBig'

/**
 * The 5x5's tutorial, by reduction, like the 4x4's (cube4.ts), held first
 * with its fixed centers home (yellow down, white up: they never move, so
 * they say each face's color):
 *   1. the centers, one piece at a time (yellow, white, then the belt):
 *      a slice and a turn while the face is open, else a commutator (a
 *      slice, a turn, the slice back, the turn back) that leaves the
 *      finished faces whole;
 *   2. the edges, a wing at a time beside its middle piece (pair5.ts);
 *   3. the edge parity, when the last edge holds its two wings crossed;
 *   then the 3x3's stages on its projection (the reduced 5x5 turns as a
 *   3x3, and has no other parity).
 */

// ---------------------------------------------------------------------------
// 1. The centers
// ---------------------------------------------------------------------------

/** One at a time, as the solver places them (bigCenters.ts): a slice and
 *  a turn, else a commutator. */
const CENTERS = centerStage('stepTutorialCenters5', {
  full: 8,
  isCenter: isMovingCenter,
  next: (cube) => placeCenter(cube),
  pick: (cube, piece, slot) =>
    placeCenter(cube, { from: vecKey(cube[piece]!.position), to: vecKey(slot) }),
})

// ---------------------------------------------------------------------------
// 2. The edges
// ---------------------------------------------------------------------------

/** The cube's pieces at slots (`x,y,z` keys). */
const piecesAt = (cube: Cube, slots: readonly string[]) =>
  cube.flatMap((c, i) => (slots.includes(vecKey(c.position)) ? [i] : []))

/** The wings a pairing joins (beside their middle piece after, not before). */
function joined(cube: Cube, moves: readonly Move[]) {
  const before = new Set(piecesAt(cube, edgePairing(cube).wings))
  const after = applyMoves(cube, moves)
  return piecesAt(after, edgePairing(after).wings).filter((i) => !before.has(i))
}

// ---------------------------------------------------------------------------
// 3. The parity
// ---------------------------------------------------------------------------

/** The front top edge's two wings, where the parity formula swaps them. */
const FRONT_TOP = ['-1,2,2', '1,2,2']

/** The plan, also the super cube's on its colors (superCubes.ts). */
export const CUBE5_PLAN: TutorialPlan = {
  glossary: [
    FIXED_CENTER,
    CENTER5,
    MIDGE,
    WING5,
    EDGE5,
    CORNER,
    INNER5,
    CLOCKWISE,
    COUNTERCLOCKWISE,
    ...THICKNESSES,
  ],
  stages: [
    holdStage(undefined, middlesHome),
    CENTERS,
    {
      kind: 'figures',
      key: 'stepTutorialPair5',
      stage: 2,
      done: (cube) => centersDone(cube) && pairedOrParity(cube),
      figures: [
        {
          key: 'figurePairEdge5',
          match: (cube) => {
            const moves = nextPairing(cube)
            return moves && { hold: 'F', moves }
          },
        },
      ],
      focus: (cube) => {
        const moves = nextPairing(cube)
        return moves ? joined(cube, moves) : []
      },
      progress: (cube) => ({ done: edgePairing(cube).wings.length, total: 24 }),
      algorithms: PAIR_FORMULAS.slice(0, 4).map((f) => [f]),
    },
    {
      kind: 'figures',
      key: 'stepTutorialParity5',
      stage: 3,
      side: FACE_NORMAL.U,
      done: edgesPaired,
      figures: [
        { key: 'figureEdgeParity5', match: (cube) => ({ hold: 'F', moves: fixEdgeParity(cube) }) },
      ],
      focus: (cube) => {
        const setup = fixEdgeParity(cube).slice(0, -EDGE_PARITY.length)
        return piecesAt(applyMoves(cube, setup), FRONT_TOP)
      },
      progress: (cube) => ({ done: edgesPaired(cube) ? 1 : 0, total: 1 }),
      algorithms: [[EDGE_PARITY]],
    },
    ...FIRST_LAYERS.map((stage, i) => projected(stage, PROJECT_5, 4 + i)),
    ...LAST_LAYER.map((stage, i) => projected(stage, PROJECT_5, 7 + i)),
  ],
}

export const CUBE5_TUTORIAL = tutorialOf(CUBE5_PLAN)
