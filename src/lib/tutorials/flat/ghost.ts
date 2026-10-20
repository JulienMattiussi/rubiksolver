import { solvedCube } from '../../core/cube'
import { FACE_NORMAL, vecKey } from '../../core/geometry'
import type { HoldFrame } from '../../core/hold'
import { allTurnsOf } from '../../core/moveSet'
import { simplifyMoves } from '../../core/moves'
import { atHome, sameAt } from '../../core/pieces'
import { turnedBy } from '../../core/turn'
import type { Cube, Cubie, GhostMove, Vec3 } from '../../core/types'
import { aroundGhost, CYCLE_CORNERS, FLIP_EDGES, TURN_CORNERS } from '../../methods/flat/ghost'
import { GHOST_SLOTS, ghostSlot, isCornerSlot } from '../../puzzles/flat/ghost'
import { searchFormulas } from '../../solve/formulaSearch'
import { tutorialOf, type Kept, type Target } from '../../teach/kit'
import type { PieceStage } from '../../teach/stages'
import type { Term, TutorialPick } from '../../teach/tutorial'

/**
 * The Floppy Ghost's tutorial, corners then edges (its method,
 * methods/flat/ghost.ts). All silver, its pieces are told by their shape:
 * a legend names them (corners A to E, edges 1 to 5, clockwise from the
 * top), each pictured front and back, and the instructions call them so;
 * the corner top left, as it stands, tells how to hold it.
 * Held one way only (the square plate has no symmetry its mechanism keeps),
 * each formula played as it is, from whichever side it is needed:
 *   1. the corners to their places, either way up, one at a time: single
 *      turns and the 3-cycle `(H²D²)²`, the corners placed kept;
 *   2. the corners turned over, two side by side at a time, by
 *      `D²B²P²G².P²B²D²H²`;
 *   3. the edges flipped, two side by side at a time, by `(H²D²)³`.
 */

const SOLVED = solvedCube('ghost')

/** A piece by its slot: odd ones hold corners, even ones edges, none the
 *  center. */
function pieceKind(cubie: Cubie): string {
  if (ghostSlot(cubie.position) === undefined) return 'center'
  return isCornerSlot(cubie.position) ? 'corner' : 'edge'
}

/** The piece solved at slot `m`. */
const pieceAt = (m: number) => SOLVED.findIndex((c) => sameAt(c.position, GHOST_SLOTS[m]!))

/** Corners A to E and edges 1 to 5, clockwise from the top. */
const CORNER_SLOTS = [1, 3, 5, 7, 9]
const EDGE_SLOTS = [0, 2, 4, 6, 8]
const LABELS = [
  ...CORNER_SLOTS.map((m, i) => ({ piece: pieceAt(m), label: 'ABCDE'[i]! })),
  ...EDGE_SLOTS.map((m, i) => ({ piece: pieceAt(m), label: String(i + 1) })),
]

/** The corner standing top left (slot 9), whichever it is. */
const TOP_LEFT = GHOST_SLOTS[9]!
const topLeft = (cube: Cube) => cube.findIndex((c) => sameAt(c.position, TOP_LEFT))

/** Its front is green (drawn silver): a piece showing it behind is turned
 *  over. */
const turned = (cubie: Cubie) =>
  cubie.stickers.some((s) => s.color === 'G' && sameAt(s.normal, FACE_NORMAL.B))

/** Held one way: each formula read as it is. */
const ONE_HOLD: HoldFrame = {
  holds: ['F'],
  front: () => FACE_NORMAL.F,
  down: FACE_NORMAL.D,
  inHold: (_, turn) => turn,
  played: (_, turn) => turn,
}

const TURNS = (allTurnsOf('ghost').turns as GhostMove[]).map((t) => [t])

/** What a stage's searches read of a state: its pieces of a kind. */
const keyOf = (kind: string) => (cube: Cube) =>
  cube
    .filter((c) => pieceKind(c) === kind)
    .map((c) => vecKey(c.position) + c.stickers.map((s) => vecKey(s.normal)).join())
    .join('|')

/** A stage placing pieces of a kind (`slots`), one at a time, each pick
 *  taken where it goes by the fewest of `formulas`, the pieces placed
 *  kept; `placed` says when a piece is. */
function stage(
  key: string,
  rank: number,
  kind: string,
  slots: readonly number[],
  formulas: readonly (readonly GhostMove[])[],
  placed: (cube: Cube, piece: number, slot: Vec3) => boolean,
): PieceStage {
  const target = (m: number): Target => {
    const piece = pieceAt(m)
    const slot = GHOST_SLOTS[m]!
    return { piece: () => piece, slot, placed: (cube) => placed(cube, piece, slot) }
  }
  // A turn and a formula starting with the same turn cancel where they
  // meet (U2 then U2 R2 U2 R2): merged, the formula plays what it does.
  const formula = (cube: Cube, pick: TutorialPick, kept: Kept) => {
    const found = searchFormulas(
      cube,
      formulas,
      (c) =>
        kept.targetsKept(c) &&
        sameAt(c[pick.piece]!.position, pick.slot) &&
        (pieceAt(ghostSlot(pick.slot)!) !== pick.piece || placed(c, pick.piece, pick.slot)),
      { depth: 4, key: keyOf(kind) },
    )
    return found && simplifyMoves(found)
  }
  return {
    kind: 'pieces',
    key,
    stage: rank,
    targets: slots.map(target),
    words: true,
    hold: () => 'F',
    formula,
  }
}

const at = (cube: Cube, piece: number, slot: Vec3) => sameAt(cube[piece]!.position, slot)
const home = (cube: Cube, piece: number, slot: Vec3) =>
  at(cube, piece, slot) && atHome(cube[piece]!, 'ghost')

const withKind = (kind: string) => (cube: Cube) =>
  cube.flatMap((c, i) => (pieceKind(c) === kind ? [i] : []))
const GHOST_CORNER: Term = { key: 'termGhostCorner', pieces: withKind('corner') }
const GHOST_EDGE: Term = { key: 'termGhostEdge', pieces: withKind('edge') }
/** A turn: the right side flipped over, its edge and corners. */
const FLIP_RIGHT: GhostMove = { side: 'R' }
const GHOST_TURN: Term = {
  key: 'termGhostTurn',
  pieces: (cube) => cube.flatMap((_, i) => (turnedBy(cube, FLIP_RIGHT)(i) ? [i] : [])),
  demo: FLIP_RIGHT,
}

export const GHOST_TUTORIAL = tutorialOf({
  frame: ONE_HOLD,
  holding: 'ghost',
  // Silver all over: the hold is told by the legend's anchor, not a color
  // (one is needed for a hold to be told at all).
  faceColor: () => 'W',
  pieceKind,
  // The hold told by the corner top left as it stands: every piece's pose
  // has its own shape, so its picture says which way up and which side.
  legend: { labels: LABELS, turned, anchor: topLeft },
  glossary: [GHOST_CORNER, GHOST_EDGE, GHOST_TURN],
  stages: [
    stage(
      'stepTutorialGhostCorners',
      1,
      'corner',
      CORNER_SLOTS,
      [...TURNS, ...aroundGhost(CYCLE_CORNERS)],
      at,
    ),
    stage('stepTutorialGhostTwist', 2, 'corner', CORNER_SLOTS, aroundGhost(TURN_CORNERS), home),
    stage('stepTutorialGhostEdges', 3, 'edge', EDGE_SLOTS, aroundGhost(FLIP_EDGES), home),
  ],
})
