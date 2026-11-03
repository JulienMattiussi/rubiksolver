import { mod } from '../../core/geometry'
import type { Cube, SectorMove, SectorSteps } from '../../core/types'
import { applySectorMove, sectorFaced, sectorPlace } from '../shared/sectors'

/**
 * The Square-1's shape, as its model, its entry and its methods read it.
 *
 * A layer's outline is read sector by sector from sector 0 (the one just
 * right of the cut's back end): `e` an edge's twelfth, `a` and `b` a
 * corner's first and second. Its key is its least way round; a way is how
 * far its layer is turned from it.
 */

/** Whether the slash can go: no corner across its cut (on boundary 0 or
 *  6) in either layer. */
export const slashGoes = (cube: Cube): boolean =>
  cube.every((c) => {
    const place = sectorPlace(c.position)
    return !place?.wide || place.m % 6 !== 0
  })

/** A layer's outline, as it stands. */
export function outline(cube: Cube, z: number): string {
  const cells = Array<string>(12).fill('e')
  for (const c of cube) {
    const place = sectorPlace(c.position)
    if (!place?.wide || place.z !== z) continue
    cells[(place.m + 11) % 12] = 'a'
    cells[place.m] = 'b'
  }
  return cells.join('')
}

/** An outline turned r cells on: what stood at m stands at m + r. */
export const turned = (cells: string, r: number): string => {
  const k = mod(r, 12)
  return cells.slice(12 - k) + cells.slice(0, 12 - k)
}

/** An outline's key, its least way round, and how far it stands from it. */
export function keyOf(cells: string): { key: string; way: number } {
  let best = { key: cells, way: 0 }
  for (let r = 1; r < 12; r++) {
    const key = turned(cells, -r)
    if (key < best.key) best = { key, way: r }
  }
  return best
}

/** Whether the middle's right half is flipped: a side of it off the cube's
 *  four ways. */
export const isFlipped = (cube: Cube): boolean =>
  cube.some(
    (c) => !sectorPlace(c.position) && c.stickers.some((s) => sectorFaced(s.normal)! % 3 !== 2),
  )

/** The top turned u twelfths, the bottom d (either way round, 0: still). */
export const layerTurns = (u: number, d: number): SectorMove[] => [
  ...(mod(u, 12) ? [{ layer: 'U', steps: mod(u, 12) as SectorSteps } as const] : []),
  ...(mod(d, 12) ? [{ layer: 'D', steps: mod(d, 12) as SectorSteps } as const] : []),
]

/** Each way to turn the layers (both still included) after which the slash
 *  goes, and the state it leaves. */
export function slashWays(cube: Cube): { u: number; d: number; turns: SectorMove[]; at: Cube }[] {
  const ways = []
  for (let u = 0; u < 12; u++) {
    for (let d = 0; d < 12; d++) {
      const turns = layerTurns(u, d)
      const at = turns.reduce(applySectorMove, cube)
      if (slashGoes(at)) ways.push({ u, d, turns, at })
    }
  }
  return ways
}
