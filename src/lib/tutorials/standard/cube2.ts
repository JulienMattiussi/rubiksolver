import { FACE_COLOR, isSolved } from '../../core/cube'
import { FACE_NORMAL } from '../../core/geometry'
import { applyMoves } from '../../core/turn'
import { CUBE_HOLDS } from '../../core/hold'
import { FACES } from '../../core/moves'
import { parseMoves } from '../../core/notation'
import { colorAt, colorsOf, sameAt } from '../../core/pieces'
import type { Color, Cube, Cubie, Face, Move, Turn, Vec3 } from '../../core/types'
import { ANTISUNE, PLL_AB, SUNE } from '../../methods/standard/algs'
import { searchFormulas } from '../../solve/formulaSearch'
import { tutorialOf, type Target } from '../../teach/kit'
import { firstGesture, type Gesture } from '../../teach/macros'
import { playedIn, topTurn } from './cornerTrigger'
import { CLOCKWISE, CORNER, COUNTERCLOCKWISE, THICKNESSES } from './terms'

/**
 * The 2x2's tutorial, layer by layer as its manual teaches it (QiYi: four
 * steps, three formulas), declared for the tutorial kit. No centers: its
 * layers are told by their own corners. Its first color (yellow, the
 * app's first layer) is built on top, where one sees it, then the cube is
 * turned over:
 *   1. the yellow face: the yellow corners brought up one at a time, their
 *      yellow up, the sides as they come (the shortest way keeping those
 *      up);
 *   2. the yellow layer, still on top: its corners put in their places by
 *      formula 1, `R B' R F2 R' B R F2 R2` (three corners cycled, the back
 *      left one kept), once or twice;
 *   3. the white face: the cube turned over (yellow down), then one of
 *      seven cases, each played by formula 2 `R U2 R' U' R U' R'` and
 *      formula 3 `R U R' U R U2 R'` (the Antisune and the Sune);
 *   4. the white layer: formula 1 again.
 */

/** Its first color (its first layer's) and its last. */
const FIRST = FACE_COLOR.D
const LAST = FACE_COLOR.U

const CYCLE = parseMoves(PLL_AB)
const FORMULA_2 = parseMoves(ANTISUNE)
const FORMULA_3 = parseMoves(SUNE)

/** The top corners, and those showing `color` up. */
const topCorners = (cube: Cube) => cube.flatMap((c, i) => (c.position[1] === 1 ? [i] : []))
const showingUp = (cube: Cube, color: Color) =>
  topCorners(cube).filter((i) => colorAt(cube[i]!, 'U') === color)

/** The side faces a position touches. */
const sidesAt = (at: Vec3) =>
  (['F', 'R', 'B', 'L'] as const).filter(
    (f) => FACE_NORMAL[f].reduce((dot, n, k) => dot + n * at[k]!, 0) > 0,
  )

/** Whether a layer (its height, `y`) is one: its four corners showing
 *  `color` on its outer face, two corners side by side the same color on
 *  the side they share. */
function layerDone(cube: Cube, y: 1 | -1, color: Color): boolean {
  const face: Face = y === 1 ? 'U' : 'D'
  const corners = cube.filter((c) => c.position[1] === y)
  if (!corners.every((c) => colorAt(c, face) === color)) return false
  return (['F', 'R', 'B', 'L'] as const).every((side) => {
    const shown = corners.filter((c) => sidesAt(c.position).includes(side))
    return shown.length === 2 && colorAt(shown[0]!, side) === colorAt(shown[1]!, side)
  })
}

const yellowLayerUp = (cube: Cube) => layerDone(cube, 1, FIRST)
/** The yellow layer done, and turned over already (down): the first two
 *  steps stay done then. */
const yellowLayerDown = (cube: Cube) => layerDone(cube, -1, FIRST)
/** The yellow layer done, down, and the white face up. */
const whiteFaceDone = (cube: Cube) =>
  layerDone(cube, -1, FIRST) && showingUp(cube, LAST).length === 4

// ---------------------------------------------------------------------------
// 1. The yellow face, on top
// ---------------------------------------------------------------------------

/** The top slots. */
const TOP_SLOTS: readonly Vec3[] = [
  [-1, 1, 1],
  [1, 1, 1],
  [1, 1, -1],
  [-1, 1, -1],
]

