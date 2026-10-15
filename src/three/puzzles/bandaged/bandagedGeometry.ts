import { FACE_NORMAL, normalIndex } from '@/lib/core/geometry'
import type { Cubie, Face } from '@/lib/core/types'
import type { P3, PiecePolygon } from '../../core/polygons'

/**
 * Geometry of the bandaged 3x3x3s' pieces (lib/puzzles/bandaged/bonds.ts):
 * a 3x3's cubies, each running to its cell's end, with no gap, towards the
 * neighbours it is fused to (its hidden marks), its stickers too: a block's
 * cubies read as one piece, its stickers as one tile, as on the Z-Cube.
 */

const GAP = 0.03
const STICKER = 0.08
const LIFT = 0.004

/** How far short of a fused neighbour a thumbnail's body stops: its
 *  outline, drawn over the neighbour's sticker, would show the seam. */
const THUMBNAIL_SEAM = 0.02

const SHAPES = new Map<string, PiecePolygon[]>()

/** Every polygon of a piece, where it stands. */
export const bandagedPolygons = (cubie: Cubie): PiecePolygon[] => polygonsOf(cubie, 0)

/** The same for the picker's thumbnail, no seam showing within a block. */
export const bandagedThumbnail = (cubie: Cubie): PiecePolygon[] => polygonsOf(cubie, THUMBNAIL_SEAM)

function polygonsOf(cubie: Cubie, seam: number): PiecePolygon[] {
  const colored = cubie.stickers.filter((s) => s.color !== 'H')
  if (colored.length === 0) return [] // the hidden core
  const key =
    seam + cubie.position.join() + cubie.stickers.map((s) => s.normal.join() + s.color).join('|')
  const known = SHAPES.get(key)
  if (known) return known
  // How far the piece reaches each way along each axis: to its cell's end
  // towards a fused neighbour (its body `seam` short of it), short of it
  // otherwise.
  const fused = (axis: number, side: number) =>
    cubie.stickers.some((s) => s.color === 'H' && s.normal[axis] === side)
  const reach = (axis: number, side: number, inset: number, toBlock = 0) =>
    cubie.position[axis]! + side * (0.5 - (fused(axis, side) ? toBlock : inset))
  const out: PiecePolygon[] = []
  for (const f of Object.keys(FACE_NORMAL) as Face[]) {
    const n = FACE_NORMAL[f]
    const a = n.findIndex((v) => v !== 0)
    const [b, c] = [(a + 1) % 3, (a + 2) % 3]
    const rect = (inset: number, lift: number, toBlock = 0): P3[] => {
      const corners: [number, number][] = [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ]
      const points = corners.map(([u, v]) => {
        const p = [0, 0, 0]
        p[a] = reach(a, n[a]!, GAP) + n[a]! * lift
        p[b] = reach(b, u, inset, toBlock)
        p[c] = reach(c, v, inset, toBlock)
        return p as P3
      })
      // Counter-clockwise seen from outside.
      return n[a]! > 0 ? points : points.reverse()
    }
    out.push({ points: rect(GAP, 0, seam), paint: 'body', normal: [...n] as P3 })
    const sticker = colored.find((s) => s.normal.join() === n.join())
    if (sticker) {
      out.push({
        // In a thumbnail, a sticker runs a little into its block's next
        // one: two edges side by side would still leave a hairline.
        points: rect(STICKER, LIFT, -seam),
        paint: sticker.color,
        normal: [...n] as P3,
        ni: normalIndex(n),
      })
    }
  }
  SHAPES.set(key, out)
  return out
}
