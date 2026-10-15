import { FACE_SPEC } from '../../core/geometry'
import { applyMove } from '../../core/turn'
import type { FaceLabels } from '../../core/moves'
import type { Cube, Face, Move } from '../../core/types'

/**
 * The Fashion-V (fan2cube.fr/fashioncube1, Adam Cowan and Jason Smith,
 * 2010): a 3x3x5 squashed to a cube, its top two layers (H, h) and its
 * bottom two (b, B) half as thick as its equator. It turns like a 5x5x5
 * whose pieces fill its middle 3x3x5, as the 2x2x4 like a 4x4x4: a side by
 * blocks (Rw: the outer column of cells), a quarter, which always goes and
 * stands its pairs (a top piece and the one under it) on their side; a
 * whole half (H*: H and h) too. A thin layer alone only goes when its half
 * is laid, every pair in it lying: both its layers whole, a 3x3 of nine
 * pieces each (an equator edge, thick, never goes in). The equator does not
 * turn: its centers never move. Drawn as the cube it stays
 * (three/puzzles/twisted/fashionGeometry.ts).
 */

/** The 3x3 of nine pieces a layer holds when whole. */
const whole = (cube: Cube, y: number) =>
  cube.filter(
    (c) => c.position[1] === y && Math.abs(c.position[0]) <= 1 && Math.abs(c.position[2]) <= 1,
  ).length === 9

/** Whether a turn goes: a block or a half always, a thin layer alone when
 *  its half is laid; no side alone, nor the equator. */
export function fashionTurns(cube: Cube, move: Move): boolean {
  if (move.wide) return move.depth === 2
  if (FACE_SPEC[move.face].coordIndex !== 1 || move.depth === 3) return false
  const side = FACE_SPEC[move.face].dir
  return whole(cube, 2 * side) && whole(cube, side)
}

/** In its box: its thin layers, which part the pairs (a top piece from the
 *  one under it), and its sides' blocks by halves, which swap the top and
 *  the bottom. */
const IN_BOX: Move[] = [
  ...(['U', 'D'] as Face[]).flatMap((face) =>
    ([1, 2, 3] as const).flatMap((amount): Move[] => [
      { face, amount },
      { face, amount, depth: 2 },
    ]),
  ),
  ...(['R', 'L', 'F', 'B'] as Face[]).map((face): Move => ({
    face,
    amount: 2,
    depth: 2,
    wide: true,
  })),
]

/** Its blocks' turns: each side's column and each half, a quarter either
 *  way or a half, three by face. */
export const BLOCK_TURNS: Move[] = (['U', 'D', 'R', 'L', 'F', 'B'] as Face[]).flatMap((face) =>
  ([1, 2, 3] as const).map((amount): Move => ({ face, amount, depth: 2, wide: true })),
)

/** Every turn it has: the thin layers and the blocks. */
const ALL: Move[] = [...IN_BOX, ...BLOCK_TURNS]

const sameLayer = (a: Move, b: Move) =>
  a.face === b.face && a.depth === b.depth && a.wide === b.wide

/** A scramble: first in its box, its pairs parted (else its blocks alone
 *  would never part them), then by any turn that goes; never the same
 *  layer twice in a row. */
export function scrambleFashion(length: number, rng: () => number, start: Cube): Move[] {
  const moves: Move[] = []
  let cube = start
  while (moves.length < length) {
    const pool = (moves.length < length / 2 ? IN_BOX : ALL).filter(
      (m) => fashionTurns(cube, m) && !(moves.length && sameLayer(m, moves[moves.length - 1]!)),
    )
    const move = pool[Math.floor(rng() * pool.length)]!
    cube = applyMove(cube, move)
    moves.push(move)
  }
  return moves
}

const SUFFIX = { 1: '', 2: '2', 3: "'" } as const

/** A turn as fan2cube writes the Fashion-V's: a side's block by its face
 *  (D for Rw), a half by its face and a star (H* for Uw), a thin layer by
 *  its face (H), the one under it in lowercase (h). */
export function formatFashionMove(move: Move, labels: FaceLabels): string {
  const letter = labels[move.face]
  const vertical = move.face === 'U' || move.face === 'D'
  let name = letter
  if (move.wide && vertical) name = `${letter}*`
  else if (!move.wide && move.depth) name = letter.toLowerCase()
  return name + SUFFIX[move.amount]
}
