import { dot, cross } from '@/lib/core/geometry'
import type { Vec3 } from '@/lib/core/types'
import { solvedCube } from '@/lib/core/cube'
import type { CubeShape } from '@/lib/core/shapes'
import { stickerId } from '@/lib/editor/editorTables'
import { fitScale, gap, type Point } from '@/lib/editor/scan/layout'
import type { ScanFace } from '@/lib/editor/scan/plan'
import { isPolyDrawn, polyDrawing } from './polyDrawing'
import type { P3 } from './polygons'

/**
 * A face of a cube whose faces are no grid (the Skewb, the Rex Cube...), or
 * a polyhedron's flat face (a pyramid's),
 * as its drawing shows it, for the camera scan (lib/editor/scan/plan.ts
 * says which sticker is on it, `seen`; the drawing says where): each
 * sticker read round the middle of its polygon, the polygons' sides drawn
 * in watermark; a flat face's outline, what its stickers fill when it is
 * not its frame's polygon. A face without `seen`, or a drawing in a frame of its own,
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

/** The convex hull of points (Andrew's monotone chain), its corners only. */
function hullOf(points: readonly Point[]): Point[] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const turn = (o: Point, a: Point, b: Point) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const half = (list: readonly Point[]) => {
    const chain: Point[] = []
    for (const p of list) {
      while (
        chain.length > 1 &&
        turn(chain[chain.length - 2]!, chain[chain.length - 1]!, p) <= 1e-9
      )
        chain.pop()
      chain.push(p)
    }
    return chain.slice(0, -1)
  }
  return [...half(sorted), ...half([...sorted].reverse())]
}

/** A hull without its bevels: each side much shorter than the longest
 *  between two long ones (a sticker's corner cut, not a curve's step)
 *  replaced by where its two neighbours meet. */
function unbevelled(hull: readonly Point[]): Point[] {
  let points = straightened(hull)
  const length = (i: number) => gap(points[i]!, points[(i + 1) % points.length]!)
  for (;;) {
    const longest = Math.max(...points.map((_, i) => length(i)))
    const n = points.length
    const short = points.findIndex(
      (_, i) =>
        length(i) < BEVEL * longest &&
        length((i + n - 1) % n) > LONG * longest &&
        length((i + 1) % n) > LONG * longest,
    )
    if (short < 0 || n <= 3) return points
    const [a, b] = [points[(short + n - 1) % n]!, points[short]!]
    const [c, d] = [points[(short + 1) % n]!, points[(short + 2) % n]!]
    // Where line a-b meets line c-d.
    const [rx, ry, sx, sy] = [b[0] - a[0], b[1] - a[1], d[0] - c[0], d[1] - c[1]]
    const across = rx * sy - ry * sx
    if (Math.abs(across) < 1e-9) return points
    const t = ((c[0] - a[0]) * sy - (c[1] - a[1]) * sx) / across
    const meet: Point = [a[0] + t * rx, a[1] + t * ry]
    points = points.flatMap((p, i) => (i === short ? [meet] : i === (short + 1) % n ? [] : [p]))
  }
}

/** A hull without its corners that stand on the line between their
 *  neighbours (the gaps between the stickers along a side), a curve kept. */
function straightened(hull: readonly Point[]): Point[] {
  let points = [...hull]
  const [xs, ys] = [hull.map((p) => p[0]), hull.map((p) => p[1])]
  const size = Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys))
  // How far a corner stands off the line between its neighbours.
  const off = (i: number) => {
    const n = points.length
    const [a, p, b] = [points[(i + n - 1) % n]!, points[i]!, points[(i + 1) % n]!]
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]]
    return Math.abs((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / Math.hypot(dx, dy)
  }
  while (points.length > 3) {
    const offs = points.map((_, i) => off(i))
    const least = offs.indexOf(Math.min(...offs))
    if (offs[least]! > STRAIGHT * size) return points
    points = points.filter((_, i) => i !== least)
  }
  return points
}

/** A corner standing off its neighbours' line by less than this, in the
 *  hull's size, is no corner. */
const STRAIGHT = 0.003