const isFirst = (c: Cubie) => c.stickers.some((s) => s.color === FIRST)

/** Each top slot, filled once any yellow corner shows its yellow up there
 *  (they are alike to this step: the next ones place them). */
const faceTargets: readonly Target[] = TOP_SLOTS.map((slot) => ({
  piece: (cube) => {
    // The yellow corner suggested: one not yet up on top.
    const up = (c: Cubie) => c.position[1] === 1 && colorAt(c, 'U') === FIRST
    return cube.findIndex((c) => isFirst(c) && !up(c))
  },
  slot,
  placed: (cube) => {
    const there = cube.find((c) => sameAt(c.position, slot))
    return (there !== undefined && colorAt(there, 'U') === FIRST) || yellowLayerDown(cube)
  },
  interchangeable: true,
}))

/** Every turn of a face, one at a time (the shortest way, intuitive). */
const SINGLE_TURNS: Move[][] = FACES.flatMap((face) =>
  ([1, 2, 3] as const).map((amount) => [{ face, amount }]),
)

/** The fewest turns taking a yellow corner to a top slot, its yellow up,
 *  keeping the yellow ones already up there: a search over the four yellow
 *  corners alone. */
function faceFormula(cube: Cube, piece: number, slot: Vec3, kept: readonly Vec3[]): Turn[] | null {
  const colors = colorsOf(cube[piece]!)
  const up = (c: Cubie | undefined) => c !== undefined && colorAt(c, 'U') === FIRST
  const at = (pieces: Cube, p: Vec3) => pieces.find((c) => sameAt(c.position, p))
  const goal = (pieces: Cube) => {
    const mine = pieces.find((c) => colorsOf(c) === colors)!
    return sameAt(mine.position, slot) && up(mine) && kept.every((p) => up(at(pieces, p)))
  }
  const key = (pieces: Cube) =>
    pieces
      .map((c) => c.position.join() + c.stickers.map((s) => s.normal.join()).join(';'))
      .sort()
      .join('|')
  return searchFormulas(cube.filter(isFirst), SINGLE_TURNS, goal, {
    key,
    depth: 7,
    mechanism: [2, 2, 2],
  })
}

// ---------------------------------------------------------------------------
// 2-4. Figures, by the manual's three formulas
// ---------------------------------------------------------------------------

/** Formula 1 from each hold, the top turned before and after it. */
const CYCLES: Gesture[] = CUBE_HOLDS.holds.flatMap((hold) =>
  [0, 1, 2, 3].flatMap((before) =>
    [0, 1, 2, 3].map((after) => ({
      hold,
      moves: [...topTurn(before), ...CYCLE, ...topTurn(after)],
    })),
  ),
)
/** The top turned alone. */
const TOP_TURNS: Gesture[] = [1, 2, 3].map((t) => ({ hold: 'F', moves: topTurn(t) }))

/** A layer's corners by formula 1: the one formula to play, held its way,
 *  when one or two of them put the layer right (`times`), the top turned
 *  alone when that is all (`times` 0). */
const cycleFigure = (key: string, done: (cube: Cube) => boolean, times: 0 | 1 | 2) => ({
  key,
  match: (cube: Cube) => {
    const turn = firstGesture(cube, TOP_TURNS, done, 1, CUBE_HOLDS)
    if (times === 0) return turn
    if (turn) return null
    const once = firstGesture(cube, CYCLES, done, 1, CUBE_HOLDS)
    if (times === 1) return once
    return once ? null : firstGesture(cube, CYCLES, done, 2, CUBE_HOLDS)
  },
})

/** The white face's seven cases, as the manual plays them: formula 2 or
 *  3, or two of them, the top turned between (each case the one its
 *  formulas solve, seen from its hold, the top turned first). */
const CASES: readonly (readonly Move[])[] = [
  FORMULA_2,
  FORMULA_3,
  [...FORMULA_2, ...FORMULA_2],
  [...FORMULA_2, ...topTurn(3), ...FORMULA_2],
  [...FORMULA_2, ...topTurn(2), ...FORMULA_3],
  [...FORMULA_2, ...topTurn(1), ...FORMULA_3],
  [...FORMULA_2, ...topTurn(3), ...FORMULA_3],
]

