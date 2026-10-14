import { normalIndex, TET_NORMALS } from '@/lib/core/geometry'
import {
  PYRA_CORNERS,
  PYRA_FACE_COLOR,
  PYRA_VERTICES,
  pyraToCartesian,
} from '@/lib/puzzles/pyramid/pyraminx'
import type { Cubie, Vec3 } from '@/lib/core/types'
import { face, type P3, type PiecePolygon } from '../../core/polygons'

/**
 * Geometry of the Pyraminx's pieces (and the Master's), from the unit cells
 * of the model (see pyraminx.ts): a tip, an edge, a wing or a face center is
 * a small tetrahedron (its corners at its position plus each corner
 * direction), a center piece, co-tip or midge an octahedron (its corners two
 * steps along each axis). Every face is drawn, the hidden ones
 * in plastic (they show through the gaps while a layer turns); the faces
 * lying on the puzzle's faces carry the piece's stickers.
 */

/** Model units to scene units on the Pyraminx, its corners about as far out
 *  as a 3x3's; the Master's cells are smaller, its size the same. */
const SCALE = 0.52 * 3
/** Each piece shrunk about its center, leaving dark seams between them. */
const SHRINK = 0.985
/** Share of a face its sticker covers (triangles need a wider margin). */
const STICKER_SCALE = 0.82

const CORNERS: readonly Vec3[] = PYRA_VERTICES.map((v) => PYRA_CORNERS[v])

const unit = (v: Vec3): P3 => {
  const p = pyraToCartesian(v)
  const length = Math.hypot(...p)
  return p.map((x) => x / length) as P3
}

/** The normal index of a model normal when it is one of the puzzle's faces. */
const TET_INDEX = new Map(TET_NORMALS.map((n) => [n.join(), normalIndex(n)]))

interface CellFace {
  corners: Vec3[]
  normal: Vec3
  /** The Tetraminx's cut tip, an octahedron's face toward its corner, in
   *  the color of a face beside it. */
  split?: true
}

function polygonsOf(cubie: Cubie, size: number, faces: CellFace[]): PiecePolygon[] {
  const toScene = (p: readonly number[]): P3 =>
    pyraToCartesian(p as unknown as Vec3).map((v) => (v * SCALE) / size) as P3
  const center = cubie.position
  const shrink = (p: Vec3) => toScene(p.map((v, a) => center[a]! + (v - center[a]!) * SHRINK))
  return faces.flatMap(({ corners, normal, split }) => {
    if (!split) {
      return face(
        corners.map(shrink),
        unit(normal),
        cubie,
        TET_INDEX.get(normal.join()),
        STICKER_SCALE,
      )
    }
    // One color, a face beside it: its center piece's home corner (the one
    // opposite the face whose color it lacks) takes the color of the face
    // opposite the next corner, each tip its own (a fixed sticker, nothing
    // to paint: not clickable).
    const home = PYRA_VERTICES.findIndex(
      (v) => !cubie.stickers.some((st) => st.color === PYRA_FACE_COLOR[v]),
    )
    const color = PYRA_FACE_COLOR[PYRA_VERTICES[(home + 1) % PYRA_VERTICES.length]!]
    const tip: Cubie = { position: cubie.position, stickers: [{ normal, color }] }
    return face(corners.map(shrink), unit(normal), tip, normalIndex(normal), STICKER_SCALE).map(
      (polygon) => ({ ...polygon, ni: undefined }),
    )
  })
}

/** A small tetrahedron: the face opposite each of its corners looks the
 *  other way, along that corner's face normal. */
function tetrahedron(cubie: Cubie, size: number): PiecePolygon[] {
  const corners = CORNERS.map((v) => cubie.position.map((x, a) => x + v[a]!) as unknown as Vec3)
  return polygonsOf(
    cubie,
    size,
    corners.map((_, j) => ({
      corners: corners.filter((__, m) => m !== j),
      normal: TET_NORMALS[j]!,
    })),
  )
}

/** An octahedron: one face per octant, its corners two steps along each
 *  axis; with `truncated` (the Tetraminx), its face toward its corner
 *  colored too. */
function octahedron(cubie: Cubie, size: number, truncated: boolean): PiecePolygon[] {
  const signs = [-1, 1]
  const octants = signs.flatMap((x) => signs.flatMap((y) => signs.map((z): Vec3 => [x, y, z])))
  return polygonsOf(
    cubie,
    size,
    octants.map((s) => ({
      corners: [0, 1, 2].map(
        (a) => cubie.position.map((x, b) => (b === a ? x + 2 * s[a]! : x)) as unknown as Vec3,
      ),
      normal: s,
      ...(truncated &&
        s.every((x, a) => x === Math.sign(cubie.position[a]!)) && { split: true as const }),
    })),
  )
}

/** Every polygon of a piece of a Pyraminx of `size` layers; none for the
 *  hidden core. Its octahedra sit where the coordinates have the parity of
 *  the size (the Pyraminx's center pieces at v, the Master's co-tips at 2v
 *  and midges at v + w), its small tetrahedra elsewhere. */
export const pyraPolygons =
  (size: number, truncated = false) =>
  (cubie: Cubie): PiecePolygon[] => {
    if (cubie.stickers.length === 0) return []
    return Math.abs(cubie.position[0]) % 2 === size % 2
      ? octahedron(cubie, size, truncated)
      : tetrahedron(cubie, size)
  }

/** The Pyraminx's yaw on screen: its front face toward the viewer, a sliver
 *  of its right face showing. */
export const PYRA_YAW = -Math.PI / 18
