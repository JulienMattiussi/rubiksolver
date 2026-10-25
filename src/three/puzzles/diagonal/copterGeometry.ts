import { normalIndex } from '@/lib/core/geometry'
import type { Cubie, Vec3 } from '@/lib/core/types'
import { colorFacing, type P3, type PiecePolygon } from '../../core/polygons'
import { faceAxes, onFace as onFaceOf } from './faceFan'

/**
 * Geometry of the Curvy Copters (lib/puzzles/diagonal/copter.ts), drawn on
 * the cube |x|, |y|, |z| <= 1. Each face is cut by four circles, one about
 * the middle of each of its edges (radius 1 on the Curvy Copter, all four
 * meeting at the face's middle; a little more on the III, overlapping
 * there), and a corner is a quarter disc at each of its corners. A point of
 * a face belongs to the piece the circles it lies in say: one, an edge's;
 * two side by side, a leaf's; three, a petal's (towards the edge left out's
 * opposite); four, the center. Each piece's region is traced from a point
 * inside it, ray by ray, and drawn as a fan of triangles (the drawing takes
 * convex polygons), its body under its sticker.
 */

/** Model units to scene units, its corners about as far out as a 3x3's. */
const SCENE = 1.5
const STICKER_SCALE = 0.86
const BODY_SCALE = 1.06
const LIFT = 0.004

interface CopterShape {
  /** The logic's coordinate of a face (4 or 6). */
  readonly scale: number
  /** A leaf's offsets along its face (2 or 3). */
  readonly leaf: number
  /** The circles' radius, squared. */
  readonly circle: number
  /** A corner's quarter disc's radius. */
  readonly corner: number
}

const CURVY: CopterShape = { scale: 4, leaf: 2, circle: 1, corner: 0.42 }
const CURVY3: CopterShape = { scale: 6, leaf: 3, circle: 1.25, corner: 0.5 }

/** The logic slot (as a key) of the piece at (u, v) on a face, or none on a
 *  cut. */
function slotAt(shape: CopterShape, normal: Vec3, u: number, v: number): string {
  const { axis, a, b } = faceAxes(normal)
  const p = [0, 0, 0]
  p[axis] = normal[axis]! * shape.scale
  const su = Math.sign(u) || 1
  const sv = Math.sign(v) || 1
  if ((Math.abs(u) - 1) ** 2 + (Math.abs(v) - 1) ** 2 < shape.corner ** 2) {
    p[a] = su * shape.scale
    p[b] = sv * shape.scale
    return p.join()
  }
  // The circles about the face's four edges it lies in: [axis, side].
  const inside = (
    [
      [a, 1],
      [a, -1],
      [b, 1],
      [b, -1],
    ] as const
  ).filter(([t, s]) => {
    const du = t === a ? u - s : u
    const dv = t === b ? v - s : v
    return du * du + dv * dv < shape.circle
  })
  if (inside.length === 1) {
    const [t, s] = inside[0]!
    p[t] = s * shape.scale
  } else if (inside.length === 2) {
    const [[t1, s1], [t2, s2]] = inside as [readonly [number, number], readonly [number, number]]
    if (t1 === t2) return ''
    p[t1] = s1 * shape.leaf
    p[t2] = s2 * shape.leaf
  } else if (inside.length === 3) {
    const out = (
      [
        [a, 1],
        [a, -1],
        [b, 1],
        [b, -1],
      ] as const
    ).find(([t, s]) => !inside.some(([t2, s2]) => t2 === t && s2 === s))!
    p[out[0]] = -out[1] * 2
  } else if (inside.length === 0) return ''
  return p.join()
}

/** A point of a face in the scene. */
const onFace = (normal: Vec3, u: number, v: number, lift = 0): P3 =>
  onFaceOf(normal, u, v, lift, SCENE)

const OUTLINES = new Map<string, [number, number][]>()

