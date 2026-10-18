import { FACE_COLOR, isSolved, OPPOSITE_COLOR } from '../../core/cube'
import { FACE_NORMAL } from '../../core/geometry'
import { applyMoves } from '../../core/turn'
import { CUBE_HOLDS, type Hold } from '../../core/hold'
import { parseMoves } from '../../core/moves'
import { colorAt, hasColors } from '../../core/pieces'
import type { Color, Cube, CubeColor, Face, Move, Vec3 } from '../../core/types'
import { PLL_T, PLL_Y, SUNE } from '../../methods/standard/algs'
import { frame2, topFaceDone2 } from '../../methods/standard/cube2'
import { CORNER_PAIRS, cornerPlacedIn } from '../../methods/standard/layers3'
import { search } from '../../solve/solverKit'
import { tutorialOf, type Target } from '../../tutorial/kit'
import { firstGesture, type Gesture } from '../../tutorial/macros'
import {
  cornerFormula,
  cornerPairAt,
  cornerSlot,
  pieceWith,
  sameAt,
  TRIGGER,
} from './cornerTrigger'

/**
 * The 2x2's tutorial, layer by layer, declared for the tutorial kit. No
 * centers: a yellow corner with its yellow down is the landmark, wherever
 * it stands, and the sides' colors are read on it (nothing turns to choose
 * it: the way the puzzle is held is the view's). Then:
 *   - the puzzle turned over first if no yellow is down (x or z);
 *   1. the three other yellow corners round the landmark, by the 3x3's
 *      trigger (`R U R' U'` held with the slot front right);
 *   2. the white face: `R U R' U R U2 R'` (the Sune), the top turned and
 *      the cube held the way the shortest chain of them asks;
 *   3. the white corners in their place: two side by side swapped
 *      (`R U R' U' R' F R2 U' R' U' R U R' F'`) or two across
 *      (`F R U' R' U' R U R' F' R U R' U' R' F R F'`), the 2x2's parity.
 */

const Y = FACE_COLOR.D
const W = FACE_COLOR.U

/** The faces across from each. */
const ACROSS: Record<Face, Face> = { U: 'D', D: 'U', L: 'R', R: 'L', F: 'B', B: 'F' }

/** The sides' colors, read on a bottom corner with its yellow down: the two
 *  sides it touches wear its colors there, the others the colors across. */
function frameAt(cube: Cube, piece: number): Record<Face, Color> {
  const corner = cube[piece]!
  const [x, , z] = corner.position
  const frame = { D: Y, U: OPPOSITE_COLOR[Y as CubeColor] } as Record<Face, Color>
  for (const face of [x! > 0 ? 'R' : 'L', z! > 0 ? 'F' : 'B'] as const) {
    const color = colorAt(corner, face) as CubeColor
    frame[face] = color
    frame[ACROSS[face]] = OPPOSITE_COLOR[color]
  }
  return frame
}

/** The bottom corners with their yellow down. */
const yellowDown = (cube: Cube) =>
  cube.flatMap((c, i) => (c.position[1]! < 0 && colorAt(c, 'D') === Y ? [i] : []))

/** The landmark: of the bottom corners with yellow down, the one with the
 *  most yellow corners already placed round it (the first, on a tie); null
 *  if no yellow is down. */
function landmarkOf(cube: Cube): number | null {
  const around = (piece: number) => {
    const frame = frameAt(cube, piece)
    return CORNER_PAIRS.filter(([a, b]) => cornerPlacedIn(cube, frame, a, b)).length
  }
  const down = yellowDown(cube)
  return down.length ? down.reduce((best, i) => (around(i) > around(best) ? i : best)) : null
}

/** The sides' colors, read on the landmark (null: none yet). */
const frameOf = (cube: Cube) => {
  const landmark = landmarkOf(cube)
  return landmark === null ? null : frameAt(cube, landmark)
}

