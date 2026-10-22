import { dot, cross } from '@/lib/core/geometry'
import { solvedCube } from '@/lib/core/cube'
import type { CubeShape } from '@/lib/core/shapes'
import { stickerId } from '@/lib/editor/editorTables'
import type { Point } from '@/lib/editor/scan/layout'
import type { ScanFace } from '@/lib/editor/scan/plan'
import { isPolyDrawn, polyDrawing } from './polyDrawing'
import type { P3 } from './polygons'

/**
 * A face of a cube whose faces are no grid (the Skewb, the Rex Cube...),
 * as its drawing shows it, for the camera scan (lib/editor/scan/plan.ts
 * says which sticker is on it, `seen`; the drawing says where): each
 * sticker read round the middle of its polygon, the polygons' sides drawn
 * in watermark. A face without `seen`, or a drawing in a frame of its own,
 * stays as the plan lays it.
 */

/** A polygon's area, and its middle (the mean of its corners). */
function measure(points: readonly Point[]) {
  let twice = 0
  for (let i = 0; i < points.length; i++) {
    const [a, b] = [points[i]!, points[(i + 1) % points.length]!]
    twice += a[0] * b[1] - b[0] * a[1]
  }
  const middle: Point = [
    points.reduce((s, p) => s + p[0], 0) / points.length,
    points.reduce((s, p) => s + p[1], 0) / points.length,
  ]
  return { area: Math.abs(twice) / 2, middle }
}

/** A sticker's outline: the sides of its polygons no other of them shares
 *  (a curved sticker is drawn as a fan of them). */
function outlineOf(polygons: readonly (readonly Point[])[]): (readonly [Point, Point])[] {
  const key = ([x, y]: Point) => `${x.toFixed(4)},${y.toFixed(4)}`
  const sides = new Map<string, { side: readonly [Point, Point]; count: number }>()
  for (const points of polygons) {
    points.forEach((p, i) => {
      const q = points[(i + 1) % points.length]!
      const k = [key(p), key(q)].sort().join('|')
      const was = sides.get(k)
      sides.set(k, { side: [p, q], count: (was?.count ?? 0) + 1 })
    })
  }
  return [...sides.values()].filter((s) => s.count === 1).map((s) => s.side)
}

/** How much of a sticker's size it is read round, each way. */
const READ_SHARE = 0.25

const DRAWN = new Map<string, ScanFace>()

/** The face as the drawing shows it (see above). */
export function drawnFace(shape: CubeShape, face: ScanFace): ScanFace {
  if (!face.seen || !isPolyDrawn(shape)) return face
  const drawing = polyDrawing(shape)
  if (drawing.orient || drawing.offset) return face
  const key = `${shape}|${face.cells.join()}`
  const known = DRAWN.get(key)
  if (known) return known
  const { normal, up } = face.seen
  const right = cross(up, normal)
  const index = new Map(face.cells.map((id, i) => [id, i]))
  // Each cell's polygons, across the face (right, up).
  const drawn = face.cells.map((): Point[][] => [])
  for (const cubie of solvedCube(shape)) {
    for (const polygon of drawing.polygons(cubie)) {
      if (polygon.paint === 'body' || polygon.ni === undefined || polygon.on) continue
      const i = index.get(stickerId(cubie.position, polygon.ni))
      if (i === undefined || dot(polygon.normal, normal) < 0.5) continue
      drawn[i]!.push(polygon.points.map((p: P3): Point => [dot(p, right), dot(p, up)]))
    }
  }
  if (drawn.some((polygons) => !polygons.length)) return face
  const all = drawn.flat(2)
  const half = Math.max(...all.flatMap(([a, b]) => [Math.abs(a), Math.abs(b)]))
  // In the plan's frame: 2 units wide, its middle at 1, 1, y down.
  const place = ([a, b]: Point): Point => [1 + a / half, 1 - b / half]
  const shapes = drawn.map((polygons) => polygons.map((points) => points.map(place)))
  const cells = shapes.map((polygons) => {
    const parts = polygons.map(measure)
    const area = parts.reduce((s, p) => s + p.area, 0)
    const middle: Point = [
      parts.reduce((s, p) => s + p.middle[0] * p.area, 0) / area,
      parts.reduce((s, p) => s + p.middle[1] * p.area, 0) / area,
    ]
    return { area, middle }
  })
  const seen: ScanFace = {
    ...face,
    points: cells.map((c) => c.middle),
    reach: READ_SHARE * Math.min(...cells.map((c) => Math.sqrt(c.area))),
    lines: shapes.flatMap(outlineOf),
  }
  DRAWN.set(key, seen)
  return seen
}
