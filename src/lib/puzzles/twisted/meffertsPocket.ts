import { axisOf, FACE_SPEC, mapPiece, mapVec } from '../../core/geometry'
import { senseOf, type MoveDescription } from '../../core/guide'
import { AMOUNT_SUFFIX, type FaceLabels } from '../../core/notation'
import type { Color, Cube, Cubie, Face, Move, Sticker, Vec3 } from '../../core/types'

/**
 * Meffert's Pocket Cube (sold all violet but one corner): a 2x2x2 whose corner piece A,
 * up front right, is cut again into a 2x2x2 of mini cubes, and whose core is
 * A's inner mini cube, the one touching the puzzle's center. Its faces turn
 * about that core, a quarter of the puzzle's width off the center: a turn
 * sends its layer out of the box, so it shifts shape. All violet but A,
 * whose three faces are blue, yellow and lime: solved when it is a cube
 * again, A's colors each on one face.
 *
 * Integer model, in half mini cubes about the core: a mini cube is 2 wide,
 * centered on even coordinates (0 or 2 solved, the core at the origin), a
 * big cube 4 wide, on odd ones (-3 or 1 solved). The solved puzzle spans -5
 * to 3 on every axis. Each axis is cut on both sides of the core, at -1 and
 * 1, and a face turns what lies beyond its cut: the pieces at 2 or more
 * along it (at -2 or less), as on a 5x5's grid (its outer slab), so the
 * engine turns it as is. A big cube centered on a cut (at 1 or -1) straddles
 * it and jams that face; a mini cube never does.
 *
 * Its two cuts on an axis are alike: solved, the one by A (at 1) takes off
 * a thin layer, the other (at -1) splits it in halves, both of which turn
 * (D's outer layer, U's wide one). Turning the one half or the other is the
 * same, held another way: whatever way it stands about its core, it is
 * boxed, solved, and solved by the same turns, turned.
 */

/** Half the width of a piece: its coordinates' parity tells (minis even). */
export const half = (c: Cubie) => (Math.abs(c.position[0]) % 2 === 1 ? 2 : 1)

const axis = (a: number, sign: number): Vec3 => mapVec([0, 1, 2], (d) => (d === a ? sign : 0))

/** A's colors, by the axis its face looks along (the right yellow, the top
 *  lime, the front blue). */
const A_COLORS: readonly Color[] = ['Y', 'L', 'B']

/** The solved Meffert's Pocket Cube: the 7 big cubes, all violet, then A's 8 minis (the
 *  core first, hidden), in A's colors. */
export function solvedMeffertsPocket(): Cube {
  const signs = [-1, 1]
  const bigs = signs.flatMap((x) =>
    signs.flatMap((y) =>
      signs
        .map((z): Vec3 => [x, y, z])
        .filter((s) => s.some((v) => v < 0))
        .map((s): Cubie => ({
          position: mapVec(s, (v) => (v < 0 ? -3 : 1)),
          stickers: s.map((v, a): Sticker => ({ normal: axis(a, v), color: 'V' })),
        })),
    ),
  )
  const minis = [0, 2].flatMap((x) =>
    [0, 2].flatMap((y) =>
      [0, 2].map((z): Cubie => ({
        position: [x, y, z],
        stickers: [x, y, z].flatMap((v, a): Sticker[] =>
          v === 2 ? [{ normal: axis(a, 1), color: A_COLORS[a]! }] : [],
        ),
      })),
    ),
  )
  return [...bigs, ...minis]
}

/** The box around its pieces, on each axis: its low and high sides. */
function boxOf(cube: Cube): { lo: Vec3; hi: Vec3 } {
  const lo = mapVec([0, 1, 2], (a) => Math.min(...cube.map((c) => c.position[a]! - half(c))))
  const hi = mapVec([0, 1, 2], (a) => Math.max(...cube.map((c) => c.position[a]! + half(c))))
  return { lo, hi }
}

/** Whether it is a cube again: its pieces, 8 wide on every axis, fill
 *  their box (as wide as the solved one, -5 to 3, wherever it stands: held
 *  another way, after both halves of an axis turned, it lies elsewhere about
 *  its core). */
export const meffertsPocketBoxed = (cube: Cube): boolean => {
  const { lo, hi } = boxOf(cube)
  return [0, 1, 2].every((a) => hi[a]! - lo[a]! === 8)
}

/** Whether Meffert's Pocket Cube is solved: a cube again, A's colors outside (each
 *  sticker on the side of the box its normal points to), one a face. Held
 *  turned about A, or another way, its colors go round: still solved. */
export function meffertsPocketSolved(cube: Cube): boolean {
  if (!meffertsPocketBoxed(cube)) return false
  const { lo, hi } = boxOf(cube)
  const faceColor = new Map<string, Color>()
  for (const c of cube) {
    for (const s of c.stickers) {
      if (s.color === 'V') continue
      const a = axisOf(s.normal)
      const side = s.normal[a]! > 0 ? hi[a] : lo[a]
      if (c.position[a]! + s.normal[a]! * half(c) !== side) return false
      const face = s.normal.join()
      if ((faceColor.get(face) ?? s.color) !== s.color) return false
      faceColor.set(face, s.color)
    }
  }
  return new Set(faceColor.values()).size === 3
}

/** Whether a face can turn: no big cube straddles its cut. A half on the
 *  far side of the core (a wide turn) turns on the opposite face's cut. */
export function meffertsPocketTurns(cube: Cube, move: Pick<Move, 'face' | 'wide'>): boolean {
  const { coordIndex, dir } = FACE_SPEC[move.face]
  const cut = move.wide ? -dir : dir
  return !cube.some((c) => half(c) === 2 && c.position[coordIndex] === cut)
}

/** A half seen from U, R or F, beyond the cut that splits the solved puzzle
 *  in two: a wide turn of four of its five layers. */
const MEFFERTS_POCKET_HALF: Pick<Move, 'depth' | 'wide'> = { depth: 4, wide: true }

/** The faces whose outer layer is the thin one by A (held as solved). */
const NEAR_A: readonly Face[] = ['U', 'R', 'F']

/** The layers a face turns: U, R and F their half, then their thin layer by
 *  A; D, L and B their half (their outer layer). */
export const meffertsPocketLayers = (face: Face): readonly Pick<Move, 'depth' | 'wide'>[] =>
  NEAR_A.includes(face) ? [MEFFERTS_POCKET_HALF, {}] : [{}]

const isThin = (move: Move) => NEAR_A.includes(move.face) && !move.wide

/** What a turn does: a half, or the thin layer by A. */
export function describeMeffertsPocketMove(move: Move): MoveDescription {
  const layer = isThin(move) ? 'thin' : 'half'
  return { kind: 'layers', face: move.face, layer, turn: senseOf(move.amount) }
}

/** A half by its face's letter, the thin layer by A in lowercase (u). */
export function formatMeffertsPocketMove(move: Move, labels: FaceLabels): string {
  const letter = labels[move.face]
  return (isThin(move) ? letter.toLowerCase() : letter) + AMOUNT_SUFFIX[move.amount]
}

/** Meffert's Pocket Cube held another way that keeps its box: a third of a turn about
 *  its diagonal through A (x -> y -> z), its only symmetry. */
export function turnAboutA(cube: Cube): Cube {
  const turn = ([x, y, z]: Vec3): Vec3 => [z, x, y]
  return cube.map(mapPiece(turn))
}