/** Turned over, held another way (x or z, each way): nothing moves on it. */
const TURN_OVER: Move[] = (['R', 'F'] as const).flatMap((face) =>
  ([1, 2, 3] as const).map((amount) => ({ face, amount, whole: true as const })),
)

/** The yellow corners, read round the landmark where the step began: the
 *  landmark itself first (placed while it stays where it is, yellow down),
 *  then each other bottom slot, its colors those of the sides there. */
function cornerTargets(begun: Cube): Target[] {
  const landmark = landmarkOf(begun)
  if (landmark === null) return []
  const at = begun[landmark]!.position
  const frame = frameAt(begun, landmark)
  const held = (cube: Cube) =>
    sameAt(cube[landmark]!.position, at) && colorAt(cube[landmark]!, 'D') === Y
  const pairs = CORNER_PAIRS.filter((p) => !sameAt(cornerSlot(p), at))
  return [
    { piece: () => landmark, slot: at, placed: held },
    ...pairs.map(([a, b]) => ({
      piece: (cube: Cube) => pieceWith(cube, [Y, frame[a], frame[b]]),
      slot: cornerSlot([a, b]),
      placed: (cube: Cube) => held(cube) && cornerPlacedIn(cube, frame, a, b),
    })),
  ]
}

/** The top corners, and those with white up. */
const topCorners = (cube: Cube) => cube.flatMap((c, i) => (c.position[1] === 1 ? [i] : []))
const whiteUp = (cube: Cube) => topCorners(cube).filter((i) => colorAt(cube[i]!, 'U') === W)

/** A turn of the top (none: no move). */
const top = (amount: number): Move[] =>
  amount % 4 === 0 ? [] : [{ face: 'U', amount: (amount % 4) as 1 | 2 | 3 }]

/** A gesture named by what it does (the figure it answers). */
type Tagged = Gesture & { readonly tag: string }

/** Each hold, the top turned each way, then a formula (and, `after`, the
 *  top turned after it), named `tag`. */
const gestures = (tag: string, formula: readonly Move[], after = false): Tagged[] =>
  CUBE_HOLDS.holds.flatMap((hold) =>
    [0, 1, 2, 3].flatMap((before) =>
      (after ? [0, 1, 2, 3] : [0]).map((end) => ({
        tag,
        hold,
        moves: [...top(before), ...formula, ...top(end)],
      })),
    ),
  )

const SUNE_MOVES = parseMoves(SUNE)
const T_PERM = parseMoves(PLL_T)
const Y_PERM = parseMoves(PLL_Y)
const FACE_GESTURES = gestures('sune', SUNE_MOVES)
const PERM_GESTURES: Tagged[] = [
  // The top only turned.
  ...[1, 2, 3].map((t) => ({ tag: 'turn', hold: 'F', moves: top(t) })),
  ...gestures('adjacent', T_PERM, true),
  ...gestures('diagonal', Y_PERM, true),
]

/** The Sune to play on a white face: the first of the shortest chain to
 *  the face done, the one keeping the most white up (once per state: each
 *  figure asks). */
const SUNE_OF = new WeakMap<Cube, Gesture | null>()
function suneFor(cube: Cube): Gesture | null {
  if (!SUNE_OF.has(cube)) {
    const rank = (c: Cube) => whiteUp(c).length
    SUNE_OF.set(cube, firstGesture(cube, FACE_GESTURES, topFaceDone2, 3, CUBE_HOLDS, rank))
  }
  return SUNE_OF.get(cube)!
}

/** A figure of the white face, by how many corners show white up, and
 *  whether its Sune takes some down (`detour`: no Sune as short keeps them,
 *  the way to the figure it finishes). */
const faceFigure = (key: string, up: number, detour: boolean) => ({
  key,
  match: (cube: Cube) => {
    if (whiteUp(cube).length !== up) return null
    const sune = suneFor(cube)
    if (!sune) return null
    const after = applyMoves(
      cube,
      sune.moves.map((m) => CUBE_HOLDS.played(sune.hold, m)),
    )
    return (whiteUp(after).length < up && !topFaceDone2(after)) === detour ? sune : null
  },
})

