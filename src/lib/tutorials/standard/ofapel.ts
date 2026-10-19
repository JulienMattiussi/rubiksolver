import { FACE_COLOR } from '../../core/cube'
import { CUBE_HOLDS } from '../../core/hold'
import { FACE_NORMAL } from '../../core/geometry'
import { parseMoves } from '../../core/notation'
import { colorAt, colorsOf, sameAt } from '../../core/pieces'
import { applyMoves } from '../../core/turn'
import type { Cube, Cubie } from '../../core/types'
import { CORNER_PAIRS } from '../../methods/standard/layers3'
import { ANTISUNE } from '../../methods/standard/algs'
import { tutorialOf, type Target } from '../../teach/kit'
import { chainedPieces, chainFigure, leading, perState } from '../../teach/macros'
import type { FigureStage, PieceStage } from '../../teach/stages'
import type { TutorialPick } from '../../teach/tutorial'
import { cornerTarget, topTurn } from './cornerTrigger'
import { FIRST_LAYERS, holdStage } from './cube3'
import { FINISH } from './ofapelEnd'
import {
  chainTo,
  fromEachHold,
  hasColor,
  home,
  indicesOf,
  isCorner,
  isEdge,
  isWhite,
  isYellow,
  MECHANISM,
  SOLVED,
  TOP_TURNS,
  TOPS,
  upright,
  uprightTarget,
  W,
  whiteCorners,
  Y,
  yellowLayer,
} from './ofapelKit'
import {
  CENTER,
  CLOCKWISE,
  CORNER,
  COUNTERCLOCKWISE,
  EDGE,
  MIDDLE_SLICE,
  THICKNESSES,
  WIDE_TOP,
} from './terms'

/**
 * The 3x3's tutorial by Ofapel's method (francocube.com/ofapel), a corners
 * first variant, its frame the beginner's (yellow down, white up):
 *   1. the yellow cross, as the beginner's;
 *   2. the yellow corners, each by one of three formulas (or its mirror):
 *      `R U R'`, `R U2 R' U' R U R'`, `R U R' U' R U R'`;
 *   3. the white corners placed, two by two: `L' U R U' L U R' U2` (or its
 *      mirror) swaps two of them, twice (its last `U2` dropped) when none
 *      is placed;
 *   4. the white corners turned white up: the Antisune or its mirror, once
 *      or more, then the top turned to put them back;
 *   5. the white edges, each brought up from the middle layer by `R U' R'
 *      U u' R U R'`, its mirror or their inverses (the middle layer, its
 *      centers with it, turns on the way: it is the last step's);
 *   6. the end: the cube turned on its side (`z`), the middle layer
 *      becoming the M slice, then its four edges and centers by formulas in
 *      M and U.
 * Each step plays the shortest chain of its formulas, each from the hold
 * it reads in, the top turned before it if need be; the page's "combine
 * the formulas" is that search.
 */

// ---------------------------------------------------------------------------
// 2. The yellow corners
// ---------------------------------------------------------------------------

const CORNER_IN = [
  "R U R'",
  "L' U' L",
  "R U2 R' U' R U R'",
  "L' U2 L U L' U' L",
  "R U R' U' R U R'",
  "L' U' L U L' U' L",
].map((f) => parseMoves(f))

const CORNER_GESTURES = fromEachHold(CORNER_IN, 'corner', { before: TOPS })

/** The fewest of the three formulas taking the pick home, the yellow
 *  pieces home where the step began kept home. */
const cornerChain = (cube: Cube, pick: TutorialPick, begun: Cube) => {
  const mine = colorsOf(cube[pick.piece]!)
  const kept = new Set(begun.filter((c) => isYellow(c) && home(c)).map(colorsOf))
  const goal = (pieces: Cube) =>
    pieces.every((c) => !(kept.has(colorsOf(c)) || colorsOf(c) === mine) || home(c))
  return chainTo(cube, CORNER_GESTURES, goal, isYellow, 2)
}

