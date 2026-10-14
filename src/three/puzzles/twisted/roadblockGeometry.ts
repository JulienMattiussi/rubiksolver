import { FACE_NORMAL, normalIndex } from '@/lib/core/geometry'
import { barAxis } from '@/lib/puzzles/twisted/roadblock'
import type { Cubie, Face } from '@/lib/core/types'
import { type P3, type PiecePolygon } from '../../core/polygons'

/**
 * Geometry of the RoadBlock-I's pieces (lib/puzzles/twisted/roadblock.ts): a 5x5x5 whose
 * outer layers are thick and its three inner ones thin, its centers drawn
 * as bars: along its bar, a center (its body and its sticker) runs to its
 * cell's ends, with no gap, so a bar's three read as one piece.
 */

/** Each layer's span, -2 to 2 on the grid, in scene units. */
const SPAN: Record<number, readonly [number, number]> = {
  [-2]: [-2, -0.75],
  [-1]: [-0.75, -0.25],
  0: [-0.25, 0.25],
  1: [0.25, 0.75],
  2: [0.75, 2],
}
const SCALE = 0.75
const GAP = 0.03
const STICKER = 0.06

const SHAPES = new Map<string, PiecePolygon[]>()

/** Every polygon of a piece, where it stands. */
export function roadblockPolygons(cubie: Cubie): PiecePolygon[] {
  if (cubie.stickers.length === 0) return []
  const key = cubie.position.join() + cubie.stickers.map((s) => s.normal.join() + s.color).join('|')
  const known = SHAPES.get(key)
  if (known) return known
  const box = cubie.position.map((v) => SPAN[v]!)
  const bar = barAxis(cubie)
  const out: PiecePolygon[] = []
  for (const f of Object.keys(FACE_NORMAL) as Face[]) {
    const n = FACE_NORMAL[f]
    const a = n.findIndex((v) => v !== 0)
    const [b, c] = [(a + 1) % 3, (a + 2) % 3]
    const at = n[a]! > 0 ? box[a]![1] - GAP : box[a]![0] + GAP
    // A rectangle on this face, inset by `inset` across each of b and c.
    const rect = (inB: number, inC: number, lift: number): P3[] =>
      [
        [box[b]![0] + inB, box[c]![0] + inC],
        [box[b]![1] - inB, box[c]![0] + inC],
        [box[b]![1] - inB, box[c]![1] - inC],
        [box[b]![0] + inB, box[c]![1] - inC],
      ].map(([u, v]) => {
        const p = [0, 0, 0]
        p[a] = at + n[a]! * lift
        p[b] = u!
        p[c] = v!
        return p.map((x) => x * SCALE) as P3
      })
    const orient = (points: P3[]) => (n[a]! > 0 === ((a + 1) % 3 === b) ? points : points.reverse())
    // Along its bar, a center runs to its cell's ends: no gap within a bar.
    const edge = (axis: number, inset: number) => (bar === axis ? 0 : inset)
    out.push({
      points: orient(rect(edge(b, GAP), edge(c, GAP), 0)),
      paint: 'body',
      normal: [...n] as P3,
    })
    const sticker = cubie.stickers.find((s) => s.color !== 'H' && s.normal.join() === n.join())
    if (sticker) {
      out.push({
        points: orient(rect(edge(b, STICKER), edge(c, STICKER), 0.004)),
        paint: sticker.color,
        normal: [...n] as P3,
        ni: normalIndex(n),
      })
    }
  }
  SHAPES.set(key, out)
  return out
}
