import { isSolved } from '../../core/cube'
import { mapVec, TET_NORMALS } from '../../core/geometry'
import type { HoldFrame } from '../../core/hold'
import { parseMoves } from '../../core/moves'
import { hasColors } from '../../core/pieces'
import { applyMoves } from '../../core/turn'
import type { Color, Cube, Cubie, Move, Vec3 } from '../../core/types'
import { PLL_T, PLL_Y, SUNE } from '../../methods/standard/algs'
import { PYRA_CORNERS } from '../../puzzles/pyramid/pyraminx'
import { OUTER_GENERATORS, search } from '../../solve/solverKit'
import { tutorialOf, type Kept, type Target } from '../../teach/kit'
import { firstGesture, type Gesture } from '../../teach/macros'
import type { TutorialPick } from '../../teach/tutorial'
import { MORPH_GLOSSARY } from './morphTerms'

/**
 * The Pyramorphinx's tutorial, "as a Pocket": it turns as the 2x2 it is,
 * held laid flat on a face, one way only (its 2x2's layers stay its halves:
 * the formulas keep the first half built). A corner of the first half is
 * the landmark, read where it stands; the sides' colors are read on it.
 *   - a corner brought into the first half first if none stands there;
 *   1. the first half: its two corners and two face middles, one at a time;
 *   2. the other half's two corners turned, by the Sune (`R U R' U R U2 R'`);
 *   3. the other half placed: a turn of the top, or two pieces swapped side
 *      by side (T-perm) or across (Y-perm).
 * A face middle's twist never shows: only what shows is asked.
 */

/** The one way to hold it: laid flat on the face across from the top
 *  corner, the face across from the back corner in front. */
const MORPH_HOLD: HoldFrame = {
  holds: ['B'],
  front: () => mapVec(PYRA_CORNERS.B, (v) => -v),
  down: mapVec(PYRA_CORNERS.U, (v) => -v),
  played: (_, turn) => turn,
  inHold: (_, turn) => turn,
}

const sameAt = (a: Vec3, b: Vec3) => a.join() === b.join()
const indexAt = (cube: Cube, at: Vec3) => cube.findIndex((c) => sameAt(c.position, at))

/** The first half's places (the 2x2's bottom layer): two corners of the
 *  tetrahedron, and the middles of the bottom and front faces. */
const CORNER_SLOTS: readonly Vec3[] = [PYRA_CORNERS.L, PYRA_CORNERS.R]
const MIDDLE_SLOTS: readonly Vec3[] = [
  mapVec(PYRA_CORNERS.U, (v) => -v),
  mapVec(PYRA_CORNERS.B, (v) => -v),
]
const inFirstHalf = (at: readonly number[]) => at[1] === -1

/** A frame: each face's color, by its outward normal. */
type Frame = ReadonlyMap<string, Color>

/** The colors a corner says: its stickers', and the one it lacks for the
 *  face across from it. */
function frameAt(cube: Cube, corner: number): Frame {
  const piece = cube[corner]!
  const colors = new Set(cube.flatMap((c) => c.stickers.map((s) => s.color)))
  const frame = new Map(piece.stickers.map((s) => [s.normal.join(), s.color]))
  const across = TET_NORMALS.find((n) => !frame.has(n.join()))
  const missing = [...colors].find((c) => !piece.stickers.some((s) => s.color === c))
  if (across && missing) frame.set(across.join(), missing)
  return frame
}

/** A piece showing a frame's colors (so at its place, turned right). */
const shows = (frame: Frame, cubie: Cubie) =>
  cubie.stickers.length > 0 && cubie.stickers.every((s) => frame.get(s.normal.join()) === s.color)

/** The landmark: a corner in a corner place of the first half, the one with
 *  the most of the first half placed round it (the first, on a tie). */
function landmarkOf(cube: Cube): number | null {
  const corners = CORNER_SLOTS.map((at) => indexAt(cube, at)).filter(
    (i) => cube[i]!.stickers.length === 3,
  )
  const around = (i: number) => {
    const frame = frameAt(cube, i)
    return cube.filter((c) => inFirstHalf(c.position) && shows(frame, c)).length
  }
  return corners.length ? corners.reduce((best, i) => (around(i) > around(best) ? i : best)) : null
}

const frameOf = (cube: Cube) => {
  const landmark = landmarkOf(cube)
  return landmark === null ? null : frameAt(cube, landmark)
}

// ---------------------------------------------------------------------------
// 1. The first half
// ---------------------------------------------------------------------------

/** The first half's pieces, read round the landmark where the step began. */
function halfTargets(begun: Cube): Target[] {
  const landmark = landmarkOf(begun)
  if (landmark === null) return []
  const frame = frameAt(begun, landmark)
  const at = begun[landmark]!.position
  const held = (cube: Cube) => sameAt(cube[landmark]!.position, at) && shows(frame, cube[landmark]!)
  const target = (slot: Vec3, corner: boolean): Target => {
    // A corner shows the faces not across from it; a middle, the face it
    // stands in the middle of.
    const normals = corner
      ? TET_NORMALS.filter(
          (n) =>
            !sameAt(
              mapVec(n, (v) => -v),
              slot,
            ),
        )
      : [slot]
    const colors = normals.map((n) => frame.get(n.join())!)
    return {
      piece: (cube) =>
        cube.findIndex((c) => c.stickers.length === normals.length && hasColors(c, colors)),
      slot,
      placed: (cube) => held(cube) && shows(frame, cube[indexAt(cube, slot)]!),
    }
  }
  return [
    { piece: () => landmark, slot: at, placed: held },
    ...CORNER_SLOTS.filter((s) => !sameAt(s, at)).map((s) => target(s, true)),
    ...MIDDLE_SLOTS.map((s) => target(s, false)),
  ]
}

