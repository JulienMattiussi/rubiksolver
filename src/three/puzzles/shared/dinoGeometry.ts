import { normalIndex } from '@/lib/core/geometry'
import type { Cubie, Vec3 } from '@/lib/core/types'
import { face, type P3, type PiecePolygon } from '../../core/polygons'
import { polyhedron, type Plane } from '../../core/polyhedron'

/**
 * Geometry of the Dino Cube's pieces (see lib/puzzles/shared/rainbow.ts): the cube
 * |x|, |y|, |z| <= 1 shared out between its 12 edges, each the points
 * whose two largest coordinates are its own (their signs too): cut along
 * the faces' diagonals, each face is four triangles, one per edge around
 * it. A piece's shape only depends on its slot, so it is drawn where it
 * stands.
 *
 * The Edge Only's pieces are the same, a square hole cut out of the middle
 * of each face (a third of its width): each is then a prism along its edge,
 * a trapezoid on each of its two faces.
 */

/** Model units to scene units, its corners about as far out as a 3x3's. */
const SCALE = 1.5
/** Each piece shrunk about its center, leaving dark seams between them. */
const SHRINK = 0.97
const STICKER_SCALE = 0.84

const AXES: readonly Vec3[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
]
const CUBE: Plane[] = AXES.map((normal) => ({ normal, offset: 1 }))

const SHAPES = new Map<string, { corners: P3[]; normal: Vec3 }[]>()

/** How far in from a face the Edge Only's hole goes: to the core, a third
 *  of the way from each face's middle to its edge. */
const HOLE = 1 / 3

/** The edge at `position` (two coordinates +-1, one 0): along each of its
 *  axes, at least as far out as along the third, both ways; with `hole`,
 *  clear of the faces' holes too. */
function pieceFaces(position: Vec3, hole: boolean) {
  const id = position.join() + hole
  let faces = SHAPES.get(id)
  if (faces) return faces
  const third = position.findIndex((x) => x === 0)
  const cuts: Plane[] = [0, 1, 2]
    .filter((a) => a !== third)
    .flatMap((a) =>
      [1, -1].map((sign) => {
        const normal = [0, 0, 0] as [number, number, number]
        normal[a] = -position[a]!
        normal[third] = sign
        return { normal, offset: 0 }
      }),
    )
  // Clear of the holes: its two coordinates add up to at least 1 + HOLE.
  const inner = [0, 1, 2].map((a) => (a === third ? 0 : -position[a]!)) as unknown as Vec3
  faces = polyhedron([...CUBE, ...cuts, ...(hole ? [{ normal: inner, offset: -(1 + HOLE) }] : [])])
  SHAPES.set(id, faces)
  return faces
}

/** Every polygon of a Dino piece (or an Edge Only's: `hole`), as it stands. */
function edgePolygons(cubie: Cubie, hole: boolean): PiecePolygon[] {
  if (cubie.stickers.length === 0) return [] // the Edge Only's core never shows
  const faces = pieceFaces(cubie.position, hole)
  const points = faces.flatMap((f) => f.corners)
  const center = [0, 1, 2].map((d) => points.reduce((s, p) => s + p[d]!, 0) / points.length)
  const toScene = (p: P3): P3 =>
    p.map((v, d) => (center[d]! + (v - center[d]!) * SHRINK) * SCALE) as P3
  return faces.flatMap(({ corners, normal }) => {
    const length = Math.hypot(...normal)
    // Its faces on the cube's carry its stickers.
    const outer = AXES.some((a) => a.join() === normal.join())
    return face(
      corners.map(toScene),
      normal.map((v) => v / length) as P3,
      cubie,
      outer ? normalIndex(normal) : undefined,
      STICKER_SCALE,
    )
  })
}

export const dinoPolygons = (cubie: Cubie) => edgePolygons(cubie, false)
export const edgeOnlyPolygons = (cubie: Cubie) => edgePolygons(cubie, true)
