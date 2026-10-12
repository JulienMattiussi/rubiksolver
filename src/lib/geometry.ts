import type { Axis, Dims, Face, Vec3 } from './types'

/**
 * Integer geometry of the puzzles: faces and their normals, the per-axis
 * grids cubies live on, exact quarter-turn rotations. Axes: x = right,
 * y = up, z = towards the viewer (front). No floating point ever enters here.
 */

/** Outward normal of each face (unit axis vector). */
export const FACE_NORMAL: Record<Face, Vec3> = {
  R: [1, 0, 0],
  L: [-1, 0, 0],
  U: [0, 1, 0],
  D: [0, -1, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
}

/** The faces in normal-index order (R L U D F B, see `normalIndex`). */
export const FACES_BY_NORMAL = Object.keys(FACE_NORMAL) as Face[]

/**
 * Side-face normals of the hexagonal puzzles (the star prism's six valleys),
 * in axial coordinates [q, 0, r]: a 60 degree turn maps each to the next
 * with integers only (see star.ts).
 */
export const HEX_NORMALS: readonly Vec3[] = [
  [2, 0, -1],
  [1, 0, -2],
  [-1, 0, -1],
  [-2, 0, 1],
  [-1, 0, 2],
  [1, 0, 1],
]

/**
 * Face normals of the Pyraminx (pyraminx.ts): its corners sit at alternate
 * corners of a cube, (1,1,1), (-1,-1,1), (1,-1,-1), (-1,1,-1), and each face
 * looks away from the corner it does not touch. In the order of those
 * corners: the faces opposite U (the bottom), L, R and B (the front).
 */
export const TET_NORMALS: readonly Vec3[] = [
  [-1, -1, -1],
  [1, 1, -1],
  [-1, 1, 1],
  [1, -1, 1],
]

/** The other four diagonals: where the Pyramorphinx's stickers face once a
 *  quarter turn has laid a face of its tetrahedron the other way round (a
 *  2x2 turn maps each diagonal to an opposite one). */
const DUAL_NORMALS: readonly Vec3[] = TET_NORMALS.map((n) => n.map((x) => -x) as unknown as Vec3)

const HEX_INDEX = new Map([
  ...HEX_NORMALS.map((n, i): [string, number] => [n.join(), 6 + i]),
  ...TET_NORMALS.map((n, i): [string, number] => [n.join(), 12 + i]),
  ...DUAL_NORMALS.map((n, i): [string, number] => [n.join(), 16 + i]),
])

/** Index of a sticker normal, for compact hashing and sticker ids: 0..5 for
 *  the cube faces (R L U D F B), 6..11 for the hexagonal side faces, 12..15
 *  for the Pyraminx's, 16..19 for the diagonals opposite them. */
export function normalIndex(n: Vec3): number {
  const zeros = (n[0] === 0 ? 1 : 0) + (n[1] === 0 ? 1 : 0) + (n[2] === 0 ? 1 : 0)
  if (zeros === 2) {
    if (n[0] !== 0) return n[0] > 0 ? 0 : 1
    if (n[1] !== 0) return n[1] > 0 ? 2 : 3
    return n[2] > 0 ? 4 : 5
  }
  const index = HEX_INDEX.get(n.join())
  if (index === undefined) throw new Error(`normalIndex: unknown normal ${n.join()}`)
  return index
}

/** The normal of a normal index, the inverse of `normalIndex`. */
export function normalOfIndex(index: number): Vec3 {
  const face = FACES_BY_NORMAL[index]
  const normal = face
    ? FACE_NORMAL[face]
    : index < 12
      ? HEX_NORMALS[index - 6]
      : index < 16
        ? TET_NORMALS[index - 12]
        : DUAL_NORMALS[index - 16]
  if (!normal) throw new Error(`normalOfIndex: no normal ${index}`)
  return normal
}

/** The cube face whose outward normal is `n` (a unit axis vector). */
export function faceOfNormal(n: Vec3): Face {
  return FACES_BY_NORMAL[normalIndex(n)]!
}

/**
 * How each face turns. `sign` is the number of right-hand-rule quarter turns
 * for ONE clockwise turn as seen from outside the face: -1 for the +axis faces
 * (U, R, F), +1 for the -axis ones (D, L, B), since viewing from the opposite
 * side flips the apparent handedness.
 */
interface FaceSpec {
  readonly axis: Axis
  /** Index into a Vec3 of the coordinate along the axis (0=x, 1=y, 2=z). */
  readonly coordIndex: 0 | 1 | 2
  /** Side of the face along its axis. */
  readonly dir: 1 | -1
  readonly sign: 1 | -1
}

export const FACE_SPEC: Record<Face, FaceSpec> = {
  U: { axis: 'y', coordIndex: 1, dir: 1, sign: -1 },
  D: { axis: 'y', coordIndex: 1, dir: -1, sign: 1 },
  R: { axis: 'x', coordIndex: 0, dir: 1, sign: -1 },
  L: { axis: 'x', coordIndex: 0, dir: -1, sign: 1 },
  F: { axis: 'z', coordIndex: 2, dir: 1, sign: -1 },
  B: { axis: 'z', coordIndex: 2, dir: -1, sign: 1 },
}

const AXIS_INDEX: Record<Axis, 0 | 1 | 2> = { x: 0, y: 1, z: 2 }

/** Axis a face turns about. */
export function faceAxis(face: Face): Axis {
  return FACE_SPEC[face].axis
}

/** Layers stacked along a face's axis (1 means the face has no turn). */
export function faceLayers(dims: Dims, face: Face): number {
  return dims[FACE_SPEC[face].coordIndex]
}

/**
 * Whether a quarter turn about `axis` keeps the shape: it maps the two other
 * axes onto each other, so their layer counts must match. True on every cube,
 * false on every axis of a 1x2x3 (which is why it only does half turns).
 */
export function quarterTurnFits(dims: Dims, axis: Axis): boolean {
  const a = AXIS_INDEX[axis]
  return dims[(a + 1) % 3] === dims[(a + 2) % 3]
}

const COORDS = new Map<number, readonly number[]>()

/**
 * Cubie grid coordinates of an axis with `n` layers, centered on 0. Odd counts
 * land on integers, even ones step by two to stay integral: 1 -> [0],
 * 2 -> [-1,1], 3 -> [-1,0,1], 4 -> [-3,-1,1,3]. Memoized: this is on the path
 * of every move.
 */
export function layerCoords(n: number): readonly number[] {
  let coords = COORDS.get(n)
  if (!coords) {
    coords = Array.from({ length: n }, (_, i) => (n % 2 === 1 ? i - (n - 1) / 2 : 2 * i - (n - 1)))
    COORDS.set(n, coords)
  }
  return coords
}

/** Coordinate of the outermost layer of an axis, on the `dir` side. */
export function outerCoord(n: number, dir: 1 | -1): number {
  const coords = layerCoords(n)
  return (dir > 0 ? coords[coords.length - 1] : coords[0])!
}

/** Rotate an integer vector by +90 degrees (right-hand rule) about `axis`. */
function rotate90(v: Vec3, axis: Axis): Vec3 {
  const [x, y, z] = v
  switch (axis) {
    case 'x':
      return [x, -z, y]
    case 'y':
      return [z, y, -x]
    case 'z':
      return [-y, x, z]
  }
}

/** Rotate by `times` quarter turns about `axis` (positive = right-hand rule). */
export function rotateN(v: Vec3, axis: Axis, times: number): Vec3 {
  let out = v
  const t = ((times % 4) + 4) % 4
  for (let i = 0; i < t; i++) out = rotate90(out, axis)
  return out
}

/** The 24 rotations of the cube's axes (whole-puzzle turns: no mirror), as
 *  maps of integer vectors, from closing quarter turns about x and y. */
export const AXIS_ROTATIONS: readonly ((v: Vec3) => Vec3)[] = (() => {
  const probe: Vec3 = [1, 2, 3]
  const found = new Map<string, (v: Vec3) => Vec3>([[probe.join(), (v: Vec3) => v]])
  let frontier = [...found.values()]
  while (frontier.length) {
    frontier = frontier.flatMap((map) =>
      (['x', 'y'] as const).flatMap((axis) => {
        const next = (v: Vec3) => rotateN(map(v), axis, 1)
        const key = next(probe).join()
        if (found.has(key)) return []
        found.set(key, next)
        return [next]
      }),
    )
  }
  return [...found.values()]
})()
