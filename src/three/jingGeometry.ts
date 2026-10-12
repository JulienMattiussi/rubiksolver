import { normalIndex, TET_NORMALS } from '@/lib/geometry'
import { PYRA_CORNERS, PYRA_VERTICES, pyraToCartesian } from '@/lib/pyraminx'
import type { Cubie, Vec3 } from '@/lib/types'
import { colorFacing, type P3, type PiecePolygon } from './polygons'

/**
 * Geometry of the Pyraminx Jing: a tetrahedron with bulging faces and
 * curved edges, its tips rounded, cut by one sphere per corner, centered on
 * the corner and reaching beyond the center (the Skewb-like deep cut): a
 * sphere about the turning axis turns into itself, and its seams curve more
 * than the puzzle's outline, as circles do toward their center. Each face is
 * meshed finely, every small triangle cut exactly along the seams and given
 * to the piece of the halves it lies in, with normals smoothed across the
 * mesh (no facets in the highlights). Triangles along a
 * cut are the dark seams; each sticker is doubled inward in plastic, so a
 * half caught mid-turn shows no color from inside, and while it turns its
 * cut sphere is drawn (`jingCut`): the dark, smooth surface one sees between
 * the two parts of the real puzzle. A sphere about the axis turns into
 * itself, so one still cap closes both the turning half and the rest.
 *
 * Everything is in the model's frame (see pyraminx.ts), turned to the
 * scene's by `pyraToCartesian`; a piece is found by the halves it belongs
 * to, the corners on its side of the origin.
 */

/** The corners, scene units. */
const CORNER = 2.75
/** Rounding: how far each point moves toward the sphere through the corners
 *  (0 a flat tetrahedron, 1 a sphere). */
const ROUND = 0.22
/** Blunting of the tips: no point lies much farther out than this share of
 *  the corner distance, so each tip becomes a dome. */
const TIP = 0.9
/** Where each cut crosses the axis, past the center toward the opposite
 *  face (share of the corner distance): the deeper, the smaller the centers. */
const CUT = 0.17
/** Where each cut sphere is centered along its corner's axis (share of the
 *  corner distance): the closer in, the more the seams curve. */
const BEND = 2.2
/** Half the width of a seam, same units. */
const SEAM = 0.035
/** Half the width of the seam along the puzzle's own edges, as a share of
 *  a face's height (each face draws its half). */
const CREASE = 0.009
/** How far inward the plastic lining of a sticker lies. */
const LINING = 0.02
/** Subdivisions of a face's side. */
const FINE = 28
const COARSE = 12

const AXES: readonly P3[] = PYRA_VERTICES.map((v) => unit(pyraToCartesian(PYRA_CORNERS[v])))

function unit(p: readonly number[]): P3 {
  const length = Math.hypot(...p)
  return p.map((x) => x / length) as P3
}
const dot = (a: readonly number[], b: readonly number[]) =>
  a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!

/** The radius a point of the flat tetrahedron at `length` from the center
 *  moves to: pushed toward the sphere through the corners, then softly
 *  capped, so the faces barely move and the tips (where every direction
 *  meets the same radius) round off into domes. */
function roundedRadius(length: number): number {
  const pushed = length * (1 - ROUND) + ROUND * CORNER
  const cap = TIP * CORNER
  return pushed / (1 + (pushed / cap) ** 12) ** (1 / 12)
}

/** A point of the flat tetrahedron moved onto the rounded surface. */
function rounded(p: P3): P3 {
  const length = Math.hypot(...p)
  return p.map((x) => (x * roundedRadius(length)) / length) as P3
}

/** The faces' outward normals; they lie a third of the corner distance out. */
const FACE_NORMALS: readonly P3[] = AXES.map((a) => a.map((x) => -x) as P3)
const INRADIUS = CORNER / 3

/** How far inside the rounded surface a point lies (negative: outside). */
function inside(p: readonly number[]): number {
  const length = Math.hypot(p[0]!, p[1]!, p[2]!)
  const flat = Math.min(
    ...FACE_NORMALS.map((n) => {
      const along = dot(p, n) / length
      return along > 1e-9 ? INRADIUS / along : Infinity
    }),
  )
  return roundedRadius(flat) - length
}

/** Each corner's cut sphere: its center, along the corner's axis, and radius. */
const SPHERES = AXES.map((a) => ({
  center: a.map((x) => x * BEND * CORNER) as P3,
  radius: (BEND + CUT) * CORNER,
}))

/** How far a point lies inside corner k's cut sphere (negative: outside). */
const beyond = (p: readonly number[], k: number): number => {
  const { center, radius } = SPHERES[k]!
  return radius - Math.hypot(p[0]! - center[0]!, p[1]! - center[1]!, p[2]! - center[2]!)
}

/** The halves a point lies in, as a key: the corners whose cut it is inside. */
const halvesOf = (p: readonly number[]): string =>
  AXES.flatMap((_, k) => (beyond(p, k) > 0 ? [k] : [])).join('')

