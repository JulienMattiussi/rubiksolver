import type { Cube, Cubie } from '../../core/types'

/**
 * Thin edges: a 3x3 cut so that its four middle-layer edges show one color
 * only (the Z-Twist's, twisted.ts; the Barrel's, round; the Fisher Cube's,
 * diagonal): which way round they lie never shows, so it counts for
 * nothing. The editor offers them one way (`asSeenThin`), an entry turns
 * one over if the edges need it (`withRealThinEdges`), and "solved" takes
 * them either way (`thinEdgesSolved`).
 */

/** The colors of the cube's middle layer: the side faces'. */
const SIDE_COLORS = ['G', 'B', 'R', 'O']
const isFront = (color: string) => color === 'G' || color === 'B'

/**
 * Whether a cubie is one of the thin edges, the four of the middle layer in
 * the solved puzzle (no U or D color).
 */
export const isThinEdge = (c: Cubie): boolean =>
  isEdge(c) && c.stickers.every((s) => SIDE_COLORS.includes(s.color))

/** An edge's way round on the F/B axis (as a 3x3's edge orientation): its
 *  U/D color, or else its F/B one, on the slot's reference side (U/D in the
 *  top and bottom layers, F/B in the middle one). Solved, every edge is so. */
const good = (c: Cubie): boolean => {
  const ref =
    c.stickers.find((s) => s.color === 'W' || s.color === 'Y') ??
    c.stickers.find((s) => isFront(s.color))!
  return ref.normal[c.position[1] !== 0 ? 1 : 2] !== 0
}

/** An edge: on two faces (a Fisher Cube's marked center has two stickers
 *  too, fisher.ts). */
const isEdge = (c: Cubie) => c.position.filter((v) => v !== 0).length === 2

/** The edge turned over in its slot: its two colors swapped. */
const flipped = (c: Cubie): Cubie => ({
  ...c,
  stickers: c.stickers.map((s, i) => ({ ...s, color: c.stickers[1 - i]!.color })),
})

/** The puzzle as it shows: every thin edge the reference way round. */
export const asSeenThin = (cube: Cube): Cube =>
  cube.map((c) => (isThinEdge(c) && !good(c) ? flipped(c) : c))

/** Whether the edges' ways round (on the F/B axis) add up to a real
 *  puzzle: an even number of them the other way. */
function evenEdges(cube: Cube): boolean {
  return cube.filter(isEdge).filter((c) => !good(c)).length % 2 === 0
}

/** An entered puzzle made real: its thin edges' ways round unseen, one
 *  turned over if the edges need it (nothing shows of it). */
export function withRealThinEdges(cube: Cube): Cube {
  if (evenEdges(cube)) return cube
  const thin = cube.findIndex(isThinEdge)
  return cube.map((c, i) => (i === thin ? flipped(c) : c))
}

/** Whether it is solved as it shows: every face one color, its thin
 *  edges either way round (their two colors on their two faces). */
export function thinEdgesSolved(cube: Cube): boolean {
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
