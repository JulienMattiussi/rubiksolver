import { isSolved, solvedCube } from '../../core/cube'
import { invertMoves } from '../../core/moves'
import { colorsOf, sameAt } from '../../core/pieces'
import { applyMoves } from '../../core/turn'
import type { Cube, Cubie, Turn, Vec3 } from '../../core/types'
import { parse } from '../../methods/shared/skewbKit'
import { BOTTOM_TWIST, CENTER_SWAP, TOP_TWIST } from '../../methods/diagonal/skewb'
import { searchFormulas } from '../../solve/formulaSearch'
import { tutorialOf, type Kept, type Target } from '../../teach/kit'
import { firstGesture, type Gesture } from '../../teach/macros'
import type { TutorialPick } from '../../teach/tutorial'
import { holdAt, SKEWB_HOLDS } from './skewbHolds'
import { SKEWB_GLOSSARY } from './skewbTerms'

/**
 * The Skewb's tutorial, the method of francocube.com (cyril/skewb_index),
 * declared for the tutorial kit. Only the four bottom corners turn, so the
 * top center never moves: the face it shows is built first, whatever its
 * color, and the puzzle is held with it on top, a side in front
 * (`SKEWB_HOLDS`).
 *   1. the top corners placed, by turns of the bottom ones;
 *   2. the top corners turned, each by `[B'O']` (francocube's 2'-1-2-1')
 *      or the way back, held with it in front on the right;
 *   3. the centers, by `[O'B]` (1-2-1'-2'): the bottom center swapped with
 *      the front one, and the two sides with each other;
 *   4. the bottom corners turned, by `[O'B]` twice (or the way back,
 *      `[BO']²`), from one side then another, three times at most.
 * The formulas are the Skewb's, declared with them (methods/diagonal/).
 * The solved state the steps aim at is the solved Skewb turned so that
 * its top center shows the color on top (see `referenceOf`).
 */

// ---------------------------------------------------------------------------
// The solved state aimed at
// ---------------------------------------------------------------------------

const SOLVED = solvedCube('skewb')

const rotate = (cube: Cube, turn: (v: Vec3) => Vec3): Cube =>
  cube.map((c) => ({
    ...c,
    position: turn(c.position),
    stickers: c.stickers.map((s) => ({ normal: turn(s.normal), color: s.color })),
  }))

/** The Skewb turned whole every way (24), each a solved state. */
const REFERENCES: readonly Cube[] = (() => {
  const generators = [
    ([x, y, z]: Vec3): Vec3 => [y, z, x],
    ([x, y, z]: Vec3): Vec3 => [z, y, -x + 0],
  ]
  const keyOf = (f: (v: Vec3) => Vec3) => `${f([1, 0, 0])}|${f([0, 1, 0])}`
  const found = new Map<string, (v: Vec3) => Vec3>([[keyOf((v) => v), (v) => v]])
  let frontier = [...found.values()]
  while (frontier.length) {
    frontier = frontier.flatMap((f) =>
      generators.flatMap((g) => {
        const h = (v: Vec3) => g(f(v))
        if (found.has(keyOf(h))) return []
        found.set(keyOf(h), h)
        return [h]
      }),
    )
  }
  return [...found.values()].map((f) => rotate(SOLVED, f))
})()

const TOP: Vec3 = [0, 1, 0]
const isCorner = (c: Cubie) => c.stickers.length === 3
const isCenter = (c: Cubie) => c.stickers.length === 1
const TOP_CORNERS = SOLVED.filter((c) => isCorner(c) && c.position[1]! > 0).map((c) => c.position)
const BOTTOM_CORNERS = SOLVED.filter((c) => isCorner(c) && c.position[1]! < 0).map(
  (c) => c.position,
)
const CENTERS = SOLVED.filter((c) => isCenter(c) && !sameAt(c.position, TOP)).map((c) => c.position)

const pieceAt = (cube: Cube, at: Vec3) => cube.find((c) => sameAt(c.position, at))!
const indexAt = (cube: Cube, at: Vec3) => cube.findIndex((c) => sameAt(c.position, at))
/** Whether a place holds the piece it does in `reference` (`turned`: and
 *  turned as there). */
const holds = (cube: Cube, reference: Cube, at: Vec3, turned: boolean) => {
  const [piece, want] = [pieceAt(cube, at), pieceAt(reference, at)]
  if (colorsOf(piece) !== colorsOf(want)) return false
  return (
    !turned ||
    want.stickers.every((s) =>
      piece.stickers.some((t) => sameAt(t.normal, s.normal) && t.color === s.color),
    )
  )
}
const placedCount = (cube: Cube, reference: Cube) =>
  TOP_CORNERS.filter((at) => holds(cube, reference, at, false)).length

/** A corner's set: its coordinates' signs multiplied. Turns never take a
 *  corner from one set to the other, so a solved state the turns reach
 *  has each corner in the set it stands in now. */
const setOf = (p: readonly number[]) => Math.sign(p[0]! * p[1]! * p[2]!)
const CORNER = SOLVED.find(isCorner)!

/** The solved state a Skewb is solved toward: of the two whose top center
 *  is the one on top and whose corners keep their sets, the one its top
 *  corners already agree with most (once one is placed, only it does). */
function referenceOf(cube: Cube): Cube {
  const top = colorsOf(pieceAt(cube, TOP))
  const colors = colorsOf(CORNER)
  const set = setOf(cube.find((c) => colorsOf(c) === colors)!.position)
  const candidates = REFERENCES.filter(
    (r) =>
      colorsOf(pieceAt(r, TOP)) === top &&
      setOf(r.find((c) => colorsOf(c) === colors)!.position) === set,
  )
  return candidates.reduce((best, r) => (placedCount(cube, r) > placedCount(cube, best) ? r : best))
}