/** Whether a point lies on a seam: close to one of the cuts. */
const onSeam = (p: readonly number[]): boolean => AXES.some((_, k) => Math.abs(beyond(p, k)) < SEAM)

/** A vertex: its position, then its normal (`[x, y, z, nx, ny, nz]`), or
 *  any vector a polygon is cut by linear interpolation. */
type Vertex = number[]

/** A small convex polygon cut in two where `f` changes sign (interpolated
 *  along its sides): the side where it is positive, then the other. */
function split(polygon: Vertex[], f: (p: Vertex) => number): [Vertex[], Vertex[]] {
  const plus: Vertex[] = []
  const minus: Vertex[] = []
  polygon.forEach((p, i) => {
    const q = polygon[(i + 1) % polygon.length]!
    const [fp, fq] = [f(p), f(q)]
    ;(fp >= 0 ? plus : minus).push(p)
    if (fp >= 0 !== fq >= 0) {
      const t = fp / (fp - fq)
      const cut = p.map((x, d) => x + (q[d]! - x) * t)
      plus.push(cut)
      minus.push(cut)
    }
  })
  return [plus, minus]
}

/** A small triangle of the surface cut along every seam's two borders: each
 *  part lies wholly in one piece, or on a seam. */
function cutAlongSeams(triangle: Vertex[]): Vertex[][] {
  let parts = [triangle]
  AXES.forEach((_, k) => {
    for (const level of [-SEAM, SEAM]) {
      parts = parts.flatMap((part) =>
        split(part, (p) => beyond(p, k) - level).filter((side) => side.length >= 3),
      )
    }
  })
  return parts
}

/** The halves a piece belongs to, from its model position: the corners on
 *  its side of the origin. */
const halvesOfPiece = (position: Vec3): string =>
  PYRA_VERTICES.flatMap((v, k) => (dot(position, PYRA_CORNERS[v]) > 0 ? [k] : [])).join('')

interface Patch {
  readonly polygon: P3[]
  /** The smoothed normal at each point. */
  readonly normals: P3[]
  /** The polygon's own (for culling and shading a flat drawing). */
  readonly normal: P3
  /** The face it lies on (its sticker's normal index), or none for a seam. */
  readonly ni?: number
}

/** Every small triangle of the surface, grouped by the piece it belongs to. */
function mesh(subdivisions: number): Map<string, Patch[]> {
  const pieces = new Map<string, Patch[]>()
  const corners = AXES.map((a) => a.map((x) => x * CORNER) as P3)
  TET_NORMALS.forEach((normal, opposite) => {
    const [a, b, c] = corners.filter((_, k) => k !== opposite) as [P3, P3, P3]
    /** A point of the face from its two coordinates along the sides from a. */
    const at = ([u, v]: readonly number[]): P3 =>
      [0, 1, 2].map((d) => a[d]! + (b[d]! - a[d]!) * u! + (c[d]! - a[d]!) * v!) as P3
    /** How far a point (u, v) lies from each side of the face. */
    const sides = [(p: Vertex) => p[0]!, (p: Vertex) => p[1]!, (p: Vertex) => 1 - p[0]! - p[1]!]
    /** The surface at (u, v), with its normal there (by finite differences). */
    const surface = ([u, v]: Vertex): Vertex => {
      const point = rounded(at([u!, v!]))
      const e = 1e-4
      const du = rounded(at([u! + e, v!])).map((x, d) => x - point[d]!)
      const dv = rounded(at([u!, v! + e])).map((x, d) => x - point[d]!)
      return [...point, ...outward([[0, 0, 0], du as P3, dv as P3], point)]
    }
    const add = (cell: Vertex[]) => {
      // First along the face's own sides (in the flat face), then the cuts.
      let parts = [cell]
      for (const side of sides) {
        parts = parts.flatMap((part) =>
          split(part, (p) => side(p) - CREASE).filter((half) => half.length >= 3),
        )
      }
      for (const part of parts) {
        const crease = sides.some((side) => side(centerOf(part)) < CREASE)
        for (const polygon of cutAlongSeams(part.map(surface))) {
          const middle = centerOf(polygon)
          const key = halvesOf(middle)
          const normals = polygon.map((p) => unit(p.slice(3)))
          const list = pieces.get(key) ?? []
          list.push({
            polygon: polygon.map((p) => p.slice(0, 3) as P3),
            normals,
            normal: unit(centerOf(normals)),
            ...(crease || onSeam(middle) ? {} : { ni: normalIndex(normal) }),
          })
          pieces.set(key, list)
        }
      }
    }
    for (let i = 0; i < subdivisions; i++) {
      for (let j = 0; i + j < subdivisions; j++) {
        const uv = (di: number, dj: number): Vertex => [
          (i + di) / subdivisions,
          (j + dj) / subdivisions,
        ]
        add([uv(0, 0), uv(1, 0), uv(0, 1)])
        if (i + j + 1 < subdivisions) add([uv(1, 0), uv(1, 1), uv(0, 1)])
      }
    }
  })
  return pieces
}

