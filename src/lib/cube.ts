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
import { solvedGhost } from './ghost'
import { solvedMorph } from './morph'
import { solvedOct4 } from './oct4'
import { solvedGem, solvedVto } from './vto'
import { solvedRainbow } from './rainbow'
import { solvedViolet, turnAboutA, violetBoxed, violetSolved } from './violet'
import { withGears } from './gear'
import { PYRA_SYMMETRIES, solvedPyra } from './pyraminx'
import { solvedStar, STAR_SYMMETRIES } from './star'
import { ALL_COLORS, isGear, isPyraminx, isStar, SHAPE_DIMS, SHAPE_SHIFTS } from './types'
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

/**
 * A shape's own color scheme, where its real puzzle differs from the
 * standard one: the 2x2x4 tower is sold blue below, yellow behind.
 */
const SHAPE_SCHEME: Partial<Record<CubeShape, Partial<Record<Face, CubeColor>>>> = {
  '224': { D: 'B', B: 'Y' },
}

/** Solved color of each face of a shape (`FACE_COLOR` unless it has its own). */
export function faceColorsOf(shape: CubeShape): Record<Face, CubeColor> {
  return { ...FACE_COLOR, ...SHAPE_SCHEME[shape] }
}

/** Opposite color of each color: the color of the face with the negated normal. */
export const OPPOSITE_COLOR: Record<CubeColor, CubeColor> = Object.fromEntries(
  FACES_BY_NORMAL.map((face) => {
    const [x, y, z] = FACE_NORMAL[face]
    return [FACE_COLOR[face], FACE_COLOR[faceOfNormal([-x, -y, -z])]]
  }),
) as Record<CubeColor, CubeColor>

/** How many stickers of each color. */
export function countColors(colors: Iterable<Color>): Record<Color, number> {
  const counts = Object.fromEntries(ALL_COLORS.map((c) => [c, 0])) as Record<Color, number>
  for (const color of colors) counts[color]++
  return counts
}

// ---------------------------------------------------------------------------
// Puzzles
// ---------------------------------------------------------------------------

/** Build a solved puzzle: every exterior cubie face carries its solved color
 *  (the star prism and the Pyraminx, no grid, come from their own modules). */
export function solvedCube(shape: CubeShape = '3'): Cube {
  if (isStar(shape)) return solvedStar(shape)
  if (isPyraminx(shape)) return solvedPyra(shape)
  if (shape === 'morph') return solvedMorph()
  if (shape === 'oct4') return solvedOct4()
  if (shape === 'vto') return solvedVto()
  if (shape === 'gem') return solvedGem()
  if (shape === 'rainbow') return solvedRainbow()
  if (isGear(shape)) return withGears(solvedCube('3'))
  if (shape === 'violet') return solvedViolet()
  if (shape === 'ghost') return solvedGhost()
  const dims = SHAPE_DIMS[shape]
  const colors = faceColorsOf(shape)
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
            stickers.push({ normal: FACE_NORMAL[face], color: colors[face] })
          }
        }
        cubies.push({ position, stickers })
      }
    }
  }
  return cubies
}

/** Stickers a puzzle wears in all: kept by every turn. Gears count apart
 *  (a Gear Cube has a 3x3's cubies and stickers). */
const stickerCount = (cube: Cube): number =>
  cube.reduce((n, c) => n + c.stickers.length + (c.spin === undefined ? 0 : 1000), 0)

/**
 * The shapes by cubie count, the signature `cubeShape` recognizes: a count
 * alone, or with the sticker count when two shapes share it (the Pyraminx
 * and the Jing, 15 pieces each). Every shape needs its own, which this
 * checks as the module loads.
 */
const SHAPES_OF_COUNT = new Map<number, Map<number, CubeShape>>()
for (const shape of Object.keys(SHAPE_DIMS) as CubeShape[]) {
  const solved = solvedCube(shape)
  const byStickers = SHAPES_OF_COUNT.get(solved.length) ?? new Map<number, CubeShape>()
  const other = byStickers.get(stickerCount(solved))
  if (other) throw new Error(`cubeShape: ${shape} and ${other} have the same pieces and stickers`)
  byStickers.set(stickerCount(solved), shape)
  SHAPES_OF_COUNT.set(solved.length, byStickers)
}

/** Shape of a puzzle from its cubie count (6 -> 1x2x3, 8 -> 2x2, 14 -> star...),
 *  and its sticker count when that is not enough. */
