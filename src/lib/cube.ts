import {
  FACE_NORMAL,
  FACE_SPEC,
  FACES_BY_NORMAL,
  faceOfNormal,
  layerCoords,
  normalIndex,
  outerCoord,
  quarterTurnFits,
  rotateN,
} from './geometry'
import { solvedStar } from './star'
import { COLORS, isStar, SHAPE_DIMS, SHAPE_SHIFTS } from './types'
import type {
  Axis,
  Color,
  Cube,
  CubeColor,
  CubeShape,
  Cubie,
  Dims,
  Face,
  Sticker,
  Vec3,
} from './types'

/**
 * The puzzle as cubies at integer positions: {-1,0,1}^3 for a 3x3, {-1,1}^3
 * for a 2x2 (it simply skips coordinate 0), {-3,-1,1,3}^3 for a 4x4 (layers
 * two units apart, so they stay integers). Nothing here assumes a cube: a
 * shape is just three layer counts (SHAPE_DIMS), one grid per axis.
 *
 * This module builds and inspects puzzles (solved state, shape, solved-ness,
 * orientations); geometry.ts holds the integer geometry, turn.ts the turns.
 * All queries (isSolved, the solvers) read this model; the 3D view derives
 * its geometry from it.
 */

/** Solved color of each face (standard Western scheme: white up, green front). */
export const FACE_COLOR: Record<Face, CubeColor> = {
  U: 'W',
  D: 'Y',
  F: 'G',
  B: 'B',
  R: 'R',
  L: 'O',
}

/** Opposite color of each color: the color of the face with the negated normal. */
export const OPPOSITE_COLOR: Record<CubeColor, CubeColor> = Object.fromEntries(
  FACES_BY_NORMAL.map((face) => {
    const [x, y, z] = FACE_NORMAL[face]
    return [FACE_COLOR[face], FACE_COLOR[faceOfNormal([-x, -y, -z])]]
  }),
) as Record<CubeColor, CubeColor>

// ---------------------------------------------------------------------------
// Piece queries
// ---------------------------------------------------------------------------

/** Color of the sticker on `cubie` facing `face`, if any. */
export function colorAt(cubie: Cubie, face: Face): Color | undefined {
  return cubie.stickers.find((s) => faceOfNormal(s.normal) === face)?.color
}

/** A piece's colors, sorted: the same wherever it sits, and for twin pieces. */
export function colorsOf(cubie: Cubie): string {
  return cubie.stickers
    .map((s) => s.color)
    .sort()
    .join('')
}

/** How many stickers of each color. */
export function countColors(colors: Iterable<Color>): Record<Color, number> {
  const counts = Object.fromEntries(COLORS.map((c) => [c, 0])) as Record<Color, number>
  for (const color of colors) counts[color]++
  return counts
}

/** Whether a piece carries exactly these colors. */
export function hasColors(cubie: Cubie, colors: readonly Color[]): boolean {
  return colorsOf(cubie) === [...colors].sort().join('')
}

/** The cubie at `position` among `cubies`, if any. */
export function cubieAt(cubies: readonly Cubie[], [x, y, z]: Vec3): Cubie | undefined {
  return cubies.find((c) => c.position[0] === x && c.position[1] === y && c.position[2] === z)
}

const SLOTS = new Map<CubeShape, ReadonlyMap<string, number>>()

/**
 * Whether a piece is home: in a slot of its boxed puzzle (the right number of
 * stickers there), every sticker showing the color of the face it points to.
 * Colors, not identities: either of two twin pieces is right in either spot,
 * and a piece showing all its faces' colors can only be the one belonging there.
 */
export function atHome(cubie: Cubie, shape: CubeShape): boolean {
  let slots = SLOTS.get(shape)
  if (!slots) {
    slots = new Map(solvedCube(shape).map((c) => [c.position.join(','), c.stickers.length]))
    SLOTS.set(shape, slots)
  }
  return (
    slots.get(cubie.position.join(',')) === cubie.stickers.length &&
    cubie.stickers.every((s) => s.color === FACE_COLOR[faceOfNormal(s.normal)])
  )
}

/** Whether every piece belonging at `positions` is home, among `cubies` (the
 *  whole puzzle, or the few pieces a search tracks). */
export function homeAt(cubies: readonly Cubie[], positions: readonly Vec3[], shape: CubeShape) {
  return positions.every((p) => {
    const cubie = cubieAt(cubies, p)
    return cubie !== undefined && atHome(cubie, shape)
  })
}

/** Home positions of the pieces of a solved `shape` that `keep` selects. */
export function homesOf(shape: CubeShape, keep: (c: Cubie) => boolean): Vec3[] {
  return solvedCube(shape)
    .filter(keep)
    .map((c) => c.position)
}