/** The average of a polygon's vertices (all their components). */
const centerOf = (polygon: readonly Vertex[]): Vertex =>
  polygon[0]!.map((_, d) => polygon.reduce((s, p) => s + p[d]!, 0) / polygon.length)

/** A triangle's normal, turned away from the center (seen from `at`). */
function outward([p, q, r]: P3[], at: readonly number[]): P3 {
  const u = [0, 1, 2].map((d) => q![d]! - p![d]!)
  const v = [0, 1, 2].map((d) => r![d]! - p![d]!)
  const n = unit([
    u[1]! * v[2]! - u[2]! * v[1]!,
    u[2]! * v[0]! - u[0]! * v[2]!,
    u[0]! * v[1]! - u[1]! * v[0]!,
  ])
  return dot(n, at) >= 0 ? n : (n.map((x) => -x) as P3)
}

const MESHES = new Map<number, Map<string, Patch[]>>()
function meshOf(subdivisions: number): Map<string, Patch[]> {
  let found = MESHES.get(subdivisions)
  if (!found) {
    found = mesh(subdivisions)
    MESHES.set(subdivisions, found)
  }
  return found
}

/** The part of corner k's cut sphere inside the puzzle, in plastic: a cap
 *  meshed in rings about the axis, cut exactly where it leaves the surface
 *  (kept a hair inside it). */
function capPolygons(k: number): PiecePolygon[] {
  const { center, radius } = SPHERES[k]!
  const axis = AXES[k]!
  // Two directions across the axis.
  const across = unit(Math.abs(axis[0]) < 0.9 ? [0, -axis[2], axis[1]] : [axis[2], 0, -axis[0]])
  const third = unit([
    axis[1] * across[2] - axis[2] * across[1],
    axis[2] * across[0] - axis[0] * across[2],
    axis[0] * across[1] - axis[1] * across[0],
  ])
  const [rings, sectors] = [24, 72]
  /** Radians from the axis: past where the cap leaves the puzzle. */
  const reach = 0.9
  const at = (ring: number, sector: number): Vertex => {
    const [phi, theta] = [(reach * ring) / rings, (2 * Math.PI * sector) / sectors]
    const normal = [0, 1, 2].map(
      (d) =>
        -axis[d]! * Math.cos(phi) +
        Math.sin(phi) * (Math.cos(theta) * across[d]! + Math.sin(theta) * third[d]!),
    )
    return [...normal.map((x, d) => center[d]! + radius * x), ...normal]
  }
  const polygons: PiecePolygon[] = []
  const add = (triangle: Vertex[]) => {
    const [kept] = split(triangle, (p) => inside(p) - 0.01)
    if (kept.length < 3) return
    const normals = kept.map((p) => unit(p.slice(3)))
    polygons.push({
      points: kept.map((p) => p.slice(0, 3) as P3),
      paint: 'body',
      normal: unit(centerOf(normals)),
      normals,
    })
  }
  for (let ring = 0; ring < rings; ring++) {
    for (let sector = 0; sector < sectors; sector++) {
      add([at(ring, sector), at(ring + 1, sector), at(ring + 1, sector + 1)])
      add([at(ring, sector), at(ring + 1, sector + 1), at(ring, sector + 1)])
    }
  }
  return polygons
}

const CAPS = new Map<number, PiecePolygon[]>()

/** What to draw while `moving` turns: the cut sphere of its corner, closing
 *  the opening between the turning half and the rest. */
export function jingCut(moving: readonly Cubie[]): PiecePolygon[] {
  const corner = moving.find((c) => c.stickers.length === 3)
  if (!corner) return []
  const k = Number(halvesOfPiece(corner.position))
  let cap = CAPS.get(k)
  if (!cap) {
    cap = capPolygons(k)
    CAPS.set(k, cap)
  }
  return cap
}

/** Every polygon of a Jing piece (`subdivisions` per face side), its
 *  stickers `lined` in plastic or not (a flat drawing needs no lining). */
function jingPiece(cubie: Cubie, subdivisions: number, lined: boolean): PiecePolygon[] {
  if (cubie.stickers.length === 0) return [] // the core never shows
  const patches = meshOf(subdivisions).get(halvesOfPiece(cubie.position)) ?? []
  return patches.flatMap(({ polygon, normals, normal, ni }): PiecePolygon[] => {
    const color = ni === undefined ? undefined : colorFacing(cubie, ni)
    if (!color) return [{ points: polygon, paint: 'body', normal, normals }]
    if (!lined) return [{ points: polygon, paint: color, normal, normals, ni }]
    const lining = polygon.map((p, i) => p.map((x, d) => x - normals[i]![d]! * LINING) as P3)
    return [
      { points: polygon, paint: color, normal, normals, ni },
      { points: lining, paint: 'body', normal, normals },
    ]
  })
}

/** The Jing's polygons for the 3D view, and coarser ones for thumbnails. */
export const jingPolygons = (cubie: Cubie) => jingPiece(cubie, FINE, true)
export const jingThumbnail = (cubie: Cubie) =>
  cubie.stickers.length === 0 ? [] : jingPiece(cubie, COARSE, false)
