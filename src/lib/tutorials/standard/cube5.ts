import { FACE_COLOR } from '../../core/cube'
import { FACE_NORMAL, faceOfNormal, vecKey } from '../../core/geometry'
import { applyMoves } from '../../core/turn'
import type { Cube, Face, Move, Vec3 } from '../../core/types'
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
import { projected, tutorialOf, type Kept, type Target, type TutorialPlan } from '../../teach/kit'
import type { TutorialPick } from '../../teach/tutorial'
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

/** The faces in the order their centers are built. */
const ORDER: readonly Face[] = ['D', 'U', 'F', 'R', 'B', 'L']
/** Moving centers a face. */
const FULL = 8

const faceOf = (cube: Cube, i: number) => faceOfNormal(cube[i]!.stickers[0]!.normal)
const isRight = (cube: Cube, i: number) =>
  FACE_COLOR[faceOf(cube, i)] === cube[i]!.stickers[0]!.color
/** The moving centers on a face, right ones or not. */
const centersOn = (cube: Cube, face: Face, right: boolean) =>
  cube.flatMap((c, i) =>
    isMovingCenter(c) && faceOf(cube, i) === face && isRight(cube, i) === right ? [i] : [],
  )

/** The next center to place, as the solver places it (once per state): its
 *  moves, the center it brings, and where it lands. */
const NEXT = new WeakMap<Cube, { moves: Move[]; piece: number; slot: Vec3; face: Face } | null>()
function nextCenter(cube: Cube) {
  if (NEXT.has(cube)) return NEXT.get(cube)!
  const face = ORDER.find((f) => centersOn(cube, f, true).length < FULL)
  const moves = face ? placeCenter(cube) : null
  let found = null
  if (face && moves) {
    const after = applyMoves(cube, moves)
    const was = new Set(centersOn(cube, face, true))
    const piece = centersOn(after, face, true).find((i) => !was.has(i))
    if (piece !== undefined) found = { moves, piece, slot: after[piece]!.position, face }
  }
  NEXT.set(cube, found)
  return found
}

/** The right centers a face counts: none before the faces built before it
 *  are full (those it shows by chance do not stay). */
const counted = (cube: Cube, face: Face) =>
  ORDER.slice(0, ORDER.indexOf(face)).every((f) => centersOn(cube, f, true).length === FULL)
    ? centersOn(cube, face, true)
    : []

/** The centers, read where the step began: per face, its first, second...
 *  right center (any of its color: they look the same), the next one the
 *  one the solver brings, where it lands (a turn of the face on the way
 *  may land it where a right one stood), the others to the face's other
 *  places. */
function centerTargets(begun: Cube): Target[] {
  const next = nextCenter(begun)
  return ORDER.flatMap((face) => {
    const right = counted(begun, face)
    const open = begun.flatMap((c, i) =>
      isMovingCenter(c) && faceOf(begun, i) === face && !right.includes(i) ? [c.position] : [],
    )
    const slots =
      next?.face === face
        ? [next.slot, ...open.filter((p) => vecKey(p) !== vecKey(next.slot))]
        : open
    return Array.from({ length: FULL }, (_, n): Target => {
      const k = n + 1
      return {
        interchangeable: true,
        piece: (cube) => (k <= right.length ? counted(cube, face)[k - 1]! : next!.piece),
        slot: k <= right.length ? begun[right[k - 1]!]!.position : slots[k - right.length - 1]!,
        placed: (cube) => counted(cube, face).length >= k,
      }
    })
  })
}

/** The way to the pick's place: the solver's own if it is its pick, else a
 *  placement of that center there (none if the face is not the one being
 *  built). */
function centerFormula(cube: Cube, pick: TutorialPick, kept: Kept): Move[] | null {
  const next = nextCenter(kept.begun)
  if (
    cube === kept.begun &&
    next &&
    next.piece === pick.piece &&
    vecKey(next.slot) === vecKey(pick.slot)
  ) {
    return next.moves
  }
  const from = vecKey(cube[pick.piece]!.position)
  return placeCenter(cube, { from, to: vecKey(pick.slot) })
}

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
    {
      kind: 'pieces',
      key: 'stepTutorialCenters5',
      stage: 1,
      targets: centerTargets,
      words: true,
      hold: () => 'F',
      formula: centerFormula,
    },
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
