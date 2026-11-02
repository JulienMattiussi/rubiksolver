import { faceColorsOf, solvedCube, turnDims } from '../../core/cube'
import { faceOfNormal } from '../../core/geometry'
import { CUBE_HOLDS } from '../../core/hold'
import { atHome, colorRenames, colorsOf, recolored, sameAt } from '../../core/pieces'
import type { Color, Cube, Cubie, Face, Move, Vec3 } from '../../core/types'
import { layoutKey } from '../../methods/tower/tower'
import {
  SLIM_ADJACENT,
  SLIM_EDGE_SWAP,
  SLIM_OPPOSITE,
  SLIM_PAIRS,
} from '../../methods/tower/slimTower'
import { tutorialOf, type Target } from '../../teach/kit'
import { chainedPieces, eachHold, gestureChain, type Gesture } from '../../teach/macros'
import type { TutorialPick } from '../../teach/tutorial'
import { SLIM_GLOSSARY } from './towerTerms'

/**
 * The Slim Tower's (2x2x3) tutorial, "Corners then edges", as its manual
 * teaches it (QiYi MoFangGe, its misprint corrected: see
 * `methods/tower/slimTower.ts`), the tower held a side in front
 * (`CUBE_HOLDS`):
 *   1. the bottom corners, one at a time, by the fewest turns (the manual
 *      leaves this step to each);
 *   2. the top corners: two across swapped by formula 1 (three times), two
 *      beside by formula 2, the top turned before if need be;
 *   3. the middle's edges: swapped two by two by formula 3, or two beside
 *      by formula 4 (three times).
 * Each step plays the shortest chain of its gestures, each from the hold
 * it reads in, the pieces home where the step began kept home. No center
 * says which side is which: the tower is read the way up and round that
 * keeps the most corners already placed (see `holdOf`).
 */

const SHAPE = '223'
const SOLVED = solvedCube(SHAPE)
const MECHANISM = turnDims(SHAPE)
const COLORS = faceColorsOf(SHAPE)

const isCorner = (c: Cubie) => c.stickers.length === 3
const isEdge = (c: Cubie) => c.stickers.length === 2
const homesOf = (keep: (c: Cubie) => boolean) => SOLVED.filter(keep).map((c) => c.position)
const BOTTOM = homesOf((c) => isCorner(c) && c.position[1]! < 0)
const TOP = homesOf((c) => isCorner(c) && c.position[1]! > 0)
const EDGES = homesOf(isEdge)

const pieceAt = (cube: Cube, at: Vec3) => cube.find((c) => sameAt(c.position, at))

/** A way of holding the tower: each color renamed to the solved one of the
 *  side it stands for then. Upright, either way up (its eight). */
type Rename = ReadonlyMap<Color, Color>
const RENAMES: readonly Rename[] = colorRenames(SOLVED).filter((r) =>
  [COLORS.U, COLORS.D].includes(r.get(COLORS.U)!),
)

/** A place as a target, the tower held as `rename` reads it: the piece
 *  the solved tower has there, by its colors, placed when it stands there
 *  home. */
function target(at: Vec3, rename: Rename): Target {
  const colors = colorsOf(pieceAt(SOLVED, at)!)
  const read = (c: Cubie) => recolored([c], rename)[0]!
  return {
    piece: (cube) => cube.findIndex((c) => colorsOf(read(c)) === colors),
    slot: at,
    placed: (cube) => {
      const c = pieceAt(cube, at)
      return c !== undefined && colorsOf(read(c)) === colors && atHome(read(c), SHAPE)
    },
  }
}

const placedIn = (cube: Cube, rename: Rename, places: readonly Vec3[]) =>
  places.filter((at) => target(at, rename).placed(cube)).length

/**
 * How to hold the tower: the way keeping the most bottom corners already
 * placed (a bottom turned out of line, or built on top, is so used as it
 * stands), then the most pieces placed; the tower as it is on a tie. The
 * bottom only grows step after step, so the way stays the same.
 */
const holdOf = (cube: Cube): Rename =>
  RENAMES.reduce((best, r) => {
    const score = (by: Rename) =>
      placedIn(cube, by, BOTTOM) * 100 + placedIn(cube, by, [...TOP, ...EDGES])
    return score(r) > score(best) ? r : best
  })
const targetsOf = (places: readonly Vec3[]) => (begun: Cube) =>
  places.map((at) => target(at, holdOf(begun)))

/** A turn of a face (`depth` 2: its middle layer alone), `amount` quarters. */
const turn = (face: Face, amount: number, depth?: 2): Move[] =>
  amount % 4 === 0 ? [] : [{ face, amount: (amount % 4) as 1 | 2 | 3, ...(depth && { depth }) }]
const QUARTERS = [1, 2, 3]
const thrice = (moves: readonly Move[]) => [...moves, ...moves, ...moves]

/** A layer's quarter turns alone, from the front. */
const layerTurns = (face: Face, depth?: 2): Gesture[] =>
  QUARTERS.map((t) => ({ hold: 'F', kind: 'turn', moves: turn(face, t, depth) }))

