import type { Cube } from './types'

/**
 * The Z-Twist: a 3x3x3 whose shape is twisted (its top turned against its
 * bottom, its sides ruled), a shape mod like the mirror cube: the same
 * pieces, colors and turns as a 3x3, each piece cut to its solved place's
 * share of the twisted solid. Its edges and corners are told apart by their
 * colors, so their shapes follow; its side centers, though, show in their
 * shape whether they stand a quarter turn off (a half turn looks the same),
 * which a 3x3's colors do not say: each keeps it (`Cubie.spin`, 0 or 1),
 * turned over by every quarter turn of its face (turn.ts). Solved, all at 0.
 */
export function withTwistedCenters(cube: Cube): Cube {
  return cube.map((c) => (c.stickers.length === 1 && c.position[1] === 0 ? { ...c, spin: 0 } : c))
}