const homeAll = (places: readonly Vec3[]) => (cube: Cube) => {
  const reference = referenceOf(cube)
  return places.filter((at) => holds(cube, reference, at, true)).length
}

// ---------------------------------------------------------------------------
// 1-2. The top corners: placed, then turned
// ---------------------------------------------------------------------------

/** A top corner, read where the step began: the piece its place holds in
 *  the solved state aimed at. */
const cornerTargets =
  (turned: boolean) =>
  (begun: Cube): Target[] => {
    const reference = referenceOf(begun)
    return TOP_CORNERS.map((at) => {
      const colors = colorsOf(pieceAt(reference, at))
      return {
        piece: (cube) => cube.findIndex((c) => colorsOf(c) === colors),
        slot: at,
        placed: (cube) => holds(cube, reference, at, turned),
      }
    })
  }

/** The bottom corners' turns, each alone. */
const BOTTOM_TURNS = ['B', "B'", 'E', "E'", 'H', "H'", 'O', "O'"].map(parse)

/** The fewest turns of the bottom corners bringing the picked corner to
 *  its place, keeping those placed. */
function placeFormula(cube: Cube, pick: TutorialPick, kept: Kept): Turn[] | null {
  const goal = (c: Cube) => sameAt(c[pick.piece]!.position, pick.slot) && kept.targetsKept(c)
  return searchFormulas(cube, BOTTOM_TURNS, goal, { depth: 4 })
}

const TWIST = parse(TOP_TWIST)

/** The twist, or the way back, held with the corner in front on the right. */
function twistFormula(cube: Cube, pick: TutorialPick): Turn[] | null {
  const hold = holdAt(pick.slot)
  const reference = referenceOf(cube)
  return (
    [TWIST, invertMoves(TWIST)]
      .map((moves) => moves.map((m) => SKEWB_HOLDS.played(hold, m)))
      .find((moves) => holds(applyMoves(cube, moves), reference, pick.slot, true)) ?? null
  )
}

// ---------------------------------------------------------------------------
// 3-4. The centers, then the bottom corners
// ---------------------------------------------------------------------------

/** A formula from each side (and the way back, if `back`). */
const fromEachSide = (moves: readonly Turn[], back: boolean): Gesture[] =>
  SKEWB_HOLDS.holds.flatMap((hold) => [
    { hold, moves },
    ...(back ? [{ hold, moves: invertMoves(moves) }] : []),
  ])

const SWAP = parse(CENTER_SWAP)
const TWICE = parse(BOTTOM_TWIST)
const SWAPS = fromEachSide(SWAP, false)
const TWISTS = fromEachSide(TWICE, true)

const centersHome = homeAll(CENTERS)
const bottomHome = homeAll(BOTTOM_CORNERS)
const centersDone = (cube: Cube) => centersHome(cube) === CENTERS.length

/** The pieces of these places not home. */
const notHome = (places: readonly Vec3[]) => (cube: Cube) => {
  const reference = referenceOf(cube)
  return places.filter((at) => !holds(cube, reference, at, true)).map((at) => indexAt(cube, at))
}

/** A side's color once a top corner says it: the one it shows in the
 *  solved state aimed at (the top's, its center's). */
function faceColor(cube: Cube, normal: Vec3) {
  if (sameAt(normal, TOP)) return null
  const reference = referenceOf(cube)
  if (placedCount(cube, reference) === 0) return null
  return pieceAt(reference, normal).stickers[0]!.color
}

export const SKEWB_TUTORIAL = tutorialOf({
  frame: SKEWB_HOLDS,
  holding: 'skewb',
  glossary: SKEWB_GLOSSARY,
  faceColor,
  stages: [
    {
      kind: 'pieces',
      key: 'stepSkewbTopPlaced',
      stage: 1,
      targets: cornerTargets(false),
      words: true,
      hold: (_, pick, next) => holdAt((pick ?? next).slot),
      formula: placeFormula,
    },
    {
      kind: 'pieces',
      key: 'stepSkewbTopTwist',
      stage: 2,
      targets: cornerTargets(true),
      shows: TOP,
      algorithms: [[TWIST]],
      hold: (_, pick, next) => holdAt((pick ?? next).slot),
      // Not checked: the corner turned was kept by the step before.
      formula: twistFormula,
    },
    {
      kind: 'figures',
      key: 'stepSkewbCenters',
      stage: 3,
      done: centersDone,
      figures: [
        {
          key: 'figureSkewbCenters',
          match: (cube) => firstGesture(cube, SWAPS, centersDone, 5, SKEWB_HOLDS, centersHome),
        },
      ],
      focus: notHome(CENTERS),
      progress: (cube) => ({ done: centersHome(cube), total: CENTERS.length }),
      algorithms: [[SWAP]],
    },
    {
      kind: 'figures',
      key: 'stepSkewbBottom',
      stage: 4,
      done: isSolved,
      figures: [
        {
          key: 'figureSkewbBottom',
          match: (cube) => firstGesture(cube, TWISTS, isSolved, 3, SKEWB_HOLDS, bottomHome),
        },
      ],
      focus: notHome(BOTTOM_CORNERS),
      progress: (cube) => ({ done: bottomHome(cube), total: BOTTOM_CORNERS.length }),
      algorithms: [[TWICE]],
    },
  ],
})