/** The white face's case `n` (1 to 7): how to hold it and what to play. */
const caseFigure = (n: number) => ({
  key: `figureFace2Case${n}`,
  match: (cube: Cube) => {
    if (!layerDone(cube, -1, FIRST)) return null
    for (const hold of CUBE_HOLDS.holds) {
      for (const before of [0, 1, 2, 3]) {
        const moves = [...topTurn(before), ...CASES[n - 1]!]
        if (whiteFaceDone(applyMoves(cube, playedIn(hold, moves)))) return { hold, moves }
      }
    }
    return null
  },
})

/** The whole cube turned over (x2): the yellow layer goes down. */
const TURN_OVER: Move[] = [{ face: 'R', amount: 2, whole: true }]

/** How many corners of the layer at `y` stand right by their neighbors
 *  (each pair side by side matching on its side): what a layer's step
 *  shows of its progress. */
function matched(cube: Cube, y: 1 | -1): number {
  const corners = cube.filter((c) => c.position[1] === y)
  return corners.filter((c) =>
    sidesAt(c.position).every((side) => {
      const mate = corners.find((o) => o !== c && sidesAt(o.position).includes(side))
      return mate !== undefined && colorAt(mate, side) === colorAt(c, side)
    }),
  ).length
}

/** A side's color, read on the yellow layer once it is down (its corner
 *  there); none before. */
function sideColor(cube: Cube, normal: Vec3): Color | null {
  const face = sidesAt(normal)[0]
  if (!face || !layerDone(cube, -1, FIRST)) return null
  const corner = cube.find((c) => c.position[1] === -1 && sidesAt(c.position).includes(face))
  return corner ? (colorAt(corner, face) ?? null) : null
}

export const CUBE2_TUTORIAL = tutorialOf({
  glossary: [CORNER, CLOCKWISE, COUNTERCLOCKWISE, ...THICKNESSES],
  // No centers: a side's color read on the yellow layer, once down.
  faceColor: (cube, normal) => sideColor(cube, normal),
  stages: [
    {
      kind: 'pieces',
      key: 'stepTutorialFace2',
      stage: 1,
      shows: FACE_NORMAL.U,
      targets: faceTargets,
      marker: FIRST,
      words: true,
      hold: () => 'F',
      // The slots showing yellow up where the step began kept so (alike,
      // they are kept by their places, not by which corner is there).
      formula: (cube, pick, kept) =>
        faceFormula(
          cube,
          pick.piece,
          pick.slot,
          faceTargets.filter((t) => t.placed(kept.begun)).map((t) => t.slot),
        ),
    },
    {
      kind: 'figures',
      key: 'stepTutorialLayer2',
      stage: 2,
      side: FACE_NORMAL.U,
      done: (cube) => yellowLayerUp(cube) || yellowLayerDown(cube),
      figures: [
        cycleFigure('figureLayer2Once', yellowLayerUp, 1),
        cycleFigure('figureLayer2Twice', yellowLayerUp, 2),
      ],
      subjects: topCorners,
      progress: (cube) => ({ done: matched(cube, 1), total: 4 }),
      algorithms: [[CYCLE]],
    },
    {
      kind: 'figures',
      key: 'stepTutorialTopFace2',
      stage: 3,
      shows: FACE_NORMAL.U,
      side: FACE_NORMAL.U,
      done: whiteFaceDone,
      figures: [
        // The yellow layer still up: turned over first.
        {
          key: 'figureTurnOver2',
          match: (cube: Cube) => (yellowLayerUp(cube) ? { hold: 'F', moves: TURN_OVER } : null),
        },
        ...[1, 2, 3, 4, 5, 6, 7].map(caseFigure),
      ],
      subjects: topCorners,
      marker: LAST,
      progress: (cube) => ({ done: showingUp(cube, LAST).length, total: 4 }),
      algorithms: [[FORMULA_2], [FORMULA_3]],
    },
    {
      kind: 'figures',
      key: 'stepTutorialTopCorners2',
      stage: 4,
      side: FACE_NORMAL.U,
      done: isSolved,
      figures: [
        cycleFigure('figureCorners2Turn', isSolved, 0),
        cycleFigure('figureCorners2Once', isSolved, 1),
        cycleFigure('figureCorners2Twice', isSolved, 2),
      ],
      subjects: topCorners,
      progress: (cube) => ({ done: matched(cube, 1), total: 4 }),
      algorithms: [[CYCLE]],
    },
  ],
})
