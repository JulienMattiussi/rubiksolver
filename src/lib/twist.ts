import type { Cube, Cubie } from './types'

/**
 * The Z-Twist: a 3x3x3 whose shape is twisted (its top turned against its
 * bottom, its sides ruled), a shape mod like the mirror cube: the same
 * pieces, colors and turns as a 3x3, each piece cut to its solved place's
 * share of the twisted solid. Its edges and corners are told apart by their
 * colors, so their shapes follow; its side centers, though, show in their
 * shape whether they stand a quarter turn off (a half turn looks the same),
 * which a 3x3's colors do not say: each keeps it (`Cubie.spin`, 0 or 1),
 * turned over by every quarter turn of its face (turn.ts). Solved, all at 0.
 * Its four middle-layer edges, thin, show one color only: their way round
 * never shows, so it counts for nothing (`asSeenTwist`, `withRealThinEdges`).
 */

/** A 3x3 as a Z-Twist: its side centers keep their quarter turn, all home. */
export function withCenterSpins(cube: Cube): Cube {
  return cube.map((c) => (c.stickers.length === 1 && c.position[1] === 0 ? { ...c, spin: 0 } : c))
}

/** The colors of the cube's middle layer: the side faces'. */
const SIDE_COLORS = ['G', 'B', 'R', 'O']
const isFront = (color: string) => color === 'G' || color === 'B'

/**
 * Whether a cubie is one of the Z-Twist's thin edges, the four of the
 * middle layer in the solved puzzle (no U or D color): the twisted solid
 * leaves them one color only, so which way round they lie never shows.
 */
export const isThinEdge = (c: Cubie): boolean =>
  c.stickers.length === 2 && c.stickers.every((s) => SIDE_COLORS.includes(s.color))

/** An edge's way round on the F/B axis (as a 3x3's edge orientation): its
 *  U/D color, or else its F/B one, on the slot's reference side (U/D in the
 *  top and bottom layers, F/B in the middle one). Solved, every edge is so. */
const good = (c: Cubie): boolean => {
  const ref =
    c.stickers.find((s) => s.color === 'W' || s.color === 'Y') ??
    c.stickers.find((s) => isFront(s.color))!
  return ref.normal[c.position[1] !== 0 ? 1 : 2] !== 0
}

/** The edge turned over in its slot: its two colors swapped. */
const flipped = (c: Cubie): Cubie => ({
  ...c,
  stickers: c.stickers.map((s, i) => ({ ...s, color: c.stickers[1 - i]!.color })),
})

/** The Z-Twist as it shows: every thin edge the reference way round. */
export const asSeenTwist = (cube: Cube): Cube =>
  cube.map((c) => (isThinEdge(c) && !good(c) ? flipped(c) : c))

/** Whether the edges' ways round (on the F/B axis) add up to a real
 *  puzzle: an even number of them the other way. */
function evenEdges(cube: Cube): boolean {
  return cube.filter((c) => c.stickers.length === 2).filter((c) => !good(c)).length % 2 === 0
}

/** An entered Z-Twist made real: its thin edges' ways round unseen, one
 *  turned over if the edges need it (nothing shows of it). */
export function withRealThinEdges(cube: Cube): Cube {
  if (evenEdges(cube)) return cube
  const thin = cube.findIndex(isThinEdge)
  return cube.map((c, i) => (i === thin ? flipped(c) : c))
}

/** Whether a Z-Twist is solved as it shows: every face one color, its thin
 *  edges either way round (their two colors on their two faces). */
export function twistSolved(cube: Cube): boolean {
  if (cube.some((c) => c.spin)) return false
  const faces = new Map<string, string>()
  for (const c of cube) {
    if (isThinEdge(c)) continue
    for (const s of c.stickers) {
      const key = s.normal.join()
      if ((faces.get(key) ?? s.color) !== s.color) return false
      faces.set(key, s.color)
    }
  }
  return cube.filter(isThinEdge).every((c) => {
    const want = c.stickers
      .map((s) => faces.get(s.normal.join()))
      .sort()
      .join()
    return (
      want ===
      c.stickers
        .map((s) => s.color)
        .sort()
        .join()
    )
  })
}

/** A Z-Twist with these side centers (by slot) a quarter turn off, its thin
 *  edges set the way that makes it real. */
export const withTurnedCenters = (cube: Cube, turned: readonly string[]): Cube =>
  withRealThinEdges(
    withCenterSpins(cube).map((c) =>
      c.spin === undefined ? c : { ...c, spin: turned.includes(c.position.join(',')) ? 1 : 0 },
    ),
  )