/** The ways of holding the tower as `hold` does, but turned round its
 *  height: its top and bottom the same. */
const turnedRound = (hold: Rename) =>
  RENAMES.filter((r) => [COLORS.U, COLORS.D].every((c) => r.get(c) === hold.get(c)))

/** Whether these pieces (by their colors) all stand home, the tower held
 *  one of these ways (one, turned round: a formula may leave the whole
 *  tower turned, formula 2). */
const homeTogether = (pieces: Cube, colors: readonly string[], ways: readonly Rename[]) =>
  ways.some((r) =>
    colors.every((k) => {
      const c = pieces.find((p) => colorsOf(p) === k)
      return c !== undefined && atHome(recolored([c], r)[0]!, SHAPE)
    }),
  )

/**
 * A piece stage's chain: the shortest chain of its gestures (the shortest
 * gestures first, of chains as long) bringing the pick home, those home
 * where the step began kept home (the tower maybe turned whole), the
 * pieces it reads (`keep`) alone.
 */
const placeChain =
  (gestures: readonly Gesture[], places: readonly Vec3[], keep: (c: Cubie) => boolean) =>
  (cube: Cube, pick: TutorialPick, begun: Cube) => {
    const hold = holdOf(begun)
    const ways = turnedRound(hold)
    const kept = places
      .map((at) => target(at, hold))
      .filter((t) => t.placed(begun) || sameAt(t.slot, pick.slot))
      .map((t) => colorsOf(cube[t.piece(cube)]!))
    return gestureChain(
      cube,
      [...gestures].sort((a, b) => a.moves.length - b.moves.length),
      (pieces) => homeTogether(pieces, kept, ways),
      { keep, key: (pieces) => layoutKey(pieces), mechanism: MECHANISM, frame: CUBE_HOLDS },
    )
  }

// 1. The bottom corners: any single turn (the sides only by halves).
const SINGLE_TURNS: Gesture[] = [
  ...layerTurns('U'),
  ...layerTurns('D'),
  ...(['R', 'L', 'F', 'B'] as const).map((face): Gesture => ({
    hold: 'F',
    kind: 'turn',
    moves: turn(face, 2),
  })),
]
const BOTTOM_CHAIN = placeChain(SINGLE_TURNS, BOTTOM, isCorner)

// 2. The top corners: formula 1 (three times) or 2, from each side, the
// top turned before it (and back after); or the top turned alone.
const TOP_SETUPS = [0, ...QUARTERS].map((t) => turn('U', t))
const TOP_CHAIN = placeChain(
  [
    ...eachHold([thrice(SLIM_OPPOSITE)], 'opposite', CUBE_HOLDS, {
      setups: TOP_SETUPS,
      back: true,
    }),
    ...eachHold([SLIM_ADJACENT], 'adjacent', CUBE_HOLDS, { setups: TOP_SETUPS, back: true }),
    ...layerTurns('U'),
  ],
  [...BOTTOM, ...TOP],
  isCorner,
)

// 3. The middle's edges: formula 3 or 4 (three times), from each side; or
// the middle turned alone. The corners read too: they say how the tower
// is held (an edge alone stands home some way round).
const EDGE_CHAIN = placeChain(
  [
    ...eachHold([SLIM_PAIRS], 'pairs', CUBE_HOLDS),
    ...eachHold([thrice(SLIM_EDGE_SWAP)], 'swap', CUBE_HOLDS),
    ...layerTurns('U', 2),
  ],
  [...BOTTOM, ...TOP, ...EDGES],
  () => true,
)

/** A side's color, the tower held its way where the step began (no center
 *  says it): the color renamed to the solved one there. */
function faceColor(_: Cube, normal: Vec3, begun: Cube): Color | null {
  const wanted = COLORS[faceOfNormal(normal)]
  return [...holdOf(begun)].find(([, to]) => to === wanted)?.[0] ?? null
}

export const SLIM_TOWER_TUTORIAL = tutorialOf({
  glossary: SLIM_GLOSSARY,
  holding: 'tower',
  pieceKind: (c) => (isCorner(c) ? 'corner' : isEdge(c) ? 'edge' : 'piece'),
  faceColor,
  stages: [
    {
      kind: 'pieces',
      key: 'stepSlimBottom',
      stage: 1,
      targets: targetsOf(BOTTOM),
      words: true,
      ...chainedPieces(BOTTOM_CHAIN, CUBE_HOLDS),
    },
    {
      kind: 'pieces',
      key: 'stepSlimTop',
      stage: 2,
      targets: targetsOf(TOP),
      algorithms: [[SLIM_OPPOSITE], [SLIM_ADJACENT]],
      times: [[3], [1]],
      ...chainedPieces(TOP_CHAIN, CUBE_HOLDS),
    },
    {
      kind: 'pieces',
      key: 'stepSlimEdges',
      stage: 3,
      targets: targetsOf(EDGES),
      algorithms: [[SLIM_PAIRS], [SLIM_EDGE_SWAP]],
      times: [[1], [3]],
      ...chainedPieces(EDGE_CHAIN, CUBE_HOLDS),
    },
  ],
})
