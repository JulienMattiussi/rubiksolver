// Domain types for the cube engine. Pure data, zero React / three.js.

/** Number of layers along x, y and z. Everything geometric derives from it. */
export type Dims = readonly [number, number, number]

/** The puzzles the app can build, by id (also the picker's option values). */
export type CubeShape = '2' | '3' | '4' | '123' | '224'

/**
 * Layer counts per shape: the NxNxN cubes, the 1x2x3 flat cuboid (3 wide, 2
 * tall, 1 thick, so the rectangle you face is its 3x2 side) and the 2x2x4
 * tower (4 layers on a square 2x2 section).
 *
 * A one-layer axis has no move of its own: turning its only layer just turns
 * the whole puzzle. Which turns exist beyond that comes from the grids these
 * counts define, see `cube.ts`.
 */
export const SHAPE_DIMS: Record<CubeShape, Dims> = {
  '2': [2, 2, 2],
  '3': [3, 3, 3],
  '4': [4, 4, 4],
  '123': [3, 2, 1],
  '224': [2, 4, 2],
}

/**
 * Shapes whose mechanism also allows the quarter turns that push pieces out of
 * the box, leaving it in a shape that is no longer a cuboid. A property of the
 * real puzzle's core, not of its dimensions: a 1x3x3 Floppy forbids them where
 * its Super Floppy cousin allows them. The grid still has to survive the turn,
 * which `quarterTurnKeepsGrid` checks.
 */
export const SHAPE_SHIFTS: Record<CubeShape, boolean> = {
  '2': false,
  '3': false,
  '4': false,
  '123': false,
  '224': true,
}

/** Name of each shape in the picker (identical in every language). */
export const SHAPE_LABEL: Record<CubeShape, string> = {
  '2': '2x2',
  '3': '3x3',
  '4': '4x4',
  '123': '1x2x3',
  '224': '2x2x4',
}

/** Shapes exposed in the UI, in display order. */
const SHAPES = Object.keys(SHAPE_DIMS) as readonly CubeShape[]

/**
 * How a cube is rendered. Purely visual: the engine, the solvers and the
 * editor never look at it. `mirror` is the shape mod (Mirror Blocks): every
 * facelet is the same color and the layers have different thicknesses, so the
 * pieces are told apart by their size (see `lib/shape.ts`).
 */
export type CubeVariant = 'classic' | 'mirror'

/**
 * A mirror cube needs one thickness per face, which a one-layer axis cannot
 * have: its two opposite stickers sit on the same piece, so its faces carry no
 * shape at all. Only shapes with at least two layers everywhere are mirrored.
 */
export function supportsMirror(shape: CubeShape): boolean {
  return SHAPE_DIMS[shape].every((n) => n >= 2)
}

/** One entry of the cube picker: a shape plus a rendering variant. */
interface CubeKind {
  readonly shape: CubeShape
  readonly variant: CubeVariant
}

/** Cube choices exposed in the UI, in display order (classics, then mirrors). */
export const CUBE_KINDS: readonly CubeKind[] = [
  ...SHAPES.map((shape): CubeKind => ({ shape, variant: 'classic' })),
  ...SHAPES.filter(supportsMirror).map((shape): CubeKind => ({ shape, variant: 'mirror' })),
]

/** Stable id of a cube choice, used as the picker's option value. */
export function cubeKindId({ shape, variant }: CubeKind): string {
  return variant === 'mirror' ? `${shape}m` : shape
}

/** A face of the cube, named with the standard Singmaster letters. */
export type Face = 'U' | 'D' | 'L' | 'R' | 'F' | 'B'

/** Sticker colors. Kept distinct from Face letters (a sticker's color is not
 *  the same concept as the face it currently sits on). */
export type Color = 'W' | 'Y' | 'G' | 'B' | 'O' | 'R'

/** Integer coordinate axis. */
export type Axis = 'x' | 'y' | 'z'

/** Integer 3D vector. Sticker normals are unit axis vectors; cubie positions
 *  live on the integer grid of their dimensions (`layerCoords` in cube.ts). */
export type Vec3 = readonly [number, number, number]

/** One colored sticker on a cubie face, identified by its outward normal. */
export interface Sticker {
  /** Outward normal of the face this sticker sits on (unit axis vector). */
  readonly normal: Vec3
  readonly color: Color
}

/** A single small cube (cubie), at an integer grid position. */
export interface Cubie {
  readonly position: Vec3
  readonly stickers: readonly Sticker[]
}

/**
 * The whole puzzle: 27 cubies for a 3x3 (26 visible + 1 hidden core), the 8
 * corner cubies (positions in {-1,1}^3) for a 2x2, 64 cubies (8 hidden inner
 * ones) for a 4x4, or the 6 pieces of a 1x2x3. The cubie count identifies the
 * shape (see `cubeShape`).
 */
export type Cube = readonly Cubie[]

/**
 * A quarter-or-half turn of one or two layers, e.g. `U`, `R'`, `F2`, `2R`, `Rw`.
 * `amount` is the number of clockwise quarter turns (1, 2, or 3 = counter-clockwise).
 *
 * Moves have a single canonical shape so structural comparison works:
 * - `{ face, amount }`: outer face turn (the only shape 2x2/3x3 code emits);
 * - `{ face, amount, depth: 2 }`: inner slice, second layer in from the face
 *   (SiGN notation `2R`); only meaningful on cubes with inner layers (4x4);
 * - `{ face, amount, depth: 2, wide: true }`: wide turn, outer + inner layers
 *   together (`Rw`). `wide` never appears without `depth`, and `depth: 1` /
 *   `wide: false` are never used.
 */
export interface Move {
  readonly face: Face
  readonly amount: 1 | 2 | 3
  /** Inner layer selector: 2 = second layer in from `face`. Absent = outer. */
  readonly depth?: 2
  /** Wide turn: layers 1..depth turn together. Requires `depth`. */
  readonly wide?: true
}
