import { SHAPE_DIMS } from './types'
import type { Axis, Color, Cube, CubeShape, Cubie, Dims, Face, Move, Sticker, Vec3 } from './types'

/**
 * Cube model as cubies at integer positions: {-1,0,1}^3 for a 3x3, {-1,1}^3
 * for a 2x2 (it simply skips coordinate 0), {-3,-1,1,3}^3 for a 4x4 (layers
 * two units apart, so they stay integers). Axes: x = right, y = up,
 * z = towards the viewer (front).
 *
 * Nothing here assumes a cube: a shape is just three layer counts, so the
 * 1x2x3 cuboid uses one grid per axis ({-1,0,1} x {-1,1} x {0}). What its
 * shape forbids follows from the geometry, not from special cases: a quarter
 * turn about an axis maps its two other axes onto each other, so it is only
 * legal when those two dimensions are equal.
 *
 * A move rotates one or two layers of cubies by an exact 90 or 180 degree
 * integer rotation, so positions and normals never drift: no floating point
 * ever enters the logical state. All queries (isSolved, the solver) read this
 * model; the 3D view derives its geometry from it.
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

/** Solved color of each face (standard Western scheme: white up, green front). */
export const FACE_COLOR: Record<Face, Color> = {
  U: 'W',
  D: 'Y',
  F: 'G',
  B: 'B',
  R: 'R',
  L: 'O',
}

const FACES = Object.keys(FACE_NORMAL) as Face[]

function vecEqual(a: Vec3, b: Vec3): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
}

/** Opposite color of each color, derived from the face scheme above (the
 *  opposite face is the one with the negated normal). Single source of truth. */
export const OPPOSITE_COLOR: Record<Color, Color> = Object.fromEntries(
  FACES.map((face) => {
    const n = FACE_NORMAL[face]
    const opposite = FACES.find((g) => vecEqual(FACE_NORMAL[g], [-n[0], -n[1], -n[2]]))!
    return [FACE_COLOR[face], FACE_COLOR[opposite]]
  }),
) as Record<Color, Color>

