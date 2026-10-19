import type { Color } from '@/lib/core/types'

/**
 * The bricks of a flat isometric drawing (isometric.ts, a puzzle's own
 * thumbnail): the puzzle seen from its up-front-right corner, its U, F and
 * R faces showing, each polygon projected and shaded, then painted far to
 * near.
 */

export type Point = readonly [number, number, number]

/** The three visible faces, with how much darker each is drawn (a lit top). */
export const VISIBLE = [
  { axis: 1, shade: 0 }, // U
  { axis: 2, shade: 0.12 }, // F
  { axis: 0, shade: 0.28 }, // R
] as const

/** Share of a face its sticker covers (the rest shows the plastic body). */
export const STICKER_SCALE = 0.8

const COS30 = Math.cos(Math.PI / 6)

function project([x, y, z]: Point): [number, number] {
  return [(x - z) * COS30, (x + z) / 2 - y]
}

interface IsoPolygon {
  /** SVG `points` attribute. */
  readonly points: string
  /** The plastic body, or a sticker of this color. */
  readonly paint: 'body' | Color
  /** Darkening of the face (0 = full light). */
  readonly shade: number
}

export interface IsoDrawing {
  readonly polygons: readonly IsoPolygon[]
  readonly viewBox: string
}

/** Corners of a box face, `axis` being the face normal (+1 side). */
export function faceCorners(min: Point, max: Point, axis: 0 | 1 | 2): Point[] {
  const [u, v] = [(axis + 1) % 3, (axis + 2) % 3]
  const corner = (a: number, b: number): Point => {
    const p = [0, 0, 0]
    p[axis] = max[axis]
    p[u] = a ? max[u]! : min[u]!
    p[v] = b ? max[v]! : min[v]!
    return p as unknown as Point
  }
  return [corner(0, 0), corner(1, 0), corner(1, 1), corner(0, 1)]
}

/** The same polygon shrunk towards its center. */
export function shrink(points: Point[], scale: number): Point[] {
  const c = [0, 1, 2].map((a) => points.reduce((s, p) => s + p[a]!, 0) / points.length)
  return points.map((p) => p.map((v, a) => c[a]! + (v - c[a]!) * scale) as unknown as Point)
}

export const toSvg = (points: Point[]): string =>
  points
    .map((p) =>
      project(p)
        .map((v) => v.toFixed(3))
        .join(','),
    )
    .join(' ')

export interface IsoFace {
  readonly depth: number
  readonly polygons: IsoPolygon[]
}

/** Painter's order (farthest from the viewer first), then a viewBox fitted
 *  around everything drawn. */
export function finish(faces: IsoFace[]): IsoDrawing {
  const polygons = [...faces].sort((a, b) => a.depth - b.depth).flatMap((f) => f.polygons)
  const xs: number[] = []
  const ys: number[] = []
  for (const { points } of polygons) {
    for (const pair of points.split(' ')) {
      const [x, y] = pair.split(',').map(Number)
      xs.push(x!)
      ys.push(y!)
    }
  }
  const pad = 0.15
  const [x0, y0] = [Math.min(...xs) - pad, Math.min(...ys) - pad]
  const [w, h] = [Math.max(...xs) - x0 + pad, Math.max(...ys) - y0 + pad]
  return { polygons, viewBox: `${x0.toFixed(3)} ${y0.toFixed(3)} ${w.toFixed(3)} ${h.toFixed(3)}` }
}