const CORNERS: PieceStage = {
  kind: 'pieces',
  key: 'stepTutorialOfapelCorner',
  stage: 2,
  shows: FACE_NORMAL.D,
  targets: CORNER_PAIRS.map((pair) => uprightTarget(cornerTarget(pair))),
  marker: Y,
  words: true,
  algorithms: CORNER_IN.map((f) => [f]),
  ...chainedPieces(cornerChain, CUBE_HOLDS),
}

// ---------------------------------------------------------------------------
// 3-4. The white corners, placed then turned
// ---------------------------------------------------------------------------

/** Where a piece goes, by its colors. */
const homePlace = (c: Cubie) => SOLVED.find((s) => colorsOf(s) === colorsOf(c))!.position

/** The white corners each in its place (turned anyhow), the top turned
 *  `turn` quarters first. */
const placedAfter = (cube: Cube, turn: number) =>
  whiteCorners(applyMoves(cube, topTurn(turn), MECHANISM)).every((c) =>
    sameAt(c.position, homePlace(c)),
  )
/** Placed, but for a turn of the top. */
const placedButTop = (cube: Cube) => TOPS.some((t) => placedAfter(cube, t))
/** How many are placed, the top turned the best way. */
const placedCount = (cube: Cube) =>
  Math.max(
    ...TOPS.map(
      (t) =>
        whiteCorners(applyMoves(cube, topTurn(t), MECHANISM)).filter((c) =>
          sameAt(c.position, homePlace(c)),
        ).length,
    ),
  )

/** The swap: the two corners on the right swapped (those on the left
 *  placed), or its mirror; twice, its last turn dropped, swaps across. */
const SWAP = parseMoves("L' U R U' L U R' U2")
const SWAP_MIRROR = parseMoves("R U' L' U R' U' L U2")
const SWAP_TWICE = [...SWAP.slice(0, -1), ...SWAP.slice(0, -1)]

const PLACE_GESTURES = [
  ...fromEachHold([SWAP, SWAP_MIRROR], 'swap', { before: TOPS }),
  ...fromEachHold([SWAP_TWICE], 'swapTwice', { before: TOPS }),
]

const isWhiteCorner = (c: Cubie) => isWhite(c) && isCorner(c)

const placeChain = perState((cube: Cube) =>
  chainTo(cube, PLACE_GESTURES, placedButTop, isWhiteCorner, 2),
)

const PLACE: FigureStage = {
  kind: 'figures',
  key: 'stepTutorialOfapelPlace',
  stage: 3,
  side: FACE_NORMAL.U,
  done: (cube) => placedButTop(upright(cube)) && yellowLayer(cube),
  figures: [
    chainFigure(placeChain, 'swap', 'figureOfapelSwap'),
    chainFigure(placeChain, 'swapTwice', 'figureOfapelSwapTwice'),
  ],
  subjects: (cube) => indicesOf(cube, isWhiteCorner),
  progress: (cube) => ({ done: placedCount(upright(cube)), total: 4 }),
  algorithms: [[SWAP], [SWAP_MIRROR]],
}

/** The Antisune and its mirror: three corners turned (the top's corners
 *  each moved a place, put back by the top). */
const TWIST = parseMoves(ANTISUNE)
const TWIST_MIRROR = parseMoves("L' U2 L U L' U L")

const whiteUp = (cube: Cube) => whiteCorners(cube).filter((c) => colorAt(c, 'U') === W).length
const cornersHome = (cube: Cube) => whiteCorners(cube).every(home)

const TWIST_GESTURES = [
  ...fromEachHold([TWIST, TWIST_MIRROR], 'twist', { before: TOPS }),
  ...TOP_TURNS,
]

const twistChain = perState((cube: Cube) =>
  chainTo(cube, TWIST_GESTURES, cornersHome, isWhiteCorner, 4),
)
/** The chain's first twist, said apart when it is its last one. */
const twistsLeft = (cube: Cube) => twistChain(cube)?.filter((g) => g.kind === 'twist').length ?? 0