/** The face whose outward normal equals `n`, or undefined if `n` is not a face normal. */
function faceOfNormal(n: Vec3): Face | undefined {
  return FACES.find((f) => vecEqual(FACE_NORMAL[f], n))
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
function outerCoord(n: number, dir: 1 | -1): number {
  const coords = layerCoords(n)
  return (dir > 0 ? coords[coords.length - 1] : coords[0])!
}

/** Index of an axis in a Vec3. */
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

/**
 * Whether a quarter turn about `axis` keeps every piece on the puzzle's grid,
 * even when it pushes some out of the box. The turn swaps the two other axes,
 * so their coordinates must have the same parity: all-even dimensions share
 * one grid (the odd integers), all-odd ones share another (every integer).
 * Otherwise the turn would land a piece between two cells, which is exactly
 * what jams the real puzzle.
 */
export function quarterTurnKeepsGrid(dims: Dims, axis: Axis): boolean {
  const a = AXIS_INDEX[axis]
  return dims[(a + 1) % 3]! % 2 === dims[(a + 2) % 3]! % 2
}

/** Build a solved puzzle: every exterior cubie face carries its solved color. */
export function solvedCube(shape: CubeShape = '3'): Cube {
  const dims = SHAPE_DIMS[shape]
  const cubies: Cubie[] = []
  for (const x of layerCoords(dims[0])) {
    for (const y of layerCoords(dims[1])) {
      for (const z of layerCoords(dims[2])) {
        const position: Vec3 = [x, y, z]
        const stickers: Sticker[] = []
        for (const face of FACES) {
          const spec = FACE_SPEC[face]
          // The cubie has an exterior face along that normal when it sits on
          // the outermost layer of the axis, on the face's side. A one-layer
          // axis is outermost on both sides, so its cubies are stickered twice.
          const outer = outerCoord(dims[spec.coordIndex], spec.dir)
          if (position[spec.coordIndex] === outer) {
            stickers.push({ normal: FACE_NORMAL[face], color: FACE_COLOR[face] })
          }
        }
        cubies.push({ position, stickers })
      }
    }
  }
  return cubies
}

/** Cubie count of each shape, the signature `cubeShape` recognizes. */
const SHAPE_OF_COUNT = new Map<number, CubeShape>(
  (Object.keys(SHAPE_DIMS) as CubeShape[]).map((shape) => [
    SHAPE_DIMS[shape].reduce((n, d) => n * d, 1),
    shape,
  ]),
)

/** Shape of a puzzle from its cubie count (6 -> 1x2x3, 8 -> 2x2, 27 -> 3x3...). */
export function cubeShape(cube: Cube): CubeShape {
  const shape = SHAPE_OF_COUNT.get(cube.length)
  if (!shape) throw new Error(`cubeShape: malformed cube with ${cube.length} cubies`)
  return shape
}

/** Layer counts of a puzzle. */
export function cubeDims(cube: Cube): Dims {
  return SHAPE_DIMS[cubeShape(cube)]
}

/** Facelets on one face: the product of the two dimensions it spans. */
function faceletCount(dims: Dims, face: Face): number {
  const a = FACE_SPEC[face].coordIndex
  return dims[(a + 1) % 3]! * dims[(a + 2) % 3]!
}

/** Face wearing each solved color, the inverse of FACE_COLOR. */
const COLOR_FACE = Object.fromEntries(FACES.map((f) => [FACE_COLOR[f], f])) as Record<Color, Face>

/** Stickers of one color on a solved puzzle: the facelets of its own face. */
export function stickersOfColor(shape: CubeShape, color: Color): number {
  return faceletCount(SHAPE_DIMS[shape], COLOR_FACE[color])
}

/** Total sticker count of a shape (its six faces). */
export function stickersTotal(shape: CubeShape): number {
  const dims = SHAPE_DIMS[shape]
  return FACES.reduce((total, face) => total + faceletCount(dims, face), 0)
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

/** Apply `axis`-rotation `times` quarter turns (positive = right-hand rule). */
function rotateN(v: Vec3, axis: Axis, times: number): Vec3 {
  let out = v
  const t = ((times % 4) + 4) % 4
  for (let i = 0; i < t; i++) out = rotate90(out, axis)
  return out
}

/**
 * Each face turn selects one or two layers (cubies with a fixed coordinate)
 * and rotates them. `sign` is the number of right-hand-rule quarter turns for
 * ONE clockwise (as seen from outside the face) turn of that face.
 */
interface FaceSpec {
  axis: Axis
  /** Index into a Vec3 for the selecting coordinate (0=x, 1=y, 2=z). */
  coordIndex: 0 | 1 | 2
  /** Sign of the face along its axis (+1 or -1). */
  dir: 1 | -1
  /** Right-hand quarter turns for one clockwise face turn. */
  sign: 1 | -1
}

const FACE_SPEC: Record<Face, FaceSpec> = {
  // Clockwise-from-outside maps to a -90 turn for the +axis faces (U,R,F) and
  // +90 for the -axis faces (D,L,B), because viewing from the opposite side
  // flips the apparent handedness.
  U: { axis: 'y', coordIndex: 1, dir: 1, sign: -1 },
  D: { axis: 'y', coordIndex: 1, dir: -1, sign: 1 },
  R: { axis: 'x', coordIndex: 0, dir: 1, sign: -1 },
  L: { axis: 'x', coordIndex: 0, dir: -1, sign: 1 },
  F: { axis: 'z', coordIndex: 2, dir: 1, sign: -1 },
  B: { axis: 'z', coordIndex: 2, dir: -1, sign: 1 },
}

/**
 * The slab `move` turns, as the open interval between the cut planes bounding
 * it along the move's axis. A cut sits halfway between two layers, so a piece
 * is inside when `lo < coord < hi`, and no piece ever sits on a cut.
 *
 * Naming a slab by its cuts rather than by layer coordinates is what keeps
 * this right on a shape that shifts: a piece pushed out of the box stays on
 * the same side of the same cut, so its face still carries it along.
 *
 * Single source of the layer predicate, shared by applyMove and the renderer.
 */
export function moveLayerRange(move: Move, dims: Dims): { lo: number; hi: number } {
  const spec = FACE_SPEC[move.face]
  const coords = layerCoords(dims[spec.coordIndex])
  const outermost = spec.dir > 0 ? coords.length - 1 : 0
  /** Cut between layer `i` and layer `i + 1`, counted from the face inwards. */
  const cut = (i: number): number => {
    const a = coords[outermost - spec.dir * i]
    const b = coords[outermost - spec.dir * (i + 1)]
    if (a === undefined || b === undefined) {
      throw new Error(`moveLayerRange: no layer ${i + 2} in from face ${move.face}`)
    }
    return (a + b) / 2
  }
  const deep = move.depth ?? 1
  const inward = cut(deep - 1)
  const outward = spec.dir > 0 ? { lo: inward, hi: Infinity } : { lo: -Infinity, hi: inward }
  if (deep === 1 || move.wide) return outward
  // A lone inner slice is bounded on its outer side too.
  return spec.dir > 0 ? { lo: inward, hi: cut(deep - 2) } : { lo: cut(deep - 2), hi: inward }
}

/** Whether a coordinate falls inside a slab. */
export function inLayer(coord: number, range: { lo: number; hi: number }): boolean {
  return coord > range.lo && coord < range.hi
}

/** Geometry a renderer needs to animate a move: which layers turn, and how. */
export interface MoveGeometry {
  readonly axis: Axis
  /** Vec3 index selecting the layers (0=x, 1=y, 2=z). */
  readonly coordIndex: 0 | 1 | 2
  /** The turning slab, as the open interval between its cut planes. */
  readonly layers: { lo: number; hi: number }
  /** Visual rotation in radians (right-hand rule), taking the shortest path. */
  readonly angle: number
}

/** Axis, layers and shortest-path angle for animating `move` in 3D. */
export function moveGeometry(move: Move, dims: Dims): MoveGeometry {
  const spec = FACE_SPEC[move.face]
  const t = (((spec.sign * move.amount) % 4) + 4) % 4 // 1, 2 or 3 quarter turns
  const angle = (t === 3 ? -1 : t) * (Math.PI / 2)
  return {
    axis: spec.axis,
    coordIndex: spec.coordIndex,
    layers: moveLayerRange(move, dims),
    angle,
  }
}

/** Apply one move, returning a new cube (the input is left untouched). */
export function applyMove(cube: Cube, move: Move): Cube {
  const spec = FACE_SPEC[move.face]
  const layers = moveLayerRange(move, cubeDims(cube))
  const times = spec.sign * move.amount
  return cube.map((cubie) => {
    if (!inLayer(cubie.position[spec.coordIndex], layers)) return cubie
    return {
      position: rotateN(cubie.position, spec.axis, times),
      stickers: cubie.stickers.map((s) => ({
        normal: rotateN(s.normal, spec.axis, times),
        color: s.color,
      })),
    }
  })
}

/** Apply a sequence of moves left to right. */
export function applyMoves(cube: Cube, moves: readonly Move[]): Cube {
  return moves.reduce(applyMove, cube)
}

/**
 * Reorient the whole cube (every cubie, including centers) by `quarterTurns`
 * about `axis`. Unlike a face turn this is a change of viewpoint, not a move;
 * used to enumerate the 24 orientations (see cubeOrientations).
 */
function rotateCube(cube: Cube, axis: Axis, quarterTurns: number): Cube {
  return cube.map((cubie) => ({
    position: rotateN(cubie.position, axis, quarterTurns),
    stickers: cubie.stickers.map((s) => ({
      normal: rotateN(s.normal, axis, quarterTurns),
      color: s.color,
    })),
  }))
}

/**
 * Whether these cubies show a single color per face. On the whole puzzle this
 * is half of `isSolved`; on a subset it says that subset is solved, which is
 * what a solver phase checks.
 */
export function facesUniform(cubies: readonly Cubie[]): boolean {
  const faceColor = new Map<Face, Color>()
  for (const cubie of cubies) {
    for (const s of cubie.stickers) {
      const face = faceOfNormal(s.normal)
      if (!face) return false
      const seen = faceColor.get(face)
      if (seen === undefined) faceColor.set(face, s.color)
      else if (seen !== s.color) return false
    }
  }
  return true
}

/**
 * Whether every piece is back inside the puzzle's own box. Always true unless
 * the shape shifts: pieces are distinct and exactly fill the box when solved,
 * so "all inside" already means "the box again".
 */
export function isBoxed(cube: Cube): boolean {
  const dims = cubeDims(cube)
  const max = [0, 1, 2].map((a) => outerCoord(dims[a]!, 1))
  return cube.every((c) => c.position.every((v, a) => Math.abs(v) <= max[a]!))
}

/**
 * A puzzle is solved when it is back in its box and each face shows a single
 * uniform color. On a 3x3 the fixed centers make this equivalent to matching
 * FACE_COLOR; without fixed centers (2x2, cuboids) there is no fixed
 * reference, so a solved-but-reoriented puzzle must count as solved.
 */
export function isSolved(cube: Cube): boolean {
  return facesUniform(cube) && isBoxed(cube)
}

/** Index 0..5 of a face normal, for compact hashing and sticker ids. */
export function normalIndex(n: Vec3): number {
  if (n[0] !== 0) return n[0] > 0 ? 0 : 1
  if (n[1] !== 0) return n[1] > 0 ? 2 : 3
  return n[2] > 0 ? 4 : 5
}

/**
 * Compact, allocation-light state signature. Cubies keep a stable array index
 * (applyMove and rotateCube map in place), so encoding each by position + its
 * stickers in order is deterministic. Used to dedupe search states and
 * orientations, so it must be fast.
 */
export function stateKey(cube: Cube): string {
  let out = ''
  for (const c of cube) {
    // One char per position: coordinates live in [-3,3], base-7 digits are
    // injective (offset 256 keeps the char clear of the sticker characters).
    out += String.fromCharCode(
      256 + (c.position[0] + 3) * 49 + (c.position[1] + 3) * 7 + (c.position[2] + 3),
    )
    for (const s of c.stickers) out += normalIndex(s.normal).toString() + s.color
    out += '|'
  }
  return out
}

/**
 * Every whole-puzzle rotation of `cube`, found by closure over the rotations
 * its shape allows: a quarter turn per axis on a cube (24 orientations), only
 * half turns where the shape forbids quarter ones (4 on a 1x2x3). Used by the
 * editor (valid piece placements) and the 2x2 solver (a 2x2 has no centers, so
 * "solved" is any of the 24 orientations of the solved cube).
 */
export function cubeOrientations(cube: Cube): Cube[] {
  const dims = cubeDims(cube)
  const generators = (['x', 'y', 'z'] as Axis[]).map(
    (axis): [Axis, number] => [axis, quarterTurnFits(dims, axis) ? 1 : 2],
  )
  const found = new Map<string, Cube>([[stateKey(cube), cube]])
  let frontier = [cube]
  while (frontier.length) {
    const next: Cube[] = []
    for (const state of frontier) {
      for (const [axis, quarters] of generators) {
        const rotated = rotateCube(state, axis, quarters)
        const key = stateKey(rotated)
        if (!found.has(key)) {
          found.set(key, rotated)
          next.push(rotated)
        }
      }
    }
    frontier = next
  }
  return [...found.values()]
}
