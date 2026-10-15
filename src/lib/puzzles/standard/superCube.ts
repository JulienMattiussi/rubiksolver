import type { Color, Cube, Cubie, Sticker, Vec3 } from '../../core/types'
import { mapVec } from '../../core/geometry'

/**
 * The Super Revenge and the Super Professor (fan2cube.fr/superrevenge1 and
 * superprofessor1): a 4x4x4 and a 5x5x5 whose centers are each their own
 * piece, so that each must go back to its place (its way round with it: a
 * center reaches each slot one way only, but the Professor's middle ones
 * turn in place).
 *
 * A center shows it by borders, on its sides toward the edges of its face
 * (both for a 4x4's center or a 5x5's corner one, one for a 5x5's edge one,
 * all four for its middle one), each the color of the face beyond it. In
 * the model a border is a sticker on that side of the center (its normal
 * across the face), of that color: solved, it faces the way that color's
 * face does, so "each direction one color" still says solved; and a center
 * is told by its colors, its own one first.
 */

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]

/** How far out the outer layer is (3 on a 4x4's grid, 2 on a 5x5's). */
const reachOf = (cube: Cube) => Math.max(...cube.map((c) => Math.max(...c.position.map(Math.abs))))

/** Whether a sticker shows on the outside (not a center's border). */
export const isOuter = (c: Cubie, s: Sticker, reach: number) => dot(c.position, s.normal) === reach

/** Whether a cubie is a center: on one face only. */
const isCenter = (c: Cubie, reach: number) =>
  c.position.filter((v) => Math.abs(v) === reach).length === 1

/** The big cube with its centers bordered. */
export function withBorders(cube: Cube): Cube {
  const reach = reachOf(cube)
  // Each face's color, by its normal.
  const faceColor = new Map<string, Color>()
  for (const c of cube) for (const s of c.stickers) faceColor.set(s.normal.join(), s.color)
  return cube.map((c) => {
    if (!isCenter(c, reach)) return c
    const axis = c.position.findIndex((v) => Math.abs(v) === reach)
    const borders: Sticker[] = []
    // The middle one (none off the middle) toward all four edges.
    const middle = c.position.every((v, d) => d === axis || v === 0)
    for (let d = 0; d < 3; d++) {
      if (d === axis || (c.position[d] === 0 && !middle)) continue
      const toward = middle ? [1, -1] : [Math.sign(c.position[d]!)]
      for (const sign of toward) {
        const normal = mapVec([0, 1, 2], (k) => (k === d ? sign : 0))
        borders.push({ normal, color: faceColor.get(normal.join())! })
      }
    }
    return { ...c, stickers: [...c.stickers, ...borders] }
  })
}

/** The big cube it is, its centers' borders set aside. */
export function withoutBorders(cube: Cube): Cube {
  const reach = reachOf(cube)
  return cube.map((c) =>
    isCenter(c, reach) && c.stickers.length > 1
      ? { ...c, stickers: c.stickers.filter((s) => isOuter(c, s, reach)) }
      : c,
  )
}

/** A center's identity: its own color, then its borders' (sorted). */
export function centerKey(c: Cubie, reach: number): string {
  const own = c.stickers.find((s) => isOuter(c, s, reach))!
  const borders = c.stickers
    .filter((s) => !isOuter(c, s, reach))
    .map((s) => s.color)
    .sort()
  return [own.color, ...borders].join('')
}
