import { normalIndex } from '../../core/geometry'
import { sameAt } from '../../core/pieces'
import type { Cube, Vec3 } from '../../core/types'
import { frameOf, showsFrame } from './flatKit'

/**
 * What the Floppy's two tutorials share (floppy.ts, floppyEdgesFirst.ts):
 * how it stands, read on what never moves, and its edges.
 */

/** The center's stickers and the edges' rims: what never moves (an edge
 *  only flips, its rim staying). */
const fixed = (cube: Cube) =>
  cube
    .filter((c) => c.position.filter((v) => v !== 0).length < 2)
    .flatMap((c) =>
      c.stickers
        .filter((s) => c.position.every((v) => v === 0) || sameAt(s.normal, c.position))
        .map((s) => `${normalIndex(s.normal)}${s.color}`),
    )
    .sort()
    .join()
export const FLOPPY_FRAME = frameOf('331', fixed)

export const FLOPPY_EDGES: readonly Vec3[] = [
  [0, 0, 1],
  [1, 0, 0],
  [0, 0, -1],
  [-1, 0, 0],
]

/** The edges upside down, by place. */
export const flippedEdges = (cube: Cube) =>
  FLOPPY_EDGES.filter((slot) => !showsFrame(cube, FLOPPY_FRAME(cube), slot))
