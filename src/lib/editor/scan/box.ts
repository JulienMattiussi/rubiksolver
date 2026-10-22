import { turnDims } from '../../core/cube'
import {
  AXIS_ROTATIONS,
  cross,
  dot,
  FACE_NORMAL,
  layerCoords,
  normalIndex,
} from '../../core/geometry'
import type { CubeShape } from '../../core/shapes'
import type { Cube } from '../../core/types'
import { stickerId } from '../editorTables'
import { formsOf, lookOf } from '../modes/form'
import { axisOf, boxSides, ORDER } from './plan'

/**
 * A puzzle that changes shape, scanned as the box it turns in (pure): its
 * forms held each way its long side stays upright, what each face of the
 * box then shows cell by cell, and its core, the cells every form fills
 * (the middle of a tower, which never moves): held in the frame's marked
 * cells, it sets where every other cell stands.
 */

/** What a cell of a face shows, as a form says: one of its stickers (by
 *  id), a piece's black side, or nothing. */
export type Shown = string | 'black' | null

/** Each form of the puzzle, held each way its long side stays upright. */
export function holdings(shape: CubeShape): Cube[] {
  const dims = turnDims(shape)
  const out = new Map<string, Cube>()
  for (const { cube } of formsOf(shape)) {
    for (const turn of AXIS_ROTATIONS) {
      const held = cube.map((c) => ({
        ...c,
        position: turn(c.position),
        stickers: c.stickers.map((s) => ({ ...s, normal: turn(s.normal) })),
      }))
      // Within the box it turns in, its long side upright.
      const fits = [0, 1, 2].every((a) =>
        held.every((c) => layerCoords(dims[a]!).includes(c.position[a]!)),
      )
      const tall = new Set(held.map((c) => c.position[1])).size === dims[1]
      if (fits && tall) out.set(lookOf(held), held)
    }
  }
  return [...out.values()]
}

/** A form held some way: each face's cells as it shows them. */
export function facesShown(shape: CubeShape, cube: Cube): Shown[][] {
  const dims = turnDims(shape)
  return ORDER.map(({ front, up }) => {
    const [rows, cols] = boxSides(dims, front, up)
    const n = FACE_NORMAL[front]
    const u = FACE_NORMAL[up]
    const r = cross(u, n)
    const across = layerCoords(dims[axisOf(r)]!)
    const upward = [...layerCoords(dims[axisOf(u)]!)].reverse()
    const shown: Shown[] = Array<Shown>(rows * cols).fill(null)
    const depth = Array<number>(rows * cols).fill(-Infinity)
    for (const cubie of cube) {
      const cell =
        upward.indexOf(dot(cubie.position, u)) * cols + across.indexOf(dot(cubie.position, r))
      const d = dot(cubie.position, n)
      if (d <= depth[cell]!) continue
      depth[cell] = d
      const faces = cubie.stickers.some((s) => s.normal.join() === n.join())
      shown[cell] = faces ? stickerId(cubie.position, normalIndex(n)) : 'black'
    }
    return shown
  })
}

const CORES = new Map<CubeShape, readonly (readonly number[])[]>()

/** Each face's core: the cells a piece fills whatever the form (a tower's
 *  middle four). */
export function coreOf(shape: CubeShape): readonly (readonly number[])[] {
  let core = CORES.get(shape)
  if (!core) {
    const shown = holdings(shape).map((cube) => facesShown(shape, cube))
    core = ORDER.map((_, f) =>
      shown[0]![f]!.flatMap((_, i) => (shown.every((faces) => faces[f]![i] !== null) ? [i] : [])),
    )
    CORES.set(shape, core)
  }
  return core
}
