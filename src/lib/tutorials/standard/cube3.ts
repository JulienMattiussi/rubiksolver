import { FACE_COLOR } from '../../core/cube'
import { FACE_NORMAL } from '../../core/geometry'
import type { Hold } from '../../core/hold'
import { parseMoves } from '../../core/notation'
import { colorAt, hasColors, sameAt } from '../../core/pieces'
import { applyMoves } from '../../core/turn'
import type { Cube, Face, Move, Vec3 } from '../../core/types'
import { CORNER_PAIRS, edgePlaced, middleEdgePlaced } from '../../methods/standard/layers3'
import { homeOf } from '../../methods/standard/pieces3'
import { centersHome, turnHome } from '../../methods/standard/recenter'
import { OUTER_GENERATORS, search, SIDES } from '../../solve/solverKit'
import { tutorialOf, type Kept, type Target } from '../../teach/kit'
import type { FormulaStage, PieceStage } from '../../teach/stages'
import {
  cornerFormula,
  cornerPairAt,
  cornerTarget,
  pieceWith,
  playedIn,
  TRIGGER,
  type Pair,
} from './cornerTrigger'
import { LAST_LAYER } from './cube3LastLayer'
import { CENTER, CLOCKWISE, CORNER, COUNTERCLOCKWISE, EDGE, THICKNESSES } from './terms'
import type { TutorialPick } from '../../teach/tutorial'
import { COMM_UF, COMM_UF_BACK, COMM_UR } from '../../methods/standard/algs'

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
const RIGHT_PARTS = [parseMoves(COMM_UR), parseMoves(COMM_UF_BACK)]
const LEFT_PARTS = [parseMoves("U' L' U L"), parseMoves(COMM_UF)]
const RIGHT = RIGHT_PARTS.flat()
const LEFT = LEFT_PARTS.flat()

const inserted = (front: Face, moves: readonly Move[]) => playedIn(front, moves)

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

/** The first two layers' stages: the yellow cross, the yellow corners, the
 *  middle edges (also a reduced big cube's, through its projection). */
export const FIRST_LAYERS: readonly PieceStage[] = [
  {
    kind: 'pieces',
    key: 'stepTutorialCross',
    stage: 1,
    // The yellow cross, shown done.
    shows: FACE_NORMAL.D,
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
    shows: FACE_NORMAL.D,
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
]

/**
 * Before the stages, the centers home, all the steps reading them as their
 * frame: the cube turned in one's hands, nothing played (the centers keep
 * their places one to another, a middle slice moving them as a turn of the
 * whole cube does). Not once `built` (a tutorial whose stages turn the
 * middle layer or the cube on purpose: Ofapel's). `home` says the centers
 * home (by default a 3x3's; a 5x5's middle ones).
 */
export const holdStage = (
  built: (cube: Cube) => boolean = () => false,
  home: (cube: Cube) => boolean = centersHome,
): FormulaStage => ({
  kind: 'formula',
  key: 'stepHoldCube',
  done: (cube) => built(cube) || (turnHome(cube, home)?.length ?? 0) === 0,
  hold: 'F',
  formula: (cube) => turnHome(cube, home) ?? [],
})

export const CUBE3_TUTORIAL = tutorialOf({
  glossary: [CENTER, EDGE, CORNER, CLOCKWISE, COUNTERCLOCKWISE, ...THICKNESSES],
  stages: [holdStage(), ...FIRST_LAYERS, ...LAST_LAYER],
})
