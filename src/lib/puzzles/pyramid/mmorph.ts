import type { Cube, Cubie, Vec3 } from '../../core/types'
import { MARK } from '../../core/types'
import { mapVec } from '../../core/geometry'

/**
 * The Master Morphinx (fan2cube.fr/mastermorphinx1, Aleh Hladzilin and Adam
 * Cowan, 2009): "un Super 3x3x3 déguisé", a 3x3x3 cut to a tetrahedron, as
 * the Pyramorphinx is a 2x2 (three/puzzles/pyramid/mmorphGeometry.ts). Its four big corners
 * hold the tetrahedron's corners (three colors), its four small ones sit in
 * the middle of its faces (one color: their twist never shows), its six
 * centers on its edges (two colors: every quarter turn shows), its twelve
 * edges between. Turned, its pieces stick out at odd angles: it shifts
 * shape, never blocking.
 *
 * Its model is the 3x3's (its colors only tell pieces apart), each center
 * marked by a hidden sticker (as the Fisher Cube's side centers, fisher.ts),
 * pointing along the next axis when home.
 */

/** A center's mark when home: along the next axis. */
const markOf = (axis: number): Vec3 => mapVec([0, 1, 2], (d) => (d === (axis + 1) % 3 ? 1 : 0))

const isCenter = (c: Cubie) => c.position.filter((v) => v !== 0).length === 1

/** A 3x3 as a Master Morphinx: its centers marked. */
export const withCenterMarks = (cube: Cube): Cube =>
  cube.map((c) =>
    isCenter(c) && c.stickers.length === 1
      ? {
          ...c,
          stickers: [
            ...c.stickers,
            { normal: markOf(c.position.findIndex((v) => v !== 0)), color: MARK },
          ],
        }
      : c,
  )

/** The 3x3 it is, its centers' marks set aside. */
export const withoutCenterMarks = (cube: Cube): Cube =>
  cube.map((c) =>
    c.stickers.some((s) => s.color === MARK)
      ? { ...c, stickers: c.stickers.filter((s) => s.color !== MARK) }
      : c,
  )

/** Whether a corner is a small one: off the tetrahedron's corners (the
 *  product of its home coordinates' signs negative), by its colors. */
const SMALL = new Set(['W,R,B', 'W,O,G', 'Y,R,G', 'Y,O,B'].map((k) => k.split(',').sort().join()))
export const isSmallCorner = (c: Cubie): boolean =>
  c.stickers.length === 3 &&
  SMALL.has(
    c.stickers
      .map((s) => s.color)
      .sort()
      .join(),
  )

/** A corner turned a third about its diagonal. */
function twisted(c: Cubie): Cubie {
  const [x, y, z] = c.position
  const turn = ([a, b, d]: Vec3): Vec3 => {
    // (x, y, z) -> (y, z, x) about (1, 1, 1), conjugated by the signs.
    const u: Vec3 = [a * x, b * y, d * z]
    const t: Vec3 = x * y * z > 0 ? [u[1], u[2], u[0]] : [u[2], u[0], u[1]]
    return [t[0] * x + 0, t[1] * y + 0, t[2] * z + 0]
  }
  return { ...c, stickers: c.stickers.map((s) => ({ ...s, normal: turn(s.normal) })) }
}

/** A corner's twist, in thirds: where its white or yellow sticker faces. */
const twistOf = (c: Cubie) => {
  const s = c.stickers.find((t) => t.color === 'W' || t.color === 'Y')!
  const axis = s.normal.findIndex((v) => v !== 0)
  const hand = c.position[0]! * c.position[1]! * c.position[2]!
  return ((((axis - 1) * hand) % 3) + 3) % 3
}

/** A small corner as it shows: its white or yellow up or down. */
const upright = (c: Cubie): Cubie => {
  let out = c
  while (out.stickers.find((t) => t.color === 'W' || t.color === 'Y')!.normal[1] === 0) {
    out = twisted(out)
  }
  return out
}

/** The puzzle as it shows: every small corner upright. */
export const asSeenMorphinx = (cube: Cube): Cube =>
  cube.map((c) => (isSmallCorner(c) ? upright(c) : c))

/** An entered Master Morphinx made real: a small corner twisted as the
 *  others need (nothing shows of it). */
export function withRealCorners(cube: Cube): Cube {
  const sum = cube.filter((c) => c.stickers.length === 3).reduce((n, c) => n + twistOf(c), 0)
  const small = cube.findIndex(isSmallCorner)
  let fixed = cube[small]!
  for (let k = 0; k < 3 && (sum - twistOf(cube[small]!) + twistOf(fixed)) % 3 !== 0; k++) {
    fixed = twisted(fixed)
  }
  return cube.map((c, i) => (i === small ? fixed : c))
}

/** Solved as it shows: every piece home, a small corner either way round,
 *  each center's mark home. Held any way: the centers say how. */
export function mmorphSolved(cube: Cube, held: readonly Cube[]): boolean {
  const key = (c: Cubie) =>
    c.position.join() +
    (isSmallCorner(c)
      ? ''
      : c.stickers
          .map((s) => s.normal.join() + s.color)
          .sort()
          .join())
  const seen = new Set(cube.map(key))
  return held.some((h) => h.every((c) => seen.has(key(c))))
}
