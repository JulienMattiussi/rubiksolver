import { solvedCube } from '@/lib/core/cube'
import type { Cube, CubeShape } from '@/lib/core/types'

/**
 * Deterministic PRNG (mulberry32) for reproducible scramble/solve tests.
 * Returns a function usable in place of Math.random.
 */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * A solved cube with one corner twisted in place: every piece is real, but
 * the corner-twist parity is off, so no sequence of moves can solve it.
 */
export function twistedCorner(shape: CubeShape): Cube {
  const cube = solvedCube(shape)
  const corner = cube.findIndex((c) => c.stickers.length === 3)
  return cube.map((cubie, i) =>
    i === corner
      ? {
          ...cubie,
          stickers: cubie.stickers.map((s, j) => ({
            ...s,
            color: cubie.stickers[(j + 1) % cubie.stickers.length]!.color,
          })),
        }
      : cubie,
  )
}

/** The 2x2 variant, kept for the existing suites. */
export function twistedCorner2(): Cube {
  return twistedCorner('2')
}
