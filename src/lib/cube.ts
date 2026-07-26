import type { Axis, Color, Cube, CubeSize, Cubie, Face, Move, Sticker, Vec3 } from './types'

/**
 * Cube model as cubies at integer positions: {-1,0,1}^3 for a 3x3, {-1,1}^3
 * for a 2x2 (it simply skips coordinate 0), {-3,-1,1,3}^3 for a 4x4 (layers
 * two units apart, so they stay integers). Axes: x = right, y = up,
 * z = towards the viewer (front).
 *
 * A move rotates one or two layers of cubies by an exact 90 degree integer
 * rotation, so positions and normals never drift: no floating point ever
 * enters the logical state. All queries (isSolved, the solver) read this
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

/** Cubie grid coordinates along one axis, per size. */
function layerCoords(size: CubeSize): readonly number[] {
  if (size === 2) return [-1, 1]
  if (size === 3) return [-1, 0, 1]
  return [-3, -1, 1, 3]
}

/** Coordinate magnitude of an outer layer: 1 for 2x2/3x3, 3 for 4x4. */
function outerCoord(size: CubeSize): number {
  return size === 4 ? 3 : 1
}

/** Build a solved cube: every exterior cubie face carries its solved color. */
export function solvedCube(size: CubeSize = 3): Cube {
  const coords = layerCoords(size)
  const outer = outerCoord(size)
  const cubies: Cubie[] = []
  for (const x of coords) {
    for (const y of coords) {
      for (const z of coords) {
        const position: Vec3 = [x, y, z]
        const stickers: Sticker[] = []
        for (const face of FACES) {
          const n = FACE_NORMAL[face]
          // The cubie has an exterior face along `n` when its coordinate on
          // that axis sits on the outer layer matching the normal's sign.
          const onFace =
            (n[0] !== 0 && n[0] * outer === x) ||
            (n[1] !== 0 && n[1] * outer === y) ||
            (n[2] !== 0 && n[2] * outer === z)
          if (onFace) stickers.push({ normal: n, color: FACE_COLOR[face] })
        }
        cubies.push({ position, stickers })
      }
    }
  }
  return cubies
}

/** Size of a cube from its cubie count (8 -> 2x2, 27 -> 3x3, 64 -> 4x4). */
export function cubeSize(cube: Cube): CubeSize {
  if (cube.length === 8) return 2
  if (cube.length === 27) return 3
  if (cube.length === 64) return 4
  throw new Error(`cubeSize: malformed cube with ${cube.length} cubies`)
}

/** Stickers of each color on a cube of `size`: one face of facelets (size^2). */
export function stickersPerColor(size: CubeSize): number {
  return size * size
}

/** Total sticker count of a cube of `size` (6 faces). */
export function stickersTotal(size: CubeSize): number {
  return 6 * stickersPerColor(size)
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
 * Signed coordinates (along the move's axis) of the layer(s) `move` turns on
 * a cube of `size`. Single source of the layer predicate, shared by applyMove
 * and the renderer.
 */
export function moveLayerCoords(move: Move, size: CubeSize): readonly number[] {
  const dir = FACE_SPEC[move.face].dir
  const outer = dir * outerCoord(size)
  if (!move.depth) return [outer]
  if (size < 4) throw new Error(`moveLayerCoords: inner-layer move on a ${size}x${size}`)
  const inner = outer - dir * 2
  return move.wide ? [outer, inner] : [inner]
}

/** Geometry a renderer needs to animate a move: which layers turn, and how. */
export interface MoveGeometry {
  readonly axis: Axis
  /** Vec3 index selecting the layers (0=x, 1=y, 2=z). */
  readonly coordIndex: 0 | 1 | 2
  /** Coordinate values of the turning layers along the axis. */
  readonly layers: readonly number[]
  /** Visual rotation in radians (right-hand rule), taking the shortest path. */
  readonly angle: number
}

/** Axis, layers and shortest-path angle for animating `move` in 3D. */
export function moveGeometry(move: Move, size: CubeSize): MoveGeometry {
  const spec = FACE_SPEC[move.face]
  const t = (((spec.sign * move.amount) % 4) + 4) % 4 // 1, 2 or 3 quarter turns
  const angle = (t === 3 ? -1 : t) * (Math.PI / 2)
  return {
    axis: spec.axis,
    coordIndex: spec.coordIndex,
    layers: moveLayerCoords(move, size),
    angle,
  }
}

/** Apply one move, returning a new cube (the input is left untouched). */
export function applyMove(cube: Cube, move: Move): Cube {
  const spec = FACE_SPEC[move.face]
  const layers = moveLayerCoords(move, cubeSize(cube))
  const times = spec.sign * move.amount
  return cube.map((cubie) => {
    if (!layers.includes(cubie.position[spec.coordIndex])) return cubie
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
 * A cube is solved when each face shows a single uniform color. On a 3x3 the
 * fixed centers make this equivalent to matching FACE_COLOR; on a 2x2 there is
 * no fixed reference, so a solved-but-reoriented cube must count as solved.
 */
export function isSolved(cube: Cube): boolean {
  const faceColor = new Map<Face, Color>()
  for (const cubie of cube) {
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
 * The 24 whole-cube rotations of `cube`, found by closure under x/y turns.
 * Used by the editor (valid piece placements) and the 2x2 solver (a 2x2 has no
 * centers, so "solved" is any of the 24 orientations of the solved cube).
 */
export function cubeOrientations(cube: Cube): Cube[] {
  const found = new Map<string, Cube>([[stateKey(cube), cube]])
  let frontier = [cube]
  while (frontier.length) {
    const next: Cube[] = []
    for (const state of frontier) {
      for (const axis of ['x', 'y'] as Axis[]) {
        const rotated = rotateCube(state, axis, 1)
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
