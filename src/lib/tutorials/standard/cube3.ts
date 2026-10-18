import { FACE_COLOR } from '../../core/cube'
import { CUBE_HOLDS, type Hold } from '../../core/hold'
import { parseMoves } from '../../core/moves'
import { colorAt, hasColors } from '../../core/pieces'
import { applyMoves } from '../../core/turn'
import type { Cube, Face, Move, Vec3 } from '../../core/types'
import {
  CORNER_PAIRS,
  cornerPlaced,
  edgePlaced,
  middleEdgePlaced,
} from '../../methods/standard/layers3'
import { homeOf } from '../../methods/standard/pieces3'
import { centersHome, recenter } from '../../methods/standard/recenter'
import { OUTER_GENERATORS, search, SIDES } from '../../solve/solverKit'
import { tutorialOf, type Kept, type Target } from '../../tutorial/kit'
import {
  cornerFormula,
  cornerPairAt,
  cornerSlot,
  pieceWith,
  sameAt,
  TRIGGER,
  type Pair,
} from './cornerTrigger'
import { LAST_LAYER } from './cube3LastLayer'
import type { TutorialPick } from '../../tutorial/tutorial'

/**
 * The 3x3's tutorial, layer by layer (the beginner method, its frame: yellow
 * down, white up), declared for the tutorial kit:
 *   - the centers put back first if a slice moved them;
 *   1. the yellow cross, an edge at a time, the shortest way that keeps the
 *      edges placed, held the green center in front;
 *   2. the yellow corners, each brought above its slot then dropped in by
 *      `R U R' U'` (held with the slot front right), once, three or five
 *      times;
 *   3. the middle edges, each brought above the center of its color then
 *      inserted to the right (`U R U' R' U' F' U F`) or to the left
 *      (`U' L' U L U F U' F'`);
 *   4. the white cross, by `F R U R' U' F'` from the figure the top's white
 *      edges draw: a dot, an L held back left, a line held across;
 *   5. the rest, still to come.
 */

const Y = FACE_COLOR.D
const W = FACE_COLOR.U

// ---------------------------------------------------------------------------
// 1. The cross
// ---------------------------------------------------------------------------

const crossTarget = (s: Face): Target => ({
  piece: (cube) => pieceWith(cube, [Y, FACE_COLOR[s]]),
  slot: homeOf(`D${s}`),
  placed: (cube) => edgePlaced(cube, s),
})

/** The shortest way to the pick's slot, yellow down, the edges placed kept. */
function crossFormula(cube: Cube, pick: TutorialPick, kept: Kept): Move[] {
  const colors = cube[pick.piece]!.stickers.map((s) => s.color)
  const goal = (c: Cube) =>
    kept.targetsKept(c) &&
    c.some((p) => hasColors(p, colors) && sameAt(p.position, pick.slot) && colorAt(p, 'D') === Y)
  return search(cube, goal, OUTER_GENERATORS, 8)
}

// ---------------------------------------------------------------------------
// 2. The yellow corners
// ---------------------------------------------------------------------------

const cornerTarget = (pair: Pair): Target => ({
  piece: (cube) => pieceWith(cube, [Y, FACE_COLOR[pair[0]], FACE_COLOR[pair[1]]]),
  slot: cornerSlot(pair),
  placed: (cube) => cornerPlaced(cube, pair[0], pair[1]),
})

// ---------------------------------------------------------------------------
// 3. The middle edges
// ---------------------------------------------------------------------------

const middleSlot = ([a, b]: Pair): Vec3 => homeOf(`${a}${b}`)
const middlePairAt = (at: Vec3) => CORNER_PAIRS.find((p) => sameAt(middleSlot(p), at)) ?? null

const middleTarget = (pair: Pair): Target => ({
  piece: (cube) => pieceWith(cube, [FACE_COLOR[pair[0]], FACE_COLOR[pair[1]]]),
  slot: middleSlot(pair),
  placed: (cube) => middleEdgePlaced(cube, pair[0], pair[1]),
})

/** The insertions, read held with the edge above the front center: each
 *  two gestures, the slot's corner taken out of the way with the edge,
 *  then brought back with it. */
const RIGHT_PARTS = [parseMoves("U R U' R'"), parseMoves("U' F' U F")]
const LEFT_PARTS = [parseMoves("U' L' U L"), parseMoves("U F U' F'")]
const RIGHT = RIGHT_PARTS.flat()
const LEFT = LEFT_PARTS.flat()

const inserted = (front: Face, moves: readonly Move[]) =>
  moves.map((m) => CUBE_HOLDS.played(front, m) as Move)

