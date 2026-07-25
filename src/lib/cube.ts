import type { Axis, Color, Cube, CubeSize, Cubie, Face, Move, Sticker, Vec3 } from './types'

/**
 * Cube model as cubies at integer positions in {-1,0,1}^3 (a 2x2 simply skips
 * coordinate 0, so its 8 corners live in {-1,1}^3 and every face layer still
 * sits at +1 or -1). Axes: x = right, y = up, z = towards the viewer (front).
 *
 * A move rotates a layer of cubies by an exact 90 degree integer rotation, so
 * positions and normals stay in {-1,0,1}: no floating point drift ever enters
 * the logical state. All queries (isSolved, the solver) read this model; the
 * 3D view derives its geometry from it.
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

/** The face whose outward normal equals `n`, or undefined if `n` is not a face normal. */
function faceOfNormal(n: Vec3): Face | undefined {
  return FACES.find((f) => vecEqual(FACE_NORMAL[f], n))
}

/** Build a solved cube: every exterior cubie face carries its solved color. */
export function solvedCube(size: CubeSize = 3): Cube {
  const coords = size === 2 ? [-1, 1] : [-1, 0, 1]
  const cubies: Cubie[] = []
  for (const x of coords) {
    for (const y of coords) {
      for (const z of coords) {
        const position: Vec3 = [x, y, z]
        const stickers: Sticker[] = []
        for (const face of FACES) {
          const n = FACE_NORMAL[face]
          // The cubie has an exterior face along `n` when its coordinate on
          // that axis matches the normal's non-zero component.
          const onFace =
            (n[0] !== 0 && n[0] === x) || (n[1] !== 0 && n[1] === y) || (n[2] !== 0 && n[2] === z)
          if (onFace) stickers.push({ normal: n, color: FACE_COLOR[face] })
        }
        cubies.push({ position, stickers })
      }
    }
  }
  return cubies
}

/** Size of a cube from its cubie count (8 -> 2x2, 27 -> 3x3). */
export function cubeSize(cube: Cube): CubeSize {
  return cube.length === 8 ? 2 : 3
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
 * Each face turn selects a layer (cubies with a fixed coordinate) and rotates
 * it. `sign` is the number of right-hand-rule quarter turns for ONE clockwise
 * (as seen from outside the face) turn of that face.
 */
interface FaceSpec {
  axis: Axis
  /** Index into a Vec3 for the selecting coordinate (0=x, 1=y, 2=z). */
  coordIndex: 0 | 1 | 2
  /** Coordinate value of the layer (+1 or -1). */
  layer: 1 | -1
  /** Right-hand quarter turns for one clockwise face turn. */
  sign: 1 | -1
}

const FACE_SPEC: Record<Face, FaceSpec> = {
  // Clockwise-from-outside maps to a -90 turn for the +axis faces (U,R,F) and
  // +90 for the -axis faces (D,L,B), because viewing from the opposite side
  // flips the apparent handedness.
  U: { axis: 'y', coordIndex: 1, layer: 1, sign: -1 },
  D: { axis: 'y', coordIndex: 1, layer: -1, sign: 1 },
  R: { axis: 'x', coordIndex: 0, layer: 1, sign: -1 },
  L: { axis: 'x', coordIndex: 0, layer: -1, sign: 1 },
  F: { axis: 'z', coordIndex: 2, layer: 1, sign: -1 },
  B: { axis: 'z', coordIndex: 2, layer: -1, sign: 1 },
}

/** Geometry a renderer needs to animate a move: which layer turns, and how. */
export interface MoveGeometry {
  readonly axis: Axis
  /** Vec3 index selecting the layer (0=x, 1=y, 2=z). */
  readonly coordIndex: 0 | 1 | 2
  /** Coordinate value of the turning layer (+1 or -1). */
  readonly layer: 1 | -1
  /** Visual rotation in radians (right-hand rule), taking the shortest path. */
  readonly angle: number
}

/** Axis, layer and shortest-path angle for animating `move` in 3D. */
export function moveGeometry(move: Move): MoveGeometry {
  const spec = FACE_SPEC[move.face]
  const t = (((spec.sign * move.amount) % 4) + 4) % 4 // 1, 2 or 3 quarter turns
  const angle = (t === 3 ? -1 : t) * (Math.PI / 2)
  return { axis: spec.axis, coordIndex: spec.coordIndex, layer: spec.layer, angle }
}

/** Apply one move, returning a new cube (the input is left untouched). */
export function applyMove(cube: Cube, move: Move): Cube {
  const spec = FACE_SPEC[move.face]
  const times = spec.sign * move.amount
  return cube.map((cubie) => {
    if (cubie.position[spec.coordIndex] !== spec.layer) return cubie
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

function orientationKey(cube: Cube): string {
  return cube
    .map(
      (c) =>
        c.position.join(',') + ':' + c.stickers.map((s) => s.normal.join(',') + s.color).join(';'),
    )
    .sort()
    .join('|')
}

/**
 * The 24 whole-cube rotations of `cube`, found by closure under x/y turns.
 * Used by the editor (valid piece placements) and the 2x2 solver (a 2x2 has no
 * centers, so "solved" is any of the 24 orientations of the solved cube).
 */
export function cubeOrientations(cube: Cube): Cube[] {
  const found = new Map<string, Cube>([[orientationKey(cube), cube]])
  let frontier = [cube]
  while (frontier.length) {
    const next: Cube[] = []
    for (const state of frontier) {
      for (const axis of ['x', 'y'] as Axis[]) {
        const rotated = rotateCube(state, axis, 1)
        const key = orientationKey(rotated)
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
