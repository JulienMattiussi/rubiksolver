// Domain types for the cube engine. Pure data, zero React / three.js.

/** Number of layers along x, y and z. Everything geometric derives from it. */
export type Dims = readonly [number, number, number]

/** The puzzles the app can build, by id (also the picker's option values). */
export type CubeShape = '2' | '3' | '4' | '123' | '224' | '223' | '332' | '331' | 'star' | 'star4'

/**
 * Layer counts per shape: the NxNxN cubes, the 1x2x3 flat cuboid (3 wide, 2
 * tall, 1 thick, so the rectangle you face is its 3x2 side), the 2x2x4
 * tower (4 layers on a square 2x2 section), its slim 2x2x3 cousin, the Domino (a 3x3 two layers
 * tall: U and D turn freely, its sides only take half turns) and the Floppy
 * (a 3x3 one layer tall: half turns of its sides only).
 *
 * A one-layer axis has no move of its own: turning its only layer just turns
 * the whole puzzle. Which turns exist beyond that follows from these counts,
 * see `movesFor` in moves.ts.
 */
export const SHAPE_DIMS: Record<CubeShape, Dims> = {
  '2': [2, 2, 2],
  '3': [3, 3, 3],
  '4': [4, 4, 4],
  '123': [3, 2, 1],
  '224': [2, 4, 2],
  '223': [2, 3, 2],
  '332': [3, 2, 3],
  '331': [3, 1, 3],
  // The star prisms (star.ts) are no grid: their own module builds and turns
  // them. These only bound their hexagonal model (q and r within +-1, the
  // layers at y = +-1 and +-2).
  star: [3, 4, 3],
  star4: [3, 4, 3],
}

/** The star prisms: 2 or 4 layers. */
export type StarShape = 'star' | 'star4'

/** Whether a shape is a star prism, which turns by rings and slash (star.ts)
 *  rather than by face layers. */
export const isStar = (shape: CubeShape): shape is StarShape =>
  shape === 'star' || shape === 'star4'

/**
 * Shapes that leave their box: their mechanism is a bigger cube with pieces
 * missing, so they turn like that cube and come out bumpy. The 2x2x4 tower
 * turns like a 4x4x4 (`turnDims`): its wide turns (Rw: half the puzzle) always
 * go, an outer turn (R) only when its end is a complete layer (`turnAllowed`).
 * A property of the real puzzle's core, not of its dimensions: a 1x3x3 Floppy
 * forbids such turns where its Super Floppy cousin allows them.
 */
export const SHAPE_SHIFTS: Record<CubeShape, boolean> = {
  '2': false,
  '3': false,
  '4': false,
  '123': false,
  '223': false,
  '224': true,
  '332': false,
  '331': false,
  star: false,
  star4: false,
}

/**
 * Inner layers a puzzle's mechanism turns besides its outer faces, on every
 * axis of 3 layers or more: the 4x4 its inner slices (2R) and wide turns
 * (Rw); the tower only its wide turns (a slice is a wide then an outer turn
 * there, rarely useful); the slim tower its wide turns (Uw: the top block,
 * fan2cube's H*). Like SHAPE_SHIFTS, a property of the real puzzle.
 */
export const SHAPE_INNER_TURNS: Record<CubeShape, readonly ('slice' | 'wide')[]> = {
  '2': [],
  '3': [],
  '4': ['slice', 'wide'],
  '123': [],
  '224': ['wide'],
  '223': ['wide'],
  '332': [],
  '331': [],
  star: [],
  star4: [],
}

/**
 * Turns a puzzle takes beyond its everyday ones, offered apart (the pad's
 * "advanced" tab) and never scrambled with: the 3x3's middle slices (M, E, S)
 * and wide turns (Rw), which the solutions of some methods use (Roux).
 */
export const SHAPE_ADVANCED_TURNS: Record<CubeShape, readonly ('slice' | 'wide')[]> = {
  '2': [],
  '3': ['slice', 'wide'],
  '4': [],
  '123': [],
  '224': [],
  '223': [],
  '332': [],
  '331': [],
  star: [],
  star4: [],
}

