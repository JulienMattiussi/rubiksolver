import { faceColorsOf, solvedCube, turnDims } from '../../core/cube'
import { faceOfNormal } from '../../core/geometry'
import { CUBE_HOLDS } from '../../core/hold'
import { invertMoves } from '../../core/moves'
import { colorsOf, sameAt } from '../../core/pieces'
import type { Cube, Cubie, Face, Move, Vec3 } from '../../core/types'
import {
  barAxis,
  barKey,
  DESCEND,
  DESCEND_INNER,
  isBottomCorner,
  isCorner,
  isHome,
  isMiddle,
  layoutKey,
  PIVOT,
  shapeDone,
  SWAP,
  SWAP_INNER,
} from '../../methods/tower/tower'
import { tutorialOf, type Target } from '../../teach/kit'
import {
  chainedPieces,
  chainFigure,
  eachHold,
  gestureChain,
  perState,
  type Gesture,
} from '../../teach/macros'
import type { TutorialPick } from '../../teach/tutorial'
import { TOWER_GLOSSARY } from './towerTerms'

/**
 * The 2x2x4 tower's tutorial, "Two Pockets" (the method of fan2cube.fr's
 * tower2242 and domino pages, `methods/tower/tower.ts`, whose formulas and
 * predicates it plays), declared for the tutorial kit, the tower held a
 * side in front (`CUBE_HOLDS`). The tower is two Pockets stacked, an inner
 * one (the eight middles) and an outer one (the eight corners):
 *   1. back in shape: each bar (a corner and the middle beside it) stood up
 *      by the pivot, wide turns bringing two lying bars to it;
 *   2-3. the inner Pocket, bottom then top: a middle brought down by the
 *      descent, the top ones swapped two at a time (h and b turned as Uw
 *      and Dw);
 *   4-5. the outer Pocket the same way, its corners brought down two by two
 *      (a descent turns the inner Pocket's front half over, the next puts
 *      it back), then swapped.
 * Each step plays the shortest chain of its formulas, each from the hold it
 * reads in, the top turned before it if need be. The two middles of a
 * column are twins (the same colors): either may go to either place.
 */

const SOLVED = solvedCube('224')
const MECHANISM = turnDims('224')
const COLORS = faceColorsOf('224')

const homesOf = (keep: (c: Cubie) => boolean) => SOLVED.filter(keep).map((c) => c.position)
const below = (c: Cubie) => c.position[1]! < 0
const MIDDLES_DOWN = homesOf((c) => isMiddle(c) && below(c))
const MIDDLES_UP = homesOf((c) => isMiddle(c) && !below(c))
const CORNERS_DOWN = homesOf((c) => isCorner(c) && below(c))
const CORNERS_UP = homesOf((c) => isCorner(c) && !below(c))

const pieceAt = (cube: Cube, at: Vec3) => cube.find((c) => sameAt(c.position, at))
const indicesOf = (cube: Cube, keep: (c: Cubie) => boolean) =>
  cube.flatMap((c, i) => (keep(c) ? [i] : []))

/** A turn of a face (`wide`: of its half of the tower), `amount` quarters. */
const turn = (face: Face, amount: number, wide = false): Move[] =>
  amount % 4 === 0
    ? []
    : [{ face, amount: (amount % 4) as 1 | 2 | 3, ...(wide && { depth: 2, wide: true }) }]
const TURNS = [0, 1, 2, 3]

/** A place as a target: the piece the solved tower has there, by its
 *  colors (a middle's twin will do: `interchangeable`), placed when it
 *  stands there home. */
function target(at: Vec3): Target {
  const colors = colorsOf(pieceAt(SOLVED, at)!)
  const twin = isMiddle(pieceAt(SOLVED, at)!)
  return {
    // Of twins, one not home yet.
    piece: (cube) => {
      const mine = indicesOf(cube, (c) => colorsOf(c) === colors)
      return mine.find((i) => !isHome(cube[i]!)) ?? mine[0]!
    },
    slot: at,
    placed: (cube) => {
      const c = pieceAt(cube, at)
      return c !== undefined && colorsOf(c) === colors && isHome(c)
    },
    ...(twin && { interchangeable: true as const }),
  }
}

/** The shortest chain of a step's gestures bringing its pieces (`keep`) to
 *  a goal, told apart by `key`. */
const chainOf = (
  cube: Cube,
  gestures: readonly Gesture[],
  goal: (pieces: Cube) => boolean,
  keep: (c: Cubie) => boolean,
  key: (pieces: Cube) => string,
) => gestureChain(cube, gestures, goal, { keep, key, mechanism: MECHANISM, frame: CUBE_HOLDS })

/** A piece stage's chain: the pick's place home, those home where the step
 *  began kept home (and `also`, what earlier steps leave). */
const placeChain =
  (
    gestures: readonly Gesture[],
    places: readonly Vec3[],
    keep: (c: Cubie) => boolean,
    key: (pieces: Cube) => string,
    also: (pieces: Cube) => boolean = () => true,
  ) =>
  (cube: Cube, pick: TutorialPick, begun: Cube) => {
    const targets = places.map(target)
    const kept = targets.filter((t) => t.placed(begun) || sameAt(t.slot, pick.slot))
    const goal = (pieces: Cube) => kept.every((t) => t.placed(pieces)) && also(pieces)
    return chainOf(cube, gestures, goal, keep, key)
  }

