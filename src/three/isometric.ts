import { cubeDims, solvedCube } from '@/lib/cube'
import { normalIndex } from '@/lib/geometry'
import { cubieBox, LAYER_THICKNESS } from '@/lib/shape'
import type { Color, CubeShape, CubeVariant } from '@/lib/types'
import { visualPosition } from './layout'

/**
 * Flat isometric drawing of a solved puzzle, for its picker thumbnail: the
 * puzzle seen from its up-front-right corner, so its U, F and R faces show.
 * Derived from the same layout and cubie boxes as the 3D view, so a new shape
 * (or the mirror skin) gets its thumbnail for free.
 */

type Point = readonly [number, number, number]

/** The three visible faces, with how much darker each is drawn (a lit top). */
const VISIBLE = [
  { axis: 1, shade: 0 }, // U
  { axis: 2, shade: 0.12 }, // F
  { axis: 0, shade: 0.28 }, // R
] as const

/** Share of a face its sticker covers (the rest shows the plastic body). */
const STICKER_SCALE = 0.8

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
function faceCorners(min: Point, max: Point, axis: 0 | 1 | 2): Point[] {
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
function shrink(points: Point[], scale: number): Point[] {
  const c = [0, 1, 2].map((a) => points.reduce((s, p) => s + p[a]!, 0) / points.length)
  return points.map((p) => p.map((v, a) => c[a]! + (v - c[a]!) * scale) as unknown as Point)
}

const toSvg = (points: Point[]): string =>
  points
    .map((p) =>
      project(p)
        .map((v) => v.toFixed(3))
        .join(','),
    )
    .join(' ')

const DRAWINGS = new Map<string, IsoDrawing>()

/** The drawing of a solved puzzle, computed once per session (every picker
 *  tile and the picker button share it). */
export function isometricDrawing(shape: CubeShape, variant: CubeVariant): IsoDrawing {
  const key = `${shape}:${variant}`
  let drawing = DRAWINGS.get(key)
  if (!drawing) {
    drawing = drawPuzzle(shape, variant)
    DRAWINGS.set(key, drawing)
  }
  return drawing
}

function drawPuzzle(shape: CubeShape, variant: CubeVariant): IsoDrawing {
  const cube = solvedCube(shape)
  const dims = cubeDims(cube)
  const faces: Array<{ depth: number; polygons: IsoPolygon[] }> = []
  for (const cubie of cube) {
    const { size, center } = cubieBox(cubie.stickers, LAYER_THICKNESS[variant])
    const cell = visualPosition(cubie.position, dims)
    const mid = cell.map((v, a) => v + center[a]!)
    const min = mid.map((v, a) => v - size[a]! / 2) as unknown as Point
    const max = mid.map((v, a) => v + size[a]! / 2) as unknown as Point
    for (const { axis, shade } of VISIBLE) {
      const sticker = cubie.stickers.find((s) => normalIndex(s.normal) === 2 * axis)
      if (!sticker) continue // an inner face: hidden behind a neighbor
      const corners = faceCorners(min, max, axis)
      faces.push({
        depth: mid[0]! + mid[1]! + mid[2]! + max[axis]! - mid[axis]!,
        polygons: [
          { points: toSvg(corners), paint: 'body', shade },
          { points: toSvg(shrink(corners, STICKER_SCALE)), paint: sticker.color, shade },
        ],
      })
    }
  }
  // Painter's order: farthest from the viewer first.
  faces.sort((a, b) => a.depth - b.depth)
  const polygons = faces.flatMap((f) => f.polygons)
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
