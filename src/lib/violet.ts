import { FACE_SPEC } from './geometry'
import type { Color, Cube, Cubie, Face, Sticker, Vec3 } from './types'

/**
 * The Violet (its maker's name forgotten): a 2x2x2 whose corner piece A,
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
 */

/** Half the width of a piece: its coordinates' parity tells (minis even). */
const half = (c: Cubie) => (Math.abs(c.position[0]) % 2 === 1 ? 2 : 1)

const axis = (a: number, sign: number): Vec3 =>
  [0, 1, 2].map((d) => (d === a ? sign : 0)) as unknown as Vec3

/** A's colors, by the axis its face looks along (the top yellow, the front
 *  blue, the right lime). */
const A_COLORS: readonly Color[] = ['L', 'Y', 'B']

/** The solved Violet: the 7 big cubes, all violet, then A's 8 minis (the
 *  core first, hidden), in A's colors. */
export function solvedViolet(): Cube {
  const signs = [-1, 1]
  const bigs = signs.flatMap((x) =>
    signs.flatMap((y) =>
      signs
        .map((z): Vec3 => [x, y, z])
        .filter((s) => s.some((v) => v < 0))
        .map((s): Cubie => ({
          position: s.map((v) => (v < 0 ? -3 : 1)) as unknown as Vec3,
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

/** Whether every piece is back in the solved box (-5 to 3): then they fill
 *  it, and the Violet is a cube again. */
export const violetBoxed = (cube: Cube): boolean =>
  cube.every((c) => c.position.every((v) => v - half(c) >= -5 && v + half(c) <= 3))

/** Whether the Violet is solved: a cube again, A's colors outside (on its
 *  minis at 2 along their normal, which points out), one a face. Held
 *  turned about A, its colors go round: still solved. */
export function violetSolved(cube: Cube): boolean {
  if (!violetBoxed(cube)) return false
  const faceColor = new Map<number, Color>()
  for (const c of cube) {
    for (const s of c.stickers) {
      if (s.color === 'V') continue
      const a = s.normal.findIndex((v) => v !== 0)
      if (s.normal[a] !== 1 || c.position[a] !== 2) return false
      if ((faceColor.get(a) ?? s.color) !== s.color) return false
      faceColor.set(a, s.color)
    }
  }
  return new Set(faceColor.values()).size === 3
}

/** Whether a face can turn: no big cube straddles its cut. */
export function violetTurns(cube: Cube, face: Face): boolean {
  const { coordIndex, dir } = FACE_SPEC[face]
  return !cube.some((c) => half(c) === 2 && c.position[coordIndex] === dir)
}

/** The Violet held another way that keeps its box: a third of a turn about
 *  its diagonal through A (x -> y -> z), its only symmetry. */
export function turnAboutA(cube: Cube): Cube {
  const turn = ([x, y, z]: Vec3): Vec3 => [z, x, y]
  return cube.map((c) => ({
    position: turn(c.position),
    stickers: c.stickers.map((s) => ({ normal: turn(s.normal), color: s.color })),
  }))
}
