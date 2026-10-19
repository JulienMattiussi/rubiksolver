import { FACE_NORMAL, PLANE_NORMALS } from '../../core/geometry'
import type { FaceLabels } from '../../core/notation'
import type { Color, Cube, Cubie, Face, GhostMove, GhostSide, Vec3 } from '../../core/types'

/**
 * The Floppy Ghost (fan2cube.fr/floppyghost1, the Floppy Megaminx Ghost): a
 * square plate cut along the five lines of a pentagram. Its mechanism is a
 * Floppy Megaminx: a fixed center (the pentagon), and around it five edges
 * (the star's points) and five corners (between two points). A turn flips
 * one side over, a half turn about the axis through the center
 * perpendicular to that side's cut: its edge flips in place, its two
 * corners swap and flip. The pentagram is slanted in the square (and a
 * little off its center), so every piece has its own shape, which a turn
 * lays across: the puzzle changes form.
 *
 * The model stays integer. Its ten slots go round the center every 36
 * degrees, clockwise from the top edge: slot m is at 81 - 36m degrees (even
 * m: the edge of side m / 2, odd: the corner after it). Sticker normals are
 * the front and back (z) and the plane directions every 18 degrees
 * (`PLANE_NORMALS`, index j at 18j). Side k's axis lies at 81 - 72k
 * degrees, so its half turn reflects the plane about it:
 *   slot m -> 4k - m (mod 10), direction j -> 9 - 8k - j (mod 20), z -> -z.
 * Positions are integer points near each slot's direction, only ever told
 * apart (`GHOST_SLOTS`); the drawing (three/puzzles/flat/ghostGeometry.ts) holds the
 * real shapes.
 */

/** The sides, in turn order (k = 0..4, clockwise from the top). */
export const GHOST_SIDES: readonly GhostSide[] = ['U', 'R', 'D', 'B', 'L']

/** Each slot's position, by slot index m (direction 81 - 36m degrees). */
export const GHOST_SLOTS: readonly Vec3[] = [
  [0, 3, 0], // the top edge
  [2, 2, 0],
  [3, 0, 0], // the right edge
  [3, -1, 0],
  [1, -3, 0], // the bottom right edge
  [0, -3, 0],
  [-2, -2, 0], // the bottom left edge
  [-3, 0, 0],
  [-3, 1, 0], // the left edge
  [-1, 3, 0],
]

const SLOT_OF = new Map(GHOST_SLOTS.map((p, m) => [p.join(), m]))
const DIRECTION_OF = new Map(PLANE_NORMALS.map((n, j) => [n.join(), j]))

/** The slot index of a position, if it is a slot (the center is none). */
export const ghostSlot = (position: Vec3): number | undefined => SLOT_OF.get(position.join())

/** Whether a slot holds corners (odd) rather than edges (even). */
export const isCornerSlot = (position: Vec3): boolean => (ghostSlot(position) ?? 0) % 2 === 1

/** The plane direction index of a normal (18j degrees), if it lies in the plane. */
export const ghostDirection = (normal: Vec3): number | undefined => DIRECTION_OF.get(normal.join())

/**
 * The square's sides each piece reaches when solved, by slot (the drawing
 * derives them from the geometry and its test checks they agree): the top
 * corners hold the square's top corners, the bottom one between the two
 * bottom edges holds a stretch of the bottom only.
 */
const SIDES_OF_SLOT: readonly (readonly Face[])[] = [
  ['U'],
  ['U', 'R'],
  ['R'],
  ['R', 'D'],
  ['D'],
  ['D'],
  ['D', 'L'],
  ['L'],
  ['L'],
  ['L', 'U'],
]

/** Colors of the plate: green in front, blue behind, white on top, yellow
 *  below, red right, orange left (the cube's scheme; the puzzle is drawn
 *  silver, these only tell its pieces apart). */
const COLOR: Record<Face, Color> = { F: 'G', B: 'B', U: 'W', D: 'Y', R: 'R', L: 'O' }

const sticker = (face: Face) => ({ normal: FACE_NORMAL[face], color: COLOR[face] })

/**
 * The solved Floppy Ghost: the center, then the edges, then the corners.
 * Edges come before corners because a search finds pieces by their colors
 * (pieceSearch.ts), and two pairs of them match (the bottom right edge and
 * the bottom corner, the left edge and the lower left corner): edges never
 * leave their slots, so they must take their own first.
 */