/** Name of each shape in the picker (identical in every language). */
export const SHAPE_LABEL: Record<CubeShape, string> = {
  '2': '2x2 (Pocket)',
  '3': '3x3',
  '4': '4x4',
  '123': '1x2x3',
  '224': '2x2x4',
  '223': '2x2x3 (Slim Tower)',
  '332': '3x3x2 (Domino)',
  '331': '3x3x1 (Floppy)',
  star: '2-Star Prism (UFO)',
  star4: '4-Star Prism',
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
 * Shapes sold as a mirror puzzle. Only real puzzles are offered: the 2x2x4 has
 * no mirror version, and the 1x2x3 cannot have one (a one-layer axis puts two
 * opposite stickers on the same piece, so its faces carry no thickness).
 */
const SHAPE_MIRROR: Record<CubeShape, boolean> = {
  '2': true,
  '3': true,
  '4': true,
  '123': false,
  '223': false,
  '224': false,
  '332': false,
  '331': false,
  star: false,
  star4: false,
}

export function supportsMirror(shape: CubeShape): boolean {
  return SHAPE_MIRROR[shape]
}

/** One entry of the cube picker: a shape plus a rendering variant. */
interface CubeKind {
  readonly shape: CubeShape
  readonly variant: CubeVariant
}

/** Groups of the cube picker, in display order: the classic NxNxN cubes, their
 *  mirror versions, the other cuboids (tower, Domino), the flat puzzles (one
 *  layer thick: 1x2x3, Floppy), then the star prisms. */
export const CUBE_CATEGORIES = ['standard', 'mirror', 'tower', 'flat', 'star'] as const
export type CubeCategory = (typeof CUBE_CATEGORIES)[number]

/** Picker group of a cube choice, derived from its variant and dimensions. */
export function cubeCategory({ shape, variant }: CubeKind): CubeCategory {
  if (variant === 'mirror') return 'mirror'
  if (isStar(shape)) return 'star'
  const [x, y, z] = SHAPE_DIMS[shape]
  if (x === y && y === z) return 'standard'
  // One layer thick: the 1x2x3 and the Floppy.
  return x === 1 || y === 1 || z === 1 ? 'flat' : 'tower'
}

/** Cube choices exposed in the UI (the picker groups them by `cubeCategory`). */
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
export type Color = CubeColor | 'P' | 'V'

/** The six colors of the cubes (the standard scheme); the star prism adds
 *  pink and violet for its six valleys. */
export type CubeColor = 'W' | 'Y' | 'G' | 'B' | 'O' | 'R'

/** Every cube color, in palette order. */
const COLORS: readonly CubeColor[] = ['W', 'Y', 'G', 'B', 'O', 'R']

/** Every sticker color of every puzzle. */
export const ALL_COLORS: readonly Color[] = [...COLORS, 'P', 'V']

/** Integer coordinate axis. */
export type Axis = 'x' | 'y' | 'z'

/** Integer 3D vector. Sticker normals are unit axis vectors; cubie positions
 *  live on the integer grid of the puzzle's mechanism (`layerCoords` in
 *  geometry.ts, `turnDims` in cube.ts: a shifted tower reaches +-3). */
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
 * The whole puzzle, one cubie per grid cell: 8 for a 2x2, 27 for a 3x3 (with
 * its hidden core), 64 for a 4x4, 6 for a 1x2x3, 16 for the tower, 18 for
 * the Domino. The cubie count identifies the shape (see `cubeShape`).
 */
export type Cube = readonly Cubie[]

/**
 * A quarter-or-half turn of one or two layers, e.g. `U`, `R'`, `F2`, `2R`, `Rw`.
 * `amount` is the number of clockwise quarter turns (1, 2, or 3 = counter-clockwise).
 *
 * Moves have a single canonical shape so structural comparison works:
 * - `{ face, amount }`: outer face turn;
 * - `{ face, amount, depth: 2 }`: inner slice, second layer in from the face
 *   (SiGN notation `2R`): the middle slice M/E/S of a 3x3, an inner slice of
 *   a 4x4;
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

/** A turn of a star prism's top (`U`) or bottom (`D`) layer, or of the 4-star's
 *  inner ones (`u` below the top, `d` above the bottom), by `amount` pieces
 *  (60 degrees each), clockwise seen from that side. */
export interface RingMove {
  readonly ring: 'U' | 'u' | 'd' | 'D'
  readonly amount: 1 | 2 | 3 | 4 | 5
}

/** The star prism's slash: a half turn of its right half. */
interface SlashMove {
  readonly slash: true
}

export type StarMove = RingMove | SlashMove

/** Any turn of any puzzle: a face-layer move, or a star prism's. Generic code
 *  (the animation queue, the display) handles turns; solvers of the cubes,
 *  which only ever make face moves, keep `Move`. */
export type Turn = Move | StarMove

/** Whether a turn is a star prism's. */
export const isStarMove = (turn: Turn): turn is StarMove => 'ring' in turn || 'slash' in turn