const TWISTED: FigureStage = {
  kind: 'figures',
  key: 'stepTutorialOfapelTwist',
  stage: 4,
  side: FACE_NORMAL.U,
  shows: FACE_NORMAL.U,
  done: (cube) => cornersHome(upright(cube)) && yellowLayer(cube),
  figures: [
    chainFigure(twistChain, 'top', 'figureOfapelTwistTurn'),
    {
      key: 'figureOfapelTwistLast',
      match: (cube) => (twistsLeft(cube) === 1 ? leading(twistChain(cube)) : null),
    },
    {
      key: 'figureOfapelTwistMore',
      match: (cube) => (twistsLeft(cube) > 1 ? leading(twistChain(cube)) : null),
    },
  ],
  subjects: (cube) => indicesOf(cube, isWhiteCorner),
  marker: W,
  progress: (cube) => ({ done: whiteUp(upright(cube)), total: 4 }),
  algorithms: [[TWIST], [TWIST_MIRROR]],
}

// ---------------------------------------------------------------------------
// 5. The white edges, up from the middle layer
// ---------------------------------------------------------------------------

/** An edge of the middle layer up to the top, held in front: from the
 *  right, from the left, and their inverses (the edge the other way). */
const RAISE = parseMoves("R U' R' U Uw' R U R'")
const RAISE_MIRROR = parseMoves("L' U L U' Uw L' U' L")
const RAISE_BACK = parseMoves("R U' R' U' Uw R U R'")
const RAISE_MIRROR_BACK = parseMoves("L' U L U Uw' L' U' L")

/** Each from each hold, the top turned to bring the edge's corners above
 *  it first, and back after. */
const RAISE_GESTURES = fromEachHold([RAISE, RAISE_MIRROR, RAISE_BACK, RAISE_MIRROR_BACK], 'raise', {
  before: TOPS,
  back: true,
})

const SIDES = ['F', 'R', 'B', 'L'] as const
const edgeTarget = (side: (typeof SIDES)[number]): Target => {
  const colors = colorsOf(
    SOLVED.find((c) => isEdge(c) && isWhite(c) && hasColor(FACE_COLOR[side])(c))!,
  )
  return uprightTarget({
    piece: (cube) => cube.findIndex((c) => colorsOf(c) === colors),
    slot: SOLVED.find((c) => colorsOf(c) === colors)!.position,
    placed: (cube) => home(cube.find((c) => colorsOf(c) === colors)!),
  })
}

const isWhiteEdge = (c: Cubie) => isWhite(c) && isEdge(c)

const raiseChain = (cube: Cube, pick: TutorialPick, begun: Cube) => {
  const mine = colorsOf(cube[pick.piece]!)
  const kept = new Set(begun.filter((c) => isWhiteEdge(c) && home(c)).map(colorsOf))
  const goal = (pieces: Cube) =>
    pieces.every((c) => !(isCorner(c) || kept.has(colorsOf(c)) || colorsOf(c) === mine) || home(c))
  return chainTo(cube, RAISE_GESTURES, goal, isWhite, 3)
}

const EDGES: PieceStage = {
  kind: 'pieces',
  key: 'stepTutorialOfapelEdges',
  stage: 5,
  shows: FACE_NORMAL.U,
  targets: SIDES.map(edgeTarget),
  marker: W,
  algorithms: [[RAISE], [RAISE_MIRROR]],
  ...chainedPieces(raiseChain, CUBE_HOLDS),
}

// ---------------------------------------------------------------------------
// The plan
// ---------------------------------------------------------------------------

const CROSS = FIRST_LAYERS[0]!

export const OFAPEL_TUTORIAL = tutorialOf({
  glossary: [
    CENTER,
    EDGE,
    CORNER,
    CLOCKWISE,
    COUNTERCLOCKWISE,
    MIDDLE_SLICE,
    WIDE_TOP,
    ...THICKNESSES,
  ],
  stages: [
    // Not once the first layer is built: its middle layer turns with the
    // edges, the whole cube on its side for the end.
    holdStage(yellowLayer),
    { ...CROSS, targets: (CROSS.targets as readonly Target[]).map(uprightTarget) },
    CORNERS,
    PLACE,
    TWISTED,
    EDGES,
    FINISH,
  ],
})