export function solvedGhost(): Cube {
  const order = [0, 2, 4, 6, 8, 1, 3, 5, 7, 9]
  return [
    { position: [0, 0, 0], stickers: [sticker('F'), sticker('B')] },
    ...order.map((m): Cubie => ({
      position: GHOST_SLOTS[m]!,
      stickers: [sticker('F'), sticker('B'), ...SIDES_OF_SLOT[m]!.map(sticker)],
    })),
  ]
}

const mod = (a: number, n: number) => ((a % n) + n) % n

/** Side k's half turn on a normal: the plane direction reflected about its
 *  axis, front and back swapped. */
function flipNormal(k: number, normal: Vec3): Vec3 {
  if (normal[2] !== 0) return [0, 0, -normal[2]]
  const j = ghostDirection(normal)
  if (j === undefined) throw new Error(`ghost: unknown normal ${normal.join()}`)
  return PLANE_NORMALS[mod(9 - 8 * k - j, 20)]!
}

/** Whether side k's turn carries a piece at `position`: its edge and the
 *  corners on either side of it. */
export function ghostTurns(move: GhostMove, position: Vec3): boolean {
  const m = ghostSlot(position)
  const k = GHOST_SIDES.indexOf(move.side)
  return m !== undefined && Math.abs(mod(m - 2 * k + 1, 10) - 1) <= 1
}

export function applyGhostMove(cube: Cube, move: GhostMove): Cube {
  const k = GHOST_SIDES.indexOf(move.side)
  return cube.map((c) => {
    if (!ghostTurns(move, c.position)) return c
    return {
      position: GHOST_SLOTS[mod(4 * k - ghostSlot(c.position)!, 10)]!,
      stickers: c.stickers.map((s) => ({ normal: flipNormal(k, s.normal), color: s.color })),
    }
  })
}

/** The axis a side turns about, in the renderer's frame (x right, y up). */
export function ghostAxis(side: GhostSide): [number, number, number] {
  const angle = ((81 - 72 * GHOST_SIDES.indexOf(side)) * Math.PI) / 180
  return [Math.cos(angle), Math.sin(angle), 0]
}

/** Every turn: one per side, each its own inverse. */
export const GHOST_TURNS: readonly GhostMove[] = GHOST_SIDES.map((side) => ({ side }))

/** A scramble: sides at random, never the same twice in a row (it would
 *  undo itself). */
export function scrambleGhost(length: number, rng: () => number): GhostMove[] {
  const moves: GhostMove[] = []
  while (moves.length < length) {
    const side = GHOST_SIDES[Math.floor(rng() * GHOST_SIDES.length)]!
    if (side !== moves[moves.length - 1]?.side) moves.push({ side })
  }
  return moves
}

/** Drop the pairs of the same side in a row: each undoes the other. */
export function simplifyGhostMoves(moves: readonly GhostMove[]): GhostMove[] {
  const out: GhostMove[] = []
  for (const move of moves) {
    if (out[out.length - 1]?.side === move.side) out.pop()
    else out.push(move)
  }
  return out
}

/** Letters of each side: the international ones, or fan2cube's French Haut,
 *  Droite, Bas, Postérieur, Gauche (the bottom left is its P). */
const LETTERS: Record<'us' | 'fr', Record<GhostSide, string>> = {
  us: { U: 'U', R: 'R', D: 'D', B: 'B', L: 'L' },
  fr: { U: 'H', R: 'D', D: 'B', B: 'P', L: 'G' },
}

/** A turn as written: its side's letter and `2`, a half turn (fan2cube's
 *  `H²`). */
export function formatGhostMove(move: GhostMove, labels: FaceLabels): string {
  return `${LETTERS[labels.U === 'U' ? 'us' : 'fr'][move.side]}2`
}

/** Parse fan2cube's formulas (`D²B²P²G² .P² B²D²H²`, `(H²D²)^3`): one letter
 *  per side, each a half turn (`²` or `2` optional), `(...)²`, `(...)^n` or
 *  `(...)n` repeated. */
export function parseGhostMoves(text: string): GhostMove[] {
  const side = (letter: string): GhostSide => {
    const found = GHOST_SIDES.find((s) => LETTERS.fr[s] === letter)
    if (!found) throw new Error(`parseGhostMoves: unknown side "${letter}"`)
    return found
  }
  const expanded = text.replace(/\(([^()]*)\)(?:\^?(\d)|²)/g, (_, body: string, n?: string) =>
    ` ${body} `.repeat(Number(n ?? 2)),
  )
  return [...expanded.replace(/[²2.\s]/g, '')].map((letter) => ({ side: side(letter) }))
}