export function cubeShape(cube: Cube): CubeShape {
  const shapes = SHAPES_OF_COUNT.get(cube.length)
  const shape = shapes?.size === 1 ? [...shapes.values()][0] : shapes?.get(stickerCount(cube))
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

/** Stickers of each color on a solved puzzle, by shape (memoized). */
const SOLVED_COUNTS = new Map<CubeShape, Record<Color, number>>()
function solvedCounts(shape: CubeShape): Record<Color, number> {
  let counts = SOLVED_COUNTS.get(shape)
  if (!counts) {
    counts = countColors(solvedCube(shape).flatMap((c) => c.stickers.map((s) => s.color)))
    SOLVED_COUNTS.set(shape, counts)
  }
  return counts
}

/** Stickers of one color on a solved puzzle (a cuboid's faces differ, a
 *  star prism has its own colors). */
export function stickersOfColor(shape: CubeShape, color: Color): number {
  return solvedCounts(shape)[color]
}

/** Total sticker count of a shape. */
export function stickersTotal(shape: CubeShape): number {
  return Object.values(solvedCounts(shape)).reduce((a, b) => a + b, 0)
}

/** The colors a shape wears, in palette order. */
export function shapeColors(shape: CubeShape): Color[] {
  return ALL_COLORS.filter((color) => stickersOfColor(shape, color) > 0)
}

/** Whether the cubies show a single color per face (stickers grouped by the
 *  direction they face: a cube face, or a star prism's valley). */
/** How many faces the cubies show, if each shows a single color (stickers
 *  grouped by the direction they face: a cube face, a star prism's valley),
 *  else -1. */
function uniformFaces(cubies: readonly Cubie[]): number {
  const faceColor = new Map<number, Color>()
  for (const cubie of cubies) {
    for (const s of cubie.stickers) {
      const face = normalIndex(s.normal)
      const seen = faceColor.get(face)
      if (seen === undefined) faceColor.set(face, s.color)
      else if (seen !== s.color) return -1
    }
  }
  return faceColor.size
}

const FACE_COUNTS = new Map<CubeShape, number>()

/** How many faces a shape shows when solved. */
function faceCount(shape: CubeShape): number {
  let count = FACE_COUNTS.get(shape)
  if (count === undefined) {
    count = uniformFaces(solvedCube(shape))
    FACE_COUNTS.set(shape, count)
  }
  return count
}

/**
 * Whether every piece is back inside the puzzle's own box. Always true unless
 * the shape shifts: pieces are distinct and exactly fill the box when solved,
 * so "all inside" already means "the box again".
 */
export function isBoxed(cube: Cube): boolean {
  // The Violet's box is off its core, which its coordinates are about.
  if (cubeShape(cube) === 'violet') return violetBoxed(cube)
  const dims = cubeDims(cube)
  const max = [0, 1, 2].map((a) => outerCoord(dims[a]!, 1))
  return cube.every((c) => c.position.every((v, a) => Math.abs(v) <= max[a]!))
}

/**
 * A puzzle is solved when it is back in its box and each face shows a single
 * uniform color, on as many faces as it has. On a 3x3 the fixed centers make
 * this equivalent to matching FACE_COLOR; without fixed centers (2x2,
 * cuboids) there is no fixed reference, so a solved-but-reoriented puzzle
 * must count as solved. The face count tells a Pyramorphinx half turned a
 * quarter (each half uniform, but on two tetrahedra: eight faces) from one
 * in its form. The Violet has its own test (violet.ts): violet all over
 * but A, so its faces are not one color each.
 */
export function isSolved(cube: Cube): boolean {
  // A Gear Cube's gears must be home too, which its stickers do not say.
  if (cube.some((c) => c.spin)) return false
  if (cubeShape(cube) === 'violet') return violetSolved(cube)
  return isBoxed(cube) && uniformFaces(cube) === faceCount(cubeShape(cube))
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
    // One char per position: coordinates live in [-4,4] (the Professor
    // Pyraminx's reach), base-9 digits are injective (offset 256 keeps the
    // char clear of the sticker characters).
    out += String.fromCharCode(
      256 + (c.position[0] + 4) * 81 + (c.position[1] + 4) * 9 + (c.position[2] + 4),
    )
    for (const s of c.stickers) out += normalIndex(s.normal).toString(36) + s.color
    if (c.spin !== undefined) out += '@' + c.spin
    out += '|'
  }
  return out
}

/** Reorient the whole puzzle: a change of viewpoint, not a move. */
function rotateCube(cube: Cube, axis: Axis, quarterTurns: number): Cube {
  return cube.map((cubie) => ({
    ...cubie,
    position: rotateN(cubie.position, axis, quarterTurns),
    stickers: cubie.stickers.map((s) => ({
      normal: rotateN(s.normal, axis, quarterTurns),
      color: s.color,
    })),
  }))
}

/**
 * Every whole-puzzle rotation of `cube`, found by closure over the rotations
 * its shape allows. On a cuboid, a quarter turn per axis (24 orientations of
 * a cube), or a half turn where the shape forbids quarter ones (4 on a
 * 1x2x3, 8 on the tower and the Domino). On a star prism, its own
 * symmetries (12, see `STAR_SYMMETRIES`), and so on the Pyraminx (12,
 * `PYRA_SYMMETRIES`); the Floppy Ghost has none but itself. Used by the editor (valid piece
 * placements) and the 2x2 solver (a 2x2 has no centers, so "solved" is any
 * orientation of the solved cube).
 */
export function cubeOrientations(cube: Cube): Cube[] {
  const dims = cubeDims(cube)
  const shape = cubeShape(cube)
  const generators = isStar(shape)
    ? STAR_SYMMETRIES
    : isPyraminx(shape)
      ? PYRA_SYMMETRIES
      : shape === 'ghost'
        ? [] // held one way only: no turn of it keeps its square
        : shape === 'violet'
          ? [turnAboutA] // only about its diagonal through A
          : (['x', 'y', 'z'] as Axis[]).map(
              (axis) => (c: Cube) => rotateCube(c, axis, quarterTurnFits(dims, axis) ? 1 : 2),
            )
  const found = new Map<string, Cube>([[stateKey(cube), cube]])
  let frontier = [cube]
  while (frontier.length) {
    const next: Cube[] = []
    for (const state of frontier) {
      for (const turn of generators) {
        const rotated = turn(state)
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