/** The shortest way to the pick's place, the first half's placed kept. */
function halfFormula(cube: Cube, pick: TutorialPick, kept: Kept): Move[] {
  const frame = frameOf(kept.begun)!
  const goal = (c: Cube) =>
    kept.targetsKept(c) &&
    sameAt(c[pick.piece]!.position, pick.slot) &&
    shows(frame, c[pick.piece]!)
  return search(cube, goal, OUTER_GENERATORS, 7)
}

// ---------------------------------------------------------------------------
// 2-3. The other half: its corners turned, then everything placed
// ---------------------------------------------------------------------------

/** The other half's side (the 2x2's top). */
const OTHER_HALF: Vec3 = [0, 1, 0]

/** A turn of the top (none: no move). */
const top = (amount: number): Move[] =>
  amount % 4 === 0 ? [] : [{ face: 'U', amount: (amount % 4) as 1 | 2 | 3 }]

/** The other half's pieces, and its corners. */
const otherHalf = (cube: Cube) => cube.flatMap((c, i) => (inFirstHalf(c.position) ? [] : [i]))
const otherCorners = (cube: Cube) => otherHalf(cube).filter((i) => cube[i]!.stickers.length === 3)

/** A corner turned right: some turn of the top takes it home. */
function turnedRight(cube: Cube, frame: Frame, piece: number): boolean {
  return [0, 1, 2, 3].some((t) => shows(frame, applyMoves(cube, top(t))[piece]!))
}
const cornersRight = (cube: Cube) => {
  const frame = frameOf(cube)
  return frame ? otherCorners(cube).filter((i) => turnedRight(cube, frame, i)).length : 0
}
const cornersDone = (cube: Cube) => cornersRight(cube) === 2

/** Each formula after a turn of the top (and, `after`, one after it). */
type Tagged = Gesture & { readonly tag: string }
const gestures = (tag: string, formula: readonly Move[], after = false): Tagged[] =>
  [0, 1, 2, 3].flatMap((before) =>
    (after ? [0, 1, 2, 3] : [0]).map((end) => ({
      tag,
      hold: 'B',
      moves: [...top(before), ...formula, ...top(end)],
    })),
  )

const SUNE_MOVES = parseMoves(SUNE)
const T_PERM = parseMoves(PLL_T)
const Y_PERM = parseMoves(PLL_Y)
const TURN_GESTURES = gestures('sune', SUNE_MOVES)
const PLACE_GESTURES: Tagged[] = [
  ...[1, 2, 3].map((t) => ({ tag: 'turn', hold: 'B', moves: top(t) })),
  ...gestures('adjacent', T_PERM, true),
  ...gestures('diagonal', Y_PERM, true),
]

/** A figure of the other half's corners, by how many are turned right. */
const turnFigure = (key: string, right: number) => ({
  key,
  match: (cube: Cube) =>
    cornersRight(cube) === right
      ? firstGesture(cube, TURN_GESTURES, cornersDone, 3, MORPH_HOLD, cornersRight)
      : null,
})

/** A figure of the other half's places: the one gesture finishing it, if
 *  of that kind (a turn of the top; two side by side; two across). */
const placeFigure = (key: string, tag: string) => ({
  key,
  match: (cube: Cube) => {
    const gesture = firstGesture(cube, PLACE_GESTURES, isSolved, 1, MORPH_HOLD) as Tagged | null
    return gesture?.tag === tag ? gesture : null
  },
})

const placedOnTop = (cube: Cube) => {
  const frame = frameOf(cube)
  return frame ? otherHalf(cube).filter((i) => shows(frame, cube[i]!)).length : 0
}

/** A tip (three stickers: a pyramid's corners are called so) or a face's
 *  middle (one). */
const pieceKind = (cubie: Cubie) => (cubie.stickers.length === 3 ? 'tip' : 'middle')

export const MORPH_TUTORIAL = tutorialOf({
  frame: MORPH_HOLD,
  holding: 'flat',
  pieceKind,
  glossary: MORPH_GLOSSARY,
  faceColor: (cube, normal) => frameOf(cube)?.get(normal.join()) ?? null,
  stages: [
    // A corner brought into the first half first: the landmark.
    {
      kind: 'formula',
      key: 'stepTutorialMorphCorner',
      done: (cube) => landmarkOf(cube) !== null,
      hold: 'B',
      formula: (cube) => search(cube, (c) => landmarkOf(c) !== null, OUTER_GENERATORS, 2),
    },
    {
      kind: 'pieces',
      key: 'stepTutorialMorphHalf',
      stage: 1,
      targets: halfTargets,
      words: true,
      hold: () => 'B',
      formula: halfFormula,
    },
    {
      kind: 'figures',
      key: 'stepTutorialMorphTurn',
      stage: 2,
      // The other half, the view raised toward it.
      side: OTHER_HALF,
      done: cornersDone,
      figures: [turnFigure('figureMorphNone', 0), turnFigure('figureMorphOne', 1)],
      focus: (cube) => otherCorners(cube),
      progress: (cube) => ({ done: cornersRight(cube), total: 2 }),
      algorithms: [[SUNE_MOVES]],
    },
    {
      kind: 'figures',
      key: 'stepTutorialMorphPlace',
      stage: 3,
      side: OTHER_HALF,
      done: isSolved,
      figures: [
        placeFigure('figureMorphTurnTop', 'turn'),
        placeFigure('figureMorphAdjacent', 'adjacent'),
        placeFigure('figureMorphDiagonal', 'diagonal'),
      ],
      focus: (cube) => otherHalf(cube),
      progress: (cube) => ({ done: placedOnTop(cube), total: 4 }),
      algorithms: [[T_PERM], [Y_PERM], [SUNE_MOVES]],
    },
  ],
})