// ---------------------------------------------------------------------------
// 1. Back in shape
// ---------------------------------------------------------------------------

/** The pivot from each side, both ways; the wide turns bringing the bars
 *  to it. */
const SHAPE_GESTURES: Gesture[] = [
  ...eachHold([PIVOT, invertMoves(PIVOT)], 'pivot', CUBE_HOLDS),
  ...(['U', 'D'] as const).flatMap((face) =>
    [1, 2, 3].map((t): Gesture => ({ hold: 'F', kind: 'turn', moves: turn(face, t, true) })),
  ),
  ...(['R', 'F'] as const).map((face): Gesture => ({
    hold: 'F',
    kind: 'turn',
    moves: turn(face, 2, true),
  })),
]
const standing = (pieces: Cube) => pieces.filter(isCorner).every((c) => barAxis(c) === 1)
const shapeChain = perState((cube: Cube) =>
  chainOf(cube, SHAPE_GESTURES, standing, isCorner, barKey),
)

// ---------------------------------------------------------------------------
// 2-5. The two Pockets
// ---------------------------------------------------------------------------

/** A formula from each side, the top (its half, `wide`) turned before it. */
const prepared = (formula: readonly Move[], kind: string, wide: boolean, back = false) =>
  eachHold([formula], kind, CUBE_HOLDS, { setups: TURNS.map((t) => turn('U', t, wide)), back })
/** The top's turns (its half, `wide`) alone: the last one, if need be. */
const topTurns = (wide: boolean): Gesture[] =>
  [1, 2, 3].map((t) => ({ hold: 'F', kind: 'turn', moves: turn('U', t, wide) }))

const innerLook = (pieces: Cube) => layoutKey(pieces.filter(isMiddle))
const INNER_DOWN = placeChain(
  prepared(DESCEND_INNER, 'descend', true),
  MIDDLES_DOWN,
  isMiddle,
  innerLook,
)
const INNER_UP = placeChain(
  [...prepared(SWAP_INNER, 'swap', true, true), ...topTurns(true)],
  [...MIDDLES_DOWN, ...MIDDLES_UP],
  isMiddle,
  innerLook,
)
/** The middles home: what the outer Pocket's formulas must leave. */
const middlesHome = (pieces: Cube) => pieces.filter(isMiddle).every(isHome)
const OUTER_DOWN = placeChain(
  prepared(DESCEND, 'descend', false),
  CORNERS_DOWN,
  (c) => isMiddle(c) || isCorner(c),
  // All the goal reads: the middles and the bottom corners.
  (pieces) => layoutKey(pieces.filter((c) => isMiddle(c) || isBottomCorner(c))),
  middlesHome,
)
const OUTER_UP = placeChain(
  [...prepared(SWAP, 'swap', false, true), ...topTurns(false)],
  [...CORNERS_DOWN, ...CORNERS_UP],
  isCorner,
  (pieces) => layoutKey(pieces.filter(isCorner)),
)

/** A side's color: the solved tower's there (no center says it: the side
 *  it will be once solved). */
const faceColor = (_: Cube, normal: Vec3) => COLORS[faceOfNormal(normal)]

/** A tower piece: a corner, or a middle. */
const pieceKind = (c: Cubie) => (isCorner(c) ? 'corner' : isMiddle(c) ? 'middle' : 'piece')

export const TOWER_TUTORIAL = tutorialOf({
  glossary: TOWER_GLOSSARY,
  holding: 'tower',
  pieceKind,
  faceColor,
  stages: [
    {
      kind: 'figures',
      key: 'stepTowerShape',
      stage: 1,
      done: shapeDone,
      figures: [
        chainFigure(shapeChain, 'pivot', 'figureTowerPivot'),
        chainFigure(shapeChain, 'turn', 'figureTowerTurn'),
      ],
      focus: (cube) => indicesOf(cube, (c) => isCorner(c) && barAxis(c) !== 1),
      progress: (cube) => ({
        done: cube.filter((c) => isCorner(c) && barAxis(c) === 1).length,
        total: CORNERS_DOWN.length + CORNERS_UP.length,
      }),
      algorithms: [[PIVOT]],
    },
    {
      kind: 'pieces',
      key: 'stepTowerInnerDown',
      stage: 2,
      targets: MIDDLES_DOWN.map(target),
      algorithms: [[DESCEND_INNER]],
      ...chainedPieces(INNER_DOWN, CUBE_HOLDS),
    },
    {
      kind: 'pieces',
      key: 'stepTowerInnerUp',
      stage: 3,
      targets: MIDDLES_UP.map(target),
      algorithms: [[SWAP_INNER]],
      ...chainedPieces(INNER_UP, CUBE_HOLDS),
    },
    {
      kind: 'pieces',
      key: 'stepTowerOuterDown',
      stage: 4,
      targets: CORNERS_DOWN.map(target),
      algorithms: [[DESCEND]],
      ...chainedPieces(OUTER_DOWN, CUBE_HOLDS),
    },
    {
      kind: 'pieces',
      key: 'stepTowerOuterUp',
      stage: 5,
      targets: CORNERS_UP.map(target),
      algorithms: [[SWAP]],
      ...chainedPieces(OUTER_UP, CUBE_HOLDS),
    },
  ],
})
