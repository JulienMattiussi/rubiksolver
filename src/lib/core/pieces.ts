import { FACE_COLOR, faceColorsOf, solvedCube } from './cube'
import { AXIS_ROTATIONS, faceOfNormal } from './geometry'
import type { Color, Cube, CubeShape, Cubie, Face, Sticker, Vec3 } from './types'

/**
 * Queries on a puzzle's pieces (pure): their colors, where one stands,
 * whether it is home, how a state lists them. The puzzle itself (its solved
 * state, shape, solved-ness, orientations) is in cube.ts.
 */

/** Color of the sticker on `cubie` facing `face`, if any. */
export function colorAt(cubie: Cubie, face: Face): Color | undefined {
  return cubie.stickers.find((s) => faceOfNormal(s.normal) === face)?.color
}

/** A piece's colors, sorted: the same wherever it sits, and for twin pieces. */
export function colorsOf(cubie: Cubie): string {
  return stickerColors(cubie.stickers)
}

/** How a piece stands: its stickers, each its face and color, sorted (its
 *  place aside). */
export const poseOf = (cubie: Cubie): string =>
  cubie.stickers
    .map((s) => s.normal.join() + s.color)
    .sort()
    .join('|')

/** The pieces showing this many stickers (a kind, on a puzzle whose kinds
 *  differ by it). */
export const withStickers =
  (count: number) =>
  (cubie: Cubie): boolean =>
    cubie.stickers.length === count

/** Whether two places are the same. */
export const sameAt = (a: readonly number[], b: readonly number[]) => a.join() === b.join()

/** Some stickers' colors, sorted (a piece's own, its marks set aside). Each
 *  color is one letter, so they join with nothing between. */
export function stickerColors(stickers: readonly Sticker[]): string {
  return stickers
    .map((s) => s.color)
    .sort()
    .join('')
}

/** Whether a piece carries exactly these colors. */
export function hasColors(cubie: Cubie, colors: readonly Color[]): boolean {
  return colorsOf(cubie) === [...colors].sort().join('')
}

/** Each way of holding a puzzle without fixed colors (no centers): each
 *  color of `solved` renamed to the standard one of the face it is on then. */
export function colorRenames(solved: Cube): Map<Color, Color>[] {
  return AXIS_ROTATIONS.map(
    (turn) =>
      new Map(
        solved.flatMap((c) =>
          c.stickers.map((s) => [s.color, FACE_COLOR[faceOfNormal(turn(s.normal))]] as const),
        ),
      ),
  )
}

/** A state with its colors renamed (read as held another way). */
export function recolored(cube: Cube, rename: ReadonlyMap<Color, Color>): Cube {
  return cube.map((c) => ({
    ...c,
    stickers: c.stickers.map((s) => ({ ...s, color: rename.get(s.color)! })),
  }))
}

/** The cubie at `position` among `cubies`, if any. */
export function cubieAt(cubies: readonly Cubie[], [x, y, z]: Vec3): Cubie | undefined {
  return cubies.find((c) => c.position[0] === x && c.position[1] === y && c.position[2] === z)
}

const SLOTS = new Map<CubeShape, ReadonlyMap<string, number>>()

/**
 * Whether a piece is home: in a slot of its boxed puzzle (the right number of
 * stickers there), every sticker showing the color of the face it points to.
 * Colors, not identities: either of two twin pieces is right in either spot,
 * and a piece showing all its faces' colors can only be the one belonging there.
 */
export function atHome(cubie: Cubie, shape: CubeShape): boolean {
  let slots = SLOTS.get(shape)
  if (!slots) {
    slots = new Map(solvedCube(shape).map((c) => [c.position.join(','), c.stickers.length]))
    SLOTS.set(shape, slots)
  }
  return (
    slots.get(cubie.position.join(',')) === cubie.stickers.length &&
    cubie.stickers.every((s) => s.color === faceColorsOf(shape)[faceOfNormal(s.normal)])
  )
}

/** Whether every piece belonging at `positions` is home, among `cubies` (the
 *  whole puzzle, or the few pieces a search tracks). */
export function homeAt(cubies: readonly Cubie[], positions: readonly Vec3[], shape: CubeShape) {
  return positions.every((p) => {
    const cubie = cubieAt(cubies, p)
    return cubie !== undefined && atHome(cubie, shape)
  })
}

/** Home positions of the pieces of a solved `shape` that `keep` selects. */
export function homesOf(shape: CubeShape, keep: (c: Cubie) => boolean): Vec3[] {
  return solvedCube(shape)
    .filter(keep)
    .map((c) => c.position)
}

/**
 * The same puzzle with its pieces listed as in `reference` (each found by
 * its colors, twins in order) and each piece's stickers in the reference
 * piece's color order. `stateKey` reads pieces by index, so two states only
 * compare once listed alike: an entered cube lists its pieces slot by slot,
 * a turned one keeps them where they started.
 */
export function listedAs(cube: Cube, reference: Cube): Cube {
  const unused = [...cube]
  return reference.map((home) => {
    const i = unused.findIndex((c) => colorsOf(c) === colorsOf(home))
    if (i < 0) throw new Error(`listedAs: piece ${colorsOf(home)} missing`)
    const piece = unused.splice(i, 1)[0]!
    const order = home.stickers.map((s) => s.color)
    const stickers = [...piece.stickers].sort(
      (a, b) => order.indexOf(a.color) - order.indexOf(b.color),
    )
    return { position: piece.position, stickers }
  })
}