// ---------------------------------------------------------------------------
// Puzzles
// ---------------------------------------------------------------------------

/** Build a solved puzzle: every exterior cubie face carries its solved color
 *  (the star prism, no grid, comes from star.ts). */
export function solvedCube(shape: CubeShape = '3'): Cube {
  if (isStar(shape)) return solvedStar()
  const dims = SHAPE_DIMS[shape]
  const cubies: Cubie[] = []
  for (const x of layerCoords(dims[0])) {
    for (const y of layerCoords(dims[1])) {
      for (const z of layerCoords(dims[2])) {
        const position: Vec3 = [x, y, z]
        const stickers: Sticker[] = []
        for (const face of FACES_BY_NORMAL) {
          const spec = FACE_SPEC[face]
          // The cubie has an exterior face along that normal when it sits on
          // the outermost layer of the axis, on the face's side. A one-layer
          // axis is outermost on both sides, so its cubies are stickered twice.
          if (position[spec.coordIndex] === outerCoord(dims[spec.coordIndex], spec.dir)) {
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
  (Object.keys(SHAPE_DIMS) as CubeShape[]).map((shape) => [solvedCube(shape).length, shape]),
)

/** Shape of a puzzle from its cubie count (6 -> 1x2x3, 8 -> 2x2, 14 -> star...). */
export function cubeShape(cube: Cube): CubeShape {
  const shape = SHAPE_OF_COUNT.get(cube.length)
  if (!shape) throw new Error(`cubeShape: malformed cube with ${cube.length} cubies`)
  return shape
}

/** Layer counts of a puzzle. */
export function cubeDims(cube: Cube): Dims {
  return SHAPE_DIMS[cubeShape(cube)]
}

/**
 * Layer counts of the mechanism a shape's turns act on. The puzzle itself on
 * every shape, except one that shifts (SHAPE_SHIFTS): that one is a cube of its
 * longest side with pieces missing, and turns like it. The 2x2x4 tower turns
 * like a 4x4x4, whose grid ({-3,-1,1,3}) holds the tower's own coordinates.
 */
export function turnDims(shape: CubeShape): Dims {
  const dims = SHAPE_DIMS[shape]
  if (!SHAPE_SHIFTS[shape]) return dims
  const n = Math.max(...dims)
  return [n, n, n]
}

/** Facelets on one face: the product of the two dimensions it spans. */
function faceletCount(dims: Dims, face: Face): number {
  const a = FACE_SPEC[face].coordIndex
  return dims[(a + 1) % 3]! * dims[(a + 2) % 3]!
}

/** Face wearing each solved color, the inverse of FACE_COLOR. */
const COLOR_FACE = Object.fromEntries(FACES_BY_NORMAL.map((f) => [FACE_COLOR[f], f])) as Record<
  Color,
  Face
>

/** Stickers of one color on a solved puzzle: the facelets of its own face. */
export function stickersOfColor(shape: CubeShape, color: Color): number {
  return faceletCount(SHAPE_DIMS[shape], COLOR_FACE[color])
}

/** Total sticker count of a shape (its six faces). */
export function stickersTotal(shape: CubeShape): number {
  const dims = SHAPE_DIMS[shape]
  return FACES_BY_NORMAL.reduce((total, face) => total + faceletCount(dims, face), 0)
}

/** Whether the cubies show a single color per face (stickers grouped by the
 *  direction they face: a cube face, or a star prism's valley). */
function facesUniform(cubies: readonly Cubie[]): boolean {
  const faceColor = new Map<number, Color>()
  for (const cubie of cubies) {
    for (const s of cubie.stickers) {
      const face = normalIndex(s.normal)
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

/**
 * Compact, allocation-light state signature. Cubies keep a stable array index
 * (turns and rotations map in place), so encoding each by position + its
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
    for (const s of c.stickers) out += normalIndex(s.normal).toString(36) + s.color
    out += '|'
  }
  return out
}

/** Reorient the whole puzzle: a change of viewpoint, not a move. */
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
 * Every whole-puzzle rotation of `cube`, found by closure over the rotations
 * its shape allows: a quarter turn per axis on a cube (24 orientations), only
 * half turns where the shape forbids quarter ones (4 on a 1x2x3, 8 on the
 * tower and the Domino). Used by the editor (valid piece placements) and the
 * 2x2 solver (a 2x2 has no centers, so "solved" is any orientation of the
 * solved cube).
 */
export function cubeOrientations(cube: Cube): Cube[] {
  const dims = cubeDims(cube)
  const generators = (['x', 'y', 'z'] as Axis[]).map((axis): [Axis, number] => [
    axis,
    quarterTurnFits(dims, axis) ? 1 : 2,
  ])
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
