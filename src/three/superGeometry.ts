import { FACE_NORMAL, normalIndex } from '@/lib/geometry'
import { isOuter } from '@/lib/superCube'
import type { Cubie, Face, Vec3 } from '@/lib/types'
import { type P3, type PiecePolygon } from './polygons'

/**
 * Geometry of the super cubes' pieces (lib/superCube.ts): a 4x4x4's or a
 * 5x5x5's cubies, the size of the plain ones, each center's sticker
 * bordered, along each side its borders face, by a strip of that border's
 * color (the color of the face beyond), mitred where two meet.
 */

const GAP = 0.03
const STICKER = 0.06
/** A border's width, out of a cell's. */
const BORDER = 0.2

/** A layout: each layer's span on the grid, the reach, the scale. */
interface Layout {
  readonly half: number
  readonly reach: number
  readonly scale: number
}
/** Cells 2 wide on the 4x4's grid, 1 on the 5x5's; both 3 units across. */
const LAYOUTS: Record<number, Layout> = {
  3: { half: 1, reach: 3, scale: 0.375 },
  2: { half: 0.5, reach: 2, scale: 0.6 },
}

const SHAPES = new Map<string, PiecePolygon[]>()

/** Every polygon of a piece, where it stands, on a grid reaching `reach`. */
export function superPolygons(reach: number) {
  const layout = LAYOUTS[reach]!
  return (cubie: Cubie): PiecePolygon[] => {
    if (cubie.stickers.length === 0) return []
    const id = `${reach}|${cubie.position.join()}|${cubie.stickers.map((s) => s.normal.join() + s.color).join('|')}`
    const known = SHAPES.get(id)
    if (known) return known
    const cell = layout.half * 2
    const box = cubie.position.map((v) => [v - layout.half, v + layout.half] as const)
    const out: PiecePolygon[] = []
    for (const f of Object.keys(FACE_NORMAL) as Face[]) {
      const n = FACE_NORMAL[f]
      const a = n.findIndex((v) => v !== 0)
      const [b, c] = [(a + 1) % 3, (a + 2) % 3]
      const at = n[a]! > 0 ? box[a]![1] - GAP : box[a]![0] + GAP
      /** A polygon on this face, its corners (across b and c) counter-
       *  clockwise. */
      const polygon = (corners: readonly (readonly [number, number])[], lift: number): P3[] => {
        const points = corners.map(([u, v]) => {
          const p = [0, 0, 0]
          p[a] = at + n[a]! * lift
          p[b] = u
          p[c] = v
          return p.map((x) => x * layout.scale) as P3
        })
        return n[a]! > 0 === ((a + 1) % 3 === b) ? points : points.reverse()
      }
      /** A rectangle on this face, from `lo` to `hi` across b and c. */
      const rect = (lo: [number, number], hi: [number, number], lift: number): P3[] =>
        polygon(
          [
            [lo[0], lo[1]],
            [hi[0], lo[1]],
            [hi[0], hi[1]],
            [lo[0], hi[1]],
          ],
          lift,
        )
      const [b0, b1] = box[b]!
      const [c0, c1] = box[c]!
      out.push({
        points: rect([b0 + GAP, c0 + GAP], [b1 - GAP, c1 - GAP], 0),
        paint: 'body',
        normal: [...n] as P3,
      })
      const sticker = cubie.stickers.find(
        (s) => s.normal.join() === n.join() && isOuter(cubie, s, reach),
      )
      if (!sticker) continue
      const ni = normalIndex(n)
      const inset = STICKER * cell
      const lo: [number, number] = [b0 + inset, c0 + inset]
      const hi: [number, number] = [b1 - inset, c1 - inset]
      out.push({ points: rect(lo, hi, 0.004), paint: sticker.color, normal: [...n] as P3, ni })
      // Its borders, each a strip along the side it faces, mitred where
      // another meets it (the corner shared in two triangles).
      const w = BORDER * cell
      const borders = cubie.stickers.filter((s) => !isOuter(cubie, s, reach))
      const has = (d: number, sign: number) => borders.some((s) => s.normal[d] === sign)
      for (const border of borders) {
        const m: Vec3 = border.normal
        const [u0, v0] = lo
        const [u1, v1] = hi
        let corners: [number, number][]
        if (m[b] !== 0) {
          // Along v, at the low or high u: its ends cut where a border
          // runs along u.
          const [cutLo, cutHi] = [has(c, -1) ? w : 0, has(c, 1) ? w : 0]
          corners =
            m[b]! > 0
              ? [
                  [u1 - w, v0 + cutLo],
                  [u1, v0],
                  [u1, v1],
                  [u1 - w, v1 - cutHi],
                ]
              : [
                  [u0, v0],
                  [u0 + w, v0 + cutLo],
                  [u0 + w, v1 - cutHi],
                  [u0, v1],
                ]
        } else {
          const [cutLo, cutHi] = [has(b, -1) ? w : 0, has(b, 1) ? w : 0]
          corners =
            m[c]! > 0
              ? [
                  [u0 + cutLo, v1 - w],
                  [u1 - cutHi, v1 - w],
                  [u1, v1],
                  [u0, v1],
                ]
              : [
                  [u0, v0],
                  [u1, v0],
                  [u1 - cutHi, v0 + w],
                  [u0 + cutLo, v0 + w],
                ]
        }
        // Its own sticker in the editor: painted on its own.
        out.push({
          points: polygon(corners, 0.008),
          paint: border.color,
          normal: [...n] as P3,
          ni: normalIndex(m),
        })
      }
    }
    SHAPES.set(id, out)
    return out
  }
}