/** Whether a hull is a face's frame: its corners each near the frame's
 *  sides, and a corner near each of the frame's. */
function fills(hull: readonly Point[], face: ScanFace) {
  const near = FRAME_NEAR * Math.max(face.width, face.height)
  const { outline } = face
  const toSide = (p: Point) =>
    Math.min(
      ...outline.map((a, i) => {
        const b = outline[(i + 1) % outline.length]!
        const [dx, dy] = [b[0] - a[0], b[1] - a[1]]
        const t = Math.max(
          0,
          Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)),
        )
        return gap(p, [a[0] + t * dx, a[1] + t * dy])
      }),
    )
  return (
    hull.every((p) => toSide(p) < near) &&
    outline.every((corner) => hull.some((p) => gap(p, corner) < near))
  )
}

/** How near a hull's corner stands to its frame's, in the frame's size. */
const FRAME_NEAR = 0.12

/** A face's stickers moved and scaled to fill its frame's box, their
 *  box in its middle (a Tetraminx's hexagon, its tips cut, in the triangle
 *  that frames a Pyraminx's, would sit low and small). */
function centered(shapes: Point[][][], face: ScanFace): Point[][][] {
  const all = shapes.flat(2)
  const [xs, ys] = [all.map((p) => p[0]), all.map((p) => p[1])]
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  const scale = Math.min(face.width / (x1 - x0), face.height / (y1 - y0))
  const move = ([x, y]: Point): Point => [
    face.width / 2 + scale * (x - (x0 + x1) / 2),
    face.height / 2 + scale * (y - (y0 + y1) / 2),
  ]
  return shapes.map((polygons) => polygons.map((points) => points.map(move)))
}

/** A side this much shorter than the longest is a bevel, between sides
 *  at least this much of it. */
const BEVEL = 0.15
const LONG = 0.3

/** How much of a sticker's size it is read round, each way. */
const READ_SHARE = 0.25

const DRAWN = new Map<string, ScanFace>()

/** The face as the drawing shows it (see above). */
export function drawnFace(shape: CubeShape, face: ScanFace): ScanFace {
  if (!face.seen || !isPolyDrawn(shape)) return face
  const drawing = polyDrawing(shape)
  // Its frame in the scene (`orient`) changes nothing to its faces.
  if (drawing.offset) return face
  const key = `${shape}|${face.cells.join()}`
  const known = DRAWN.get(key)
  if (known) return known
  // The face's normal and way up, turned to the drawing's frame (a pyramid's
  // is not its model's), made unit and square to each other.
  const toDrawing = drawing.direction ?? ((v: Vec3) => [...v] as Vec3)
  const unit = (v: readonly number[]): Vec3 => {
    const length = Math.hypot(...v)
    return [v[0]! / length, v[1]! / length, v[2]! / length]
  }
  const normal = unit(toDrawing(face.seen.normal))
  const tilted = toDrawing(face.seen.up)
  const up = unit(tilted.map((x, a) => x - dot(tilted, normal) * normal[a]!))
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
  const { middle } = face.seen
  const half = Math.max(...all.flatMap(([a, b]) => [Math.abs(a), Math.abs(b)]))
  // In the plan's frame, y down: a flat face's filling its outline side to
  // side; else 2 units wide, its middle at 1, 1.
  const scale = middle ? fitScale(all, face.outline, middle) : 0
  const place = ([a, b]: Point): Point =>
    middle ? [middle[0] + scale * a, middle[1] - scale * b] : [1 + a / half, 1 - b / half]
  const placed = drawn.map((polygons) => polygons.map((points) => points.map(place)))
  // A face whose stickers fill another polygon than its frame's (a
  // Tetraminx's hexagon in a Pyraminx's triangle, a Rainbow's square
  // standing on a point): framed by what they fill, in the middle of the
  // frame.
  const other = !fills(unbevelled(hullOf(placed.flat(2))), face)
  const shapes = other ? centered(placed, face) : placed
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
    ...(other && { outline: unbevelled(hullOf(shapes.flat(2))) }),
  }
  DRAWN.set(key, seen)
  return seen
}