/** The sides a position touches. */
const facesAt = (at: Vec3) =>
  (Object.keys(FACE_NORMAL) as Face[]).filter(
    (f) => FACE_NORMAL[f].reduce((dot, n, k) => dot + n * at[k]!, 0) > 0,
  )

/** How many top corners stand in their place (their colors those of the
 *  sides there, read in the anchor's frame). */
function placedOnTop(cube: Cube): number {
  const frame = frame2(cube)
  return topCorners(cube).filter((i) =>
    hasColors(
      cube[i]!,
      facesAt(cube[i]!.position).map((f) => frame[f]),
    ),
  ).length
}

/** A figure of the white corners: the one gesture solving them, if it is
 *  of that kind (a turn of the top; two side by side swapped; two across,
 *  the 2x2's parity). */
const permFigure = (key: string, tag: string) => ({
  key,
  match: (cube: Cube) => {
    const gesture = firstGesture(cube, PERM_GESTURES, isSolved, 1, CUBE_HOLDS) as Tagged | null
    return gesture?.tag === tag ? gesture : null
  },
})

/** A slot's hold: its first side in front (its second on the right). */
const pairHold = (slot: Vec3): Hold => (cornerPairAt(slot)?.[0] ?? CUBE_HOLDS.holds[0]!) as Hold

export const CUBE2_TUTORIAL = tutorialOf({
  // No centers: a side's color read on the landmark corner.
  faceColor: (cube, normal) => {
    const face = facesAt(normal)[0]
    return face ? (frameOf(cube)?.[face] ?? null) : null
  },
  stages: [
    // Turned over first if no yellow is down: the landmark is a corner
    // with its yellow down.
    {
      kind: 'formula',
      key: 'stepTutorialTurnOver2',
      done: (cube) => landmarkOf(cube) !== null,
      hold: 'F',
      formula: (cube) => search(cube, (c) => landmarkOf(c) !== null, TURN_OVER, 1),
    },
    {
      kind: 'pieces',
      key: 'stepTutorialCorner2',
      stage: 1,
      // The yellow face, shown done.
      shows: FACE_NORMAL.D,
      targets: cornerTargets,
      marker: Y,
      words: true,
      algorithms: [[TRIGGER]],
      // Held with the slot front right: its trigger reads R U R' U'.
      hold: (_, pick, next) => pairHold(pick?.slot ?? next.slot),
      formula: (cube, pick) => cornerFormula(cube, pick, Y),
      checked: true,
    },
    {
      kind: 'figures',
      key: 'stepTutorialTopFace2',
      stage: 2,
      shows: FACE_NORMAL.U,
      side: FACE_NORMAL.U,
      done: topFaceDone2,
      figures: [
        faceFigure('figureTopNone', 0, false),
        faceFigure('figureTopOne', 1, false),
        faceFigure('figureTopOneDetour', 1, true),
        faceFigure('figureTopTwo', 2, false),
        faceFigure('figureTopTwoDetour', 2, true),
      ],
      subjects: topCorners,
      marker: W,
      progress: (cube) => ({ done: whiteUp(cube).length, total: 4 }),
      algorithms: [[SUNE_MOVES]],
    },
    {
      kind: 'figures',
      key: 'stepTutorialTopCorners2',
      stage: 3,
      side: FACE_NORMAL.U,
      done: isSolved,
      figures: [
        permFigure('figureCornersTurn', 'turn'),
        permFigure('figureCornersAdjacent', 'adjacent'),
        permFigure('figureCornersDiagonal', 'diagonal'),
      ],
      subjects: topCorners,
      progress: (cube) => ({ done: placedOnTop(cube), total: 4 }),
      algorithms: [[T_PERM], [Y_PERM], [SUNE_MOVES]],
    },
  ],
})