/** Whether the picked edge, at its own slot, shows its colors on their
 *  sides (at another slot, either way does). */
function edgeHome(cube: Cube, pick: TutorialPick): boolean {
  const pair = middlePairAt(pick.slot)!
  if (!hasColors(cube[pick.piece]!, [FACE_COLOR[pair[0]], FACE_COLOR[pair[1]]])) return true
  return middleEdgePlaced(cube, pair[0], pair[1])
}

/**
 * How to take an edge to a slot: the way to hold the puzzle, and the
 * formula. Out of the middle layer first if it stands in a slot (an
 * insertion there lifts it); then, its top color read, to the right from
 * the slot's left side, or to the left from its right side, the top
 * turned to bring it above that side's center. The turn of the top stays
 * apart from the insertion, which reads as learnt.
 */
function edgePlan(cube: Cube, pick: TutorialPick): { hold: Hold; moves: Move[] } | null {
  const pair = middlePairAt(pick.slot)
  if (!pair) return null
  const [left, right] = pair
  const moves: Move[] = []
  const play = (more: Move[]) => {
    moves.push(...more)
    cube = applyMoves(cube, more)
  }
  const at = () => cube[pick.piece]!.position
  if (sameAt(at(), pick.slot) && edgeHome(cube, pick)) return { hold: left as Hold, moves: [] }
  const from = middlePairAt(at())
  if (from) play(inserted(from[0], RIGHT))
  const top = colorAt(cube[pick.piece]!, 'U')
  const home = hasColors(cube[pick.piece]!, [FACE_COLOR[left], FACE_COLOR[right]])
  const toLeft = home && top === FACE_COLOR[left]
  const front = toLeft ? right : left
  const turns = ([0, 1, 2, 3] as const).find((amount) =>
    sameAt(
      amount ? applyMoves(cube, [{ face: 'U', amount }])[pick.piece]!.position : at(),
      homeOf(`U${front}`),
    ),
  )
  if (turns === undefined) return null
  if (turns) play([{ face: 'U', amount: turns }])
  play(inserted(front, toLeft ? LEFT : RIGHT))
  return sameAt(at(), pick.slot) && (!home || edgeHome(cube, pick))
    ? { hold: front as Hold, moves }
    : null
}

/** An edge with neither yellow nor white: a middle edge. */
const isMiddleEdge = (cube: Cube, i: number) =>
  cube[i]!.stickers.length === 2 && !cube[i]!.stickers.some((s) => s.color === W || s.color === Y)

// ---------------------------------------------------------------------------
// The plan
// ---------------------------------------------------------------------------

/** A side slot's pair, from a target's slot (corner or middle edge). */
const pairOf = (slot: Vec3) => (cornerPairAt(slot) ?? middlePairAt(slot))!

export const CUBE3_TUTORIAL = tutorialOf({
  stages: [
    // The centers put back first: all the steps read them as their frame.
    {
      kind: 'formula',
      key: 'stepRecenter',
      done: centersHome,
      hold: 'F',
      formula: recenter,
    },
    {
      kind: 'pieces',
      key: 'stepTutorialCross',
      stage: 1,
      targets: SIDES.map(crossTarget),
      marker: Y,
      words: true,
      hold: () => 'F',
      formula: crossFormula,
    },
    {
      kind: 'pieces',
      key: 'stepTutorialCorner',
      stage: 2,
      targets: CORNER_PAIRS.map(cornerTarget),
      marker: Y,
      words: true,
      algorithms: [[TRIGGER]],
      // Held with the slot front right: its trigger reads R U R' U'.
      hold: (_, pick, next) => pairOf(pick?.slot ?? next.slot)[0] as Hold,
      formula: (cube, pick) => cornerFormula(cube, pick, Y),
      checked: true,
    },
    {
      kind: 'pieces',
      key: 'stepTutorialMiddle',
      stage: 3,
      targets: CORNER_PAIRS.map(middleTarget),
      algorithms: [RIGHT_PARTS, LEFT_PARTS],
      pickable: (cube, placed) =>
        cube.flatMap((_, i) => (isMiddleEdge(cube, i) && !placed.includes(i) ? [i] : [])),
      // Held as the formula from where the step began reads.
      hold: (begun, pick, next) =>
        (pick && edgePlan(begun, pick)?.hold) || (pairOf(next.slot)[0] as Hold),
      formula: (cube, pick) => edgePlan(cube, pick)?.moves ?? null,
      checked: true,
    },
    ...LAST_LAYER,
  ],
})
