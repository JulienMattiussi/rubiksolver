import { mapVec, normalIndex } from '@/lib/core/geometry'
import type { Cubie, Vec3 } from '@/lib/core/types'
import { GEM_CELL, OCT3_REACH, VTO_CELL, type CellBounds } from '@/lib/puzzles/polyhedron/vto'
import { face, type DecalPlace, type P3, type PiecePolygon } from '../../core/polygons'
import { polyhedron, type Plane } from '../../core/polyhedron'

/**
 * Geometry of the octahedra cut from a cube, the 4-Trajber's Octahedron
 * (lib/puzzles/polyhedron/oct4.ts) and the VTO (lib/puzzles/polyhedron/vto.ts): each piece is its cubie's cell
 * of the cube (the outer layers open outward) cut by the octahedron
 * |x| + |y| + |z| <= reach, a convex polyhedron found from its planes. A piece's shape only depends on its slot, so it is drawn
 * where it stands; the face on the octahedron bears its sticker.
 */

/** The 4-Trajber's corners, in model units (cells 2 wide): far enough for
 *  the cube's corners to show a triangle in the middle of each face. */
const REACH = 8
/** Model units to scene units: about the Pyraminx's size. */
const SCALE = 0.3
/** Each piece shrunk about its center, leaving dark seams between them. */
const SHRINK = 0.98
const STICKER_SCALE = 0.84

const DIAGONALS: readonly Vec3[] = [-1, 1].flatMap((x) =>
  [-1, 1].flatMap((y) => [-1, 1].map((z): Vec3 => [x, y, z])),
)

/** How an octahedron cut from a cube is laid out: its cells along each
 *  axis, its reach, its scale on screen, and where its corners are cut flat
 *  (a square each, the GEM-0's). */
interface OctLayout {
  readonly cell: CellBounds
  readonly reach: number
  readonly scale: number
  readonly truncate?: number
}

/** The convex piece in the cell at `position`. */
function cellPlanes(position: Vec3, layout: OctLayout): Plane[] {
  const axis = (a: number, sign: number) => mapVec([0, 1, 2], (d) => (d === a ? sign : 0))
  const cell: Plane[] = [0, 1, 2].flatMap((a) => {
    const [lo, hi] = layout.cell(position[a]!)
    // An outer layer opens outward: no plane there.
    return [
      ...(hi < Infinity ? [{ normal: axis(a, 1), offset: hi }] : []),
      ...(lo > -Infinity ? [{ normal: axis(a, -1), offset: -lo }] : []),
    ]
  })
  const octahedron = DIAGONALS.map((normal) => ({ normal, offset: layout.reach }))
  const flat: Plane[] =
    layout.truncate === undefined
      ? []
      : [0, 1, 2].flatMap((a) =>
          [1, -1].map((sign) => ({ normal: axis(a, sign), offset: layout.truncate! })),
        )
  return [...cell, ...octahedron, ...flat]
}

/** A drawing's polygons for a layout, each cell's pieces found once; with
 *  `outside`, only the faces on the octahedron (the picker thumbnail, drawn
 *  back to front, where the faces between pieces would cover them). */
function octahedronPolygons(layout: OctLayout, outside = false): (cubie: Cubie) => PiecePolygon[] {
  const shapes = new Map<string, { corners: P3[]; normal: Vec3 }[]>()
  return (cubie) => {
    const id = cubie.position.join()
    let faces = shapes.get(id)
    if (!faces) {
      faces = polyhedron(cellPlanes(cubie.position, layout))
      shapes.set(id, faces)
    }
    const points = faces.flatMap((f) => f.corners)
    const center = [0, 1, 2].map((d) => points.reduce((s, p) => s + p[d]!, 0) / points.length)
    const toScene = (p: P3): P3 =>
      p.map((v, d) => (center[d]! + (v - center[d]!) * SHRINK) * layout.scale) as P3
    return faces.flatMap(({ corners, normal }) => {
      const length = Math.hypot(...normal)
      // A face on the octahedron lies across a diagonal, a flat corner on
      // its cut: either bears a sticker.
      const a = normal.findIndex((v) => v !== 0)
      const onCut =
        length === 1 &&
        layout.truncate !== undefined &&
        corners.every((p) => Math.abs(p[a]! * normal[a]! - layout.truncate!) < 1e-9)
      const ni = length > 1.5 || onCut ? normalIndex(normal) : undefined
      if (outside && ni === undefined) return []
      return face(
        corners.map(toScene),
        normal.map((v) => v / length) as P3,
        cubie,
        ni,
        STICKER_SCALE,
      )
    })
  }
}

/** The 4-Trajber's: a 4x4x4 (cells 2 wide, the outer ones open), its cube's
 *  corners showing a triangle in the middle of each face. */
const OCT4_LAYOUT: OctLayout = {
  cell: (c) => [c === -3 ? -Infinity : c - 1, c === 3 ? Infinity : c + 1],
  reach: REACH,
  scale: SCALE,
}
export const octPolygons = octahedronPolygons(OCT4_LAYOUT)
export const octThumbnail = octahedronPolygons(OCT4_LAYOUT, true)

/** The VTO's and the GEM-0's, the size of the 4-Trajber's. */
const OCT3_SCALE = (REACH * SCALE) / OCT3_REACH

/** The VTO's: its tips, the triangles beside them, its edges. */
const VTO_LAYOUT: OctLayout = { cell: VTO_CELL, reach: OCT3_REACH, scale: OCT3_SCALE }
export const vtoPolygons = octahedronPolygons(VTO_LAYOUT)
export const vtoThumbnail = octahedronPolygons(VTO_LAYOUT, true)

/** The GEM-0's: a 3x3x3 cut, its corners flat where the VTO's tips part. */
const GEM_LAYOUT: OctLayout = { cell: GEM_CELL, reach: OCT3_REACH, scale: OCT3_SCALE, truncate: 1 }
export const gemPolygons = octahedronPolygons(GEM_LAYOUT)
export const gemThumbnail = octahedronPolygons(GEM_LAYOUT, true)

/** The octahedron's yaw on screen: its front corner a little to the left. */
export const OCT_YAW = -Math.PI / 12

/** The emblem on a GEM-0 square (a cube center): in the middle of its flat
 *  corner, upright toward its first triangle, which turns with it. */
export function gemEmblem(cubie: Cubie): DecalPlace {
  const { scale, truncate } = GEM_LAYOUT
  const axis = cubie.position.map(Math.sign) as unknown as P3
  const a = axis.findIndex((v) => v !== 0)
  const toward = cubie.stickers[0]!.normal
  const up = toward.map((v, d) => (d === a ? 0 : v)) as unknown as P3
  const length = Math.hypot(...up)
  return {
    center: axis.map((v) => v * (truncate! + 0.01) * scale) as P3,
    normal: axis,
    up: up.map((v) => v / length) as P3,
    size: 0.62 * scale,
  }
}