/** The outline of a piece's region on a face, traced from a point inside
 *  it by `rays` rays (first leaving it along each). */
function outline(
  shape: CopterShape,
  position: Vec3,
  normal: Vec3,
  rays: number,
): [number, number][] {
  const id = `${shape.scale}|${position.join()}|${normal.join()}|${rays}`
  const known = OUTLINES.get(id)
  if (known) return known
  const { a, b } = faceAxes(normal)
  const slot = position.join()
  const seed: [number, number] = [
    (position[a]! / shape.scale) * 0.9,
    (position[b]! / shape.scale) * 0.9,
  ]
  const points: [number, number][] = []
  for (let k = 0; k < rays; k++) {
    const angle = (2 * Math.PI * k) / rays
    const [du, dv] = [Math.cos(angle), Math.sin(angle)]
    let t = 0
    const step = 0.01
    for (;;) {
      const [u, v] = [seed[0] + (t + step) * du, seed[1] + (t + step) * dv]
      if (Math.abs(u) > 1 || Math.abs(v) > 1 || slotAt(shape, normal, u, v) !== slot) break
      t += step
    }
    points.push([seed[0] + t * du, seed[1] + t * dv])
  }
  OUTLINES.set(id, points)
  return points
}

/** A region as a fan of triangles about its seed, shrunk by `scale`. */
function fan(
  points: readonly [number, number][],
  normal: Vec3,
  scale: number,
  lift: number,
): P3[][] {
  const c = [0, 1].map((i) => points.reduce((s, p) => s + p[i]!, 0) / points.length) as [
    number,
    number,
  ]
  const clamp = (x: number) => Math.max(-1, Math.min(1, x))
  const at = ([u, v]: readonly [number, number]) =>
    onFace(normal, clamp(c[0] + (u - c[0]) * scale), clamp(c[1] + (v - c[1]) * scale), lift)
  return points.map((p, i) => [at(c), at(p), at(points[(i + 1) % points.length]!)])
}

function polygonsOf(shape: CopterShape, rays: number) {
  return (cubie: Cubie): PiecePolygon[] =>
    cubie.stickers.flatMap((s) => {
      const normal = s.normal.map((v) => v + 0) as unknown as P3
      const points = outline(shape, cubie.position, s.normal, rays)
      const ni = normalIndex(s.normal)
      const color = colorFacing(cubie, ni)
      return [
        // The body a little wider, just under the face: it closes the cuts,
        // the inside never shows through.
        ...fan(points, s.normal, BODY_SCALE, -0.01).map((tri): PiecePolygon => ({
          points: tri,
          paint: 'body',
          normal,
        })),
        ...(color
          ? fan(points, s.normal, STICKER_SCALE, LIFT).map((tri): PiecePolygon => ({
              points: tri,
              paint: color,
              normal,
              ni,
            }))
          : []),
      ]
    })
}

/** For the picker's thumbnail (an SVG, which takes any polygon): each
 *  region whole, its body then its sticker. */
function outlinesOf(shape: CopterShape) {
  return (cubie: Cubie): PiecePolygon[] =>
    cubie.stickers.flatMap((s) => {
      const normal = s.normal.map((v) => v + 0) as unknown as P3
      const points = outline(shape, cubie.position, s.normal, 32)
      const ni = normalIndex(s.normal)
      const color = colorFacing(cubie, ni)
      const ring = (scale: number) => fan(points, s.normal, scale, 0).map((tri) => tri[1]!)
      return [
        { points: ring(1), paint: 'body', normal } satisfies PiecePolygon,
        ...(color ? [{ points: ring(STICKER_SCALE), paint: color, normal, ni }] : []),
      ]
    })
}

export const copterPolygons = polygonsOf(CURVY, 48)
export const copterThumbnail = outlinesOf(CURVY)
export const copter3Polygons = polygonsOf(CURVY3, 48)
export const copter3Thumbnail = outlinesOf(CURVY3)
