// Domain types for the cube engine. Pure data, zero React / three.js.

/** Number of layers along x, y and z. Everything geometric derives from it. */
export type Dims = readonly [number, number, number]

/** The puzzles the app can build, by id (also the picker's option values). */
export type CubeShape =
  | '2'
  | '3'
  | '4'
  | '5'
  | '123'
  | '224'
  | '223'
  | '332'
  | '331'
  | 'pyra'
  | 'pyra4'
  | 'pyra5'
  | 'jing'
  | 'morph'
  | 'oct4'
  | 'vto'
  | 'gem'
  | 'rainbow'
  | 'gearCube'
  | 'gearU'
  | 'violet'
  | 'ghost'
  | 'star'
  | 'star4'

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
  '5': [5, 5, 5],
  '123': [3, 2, 1],
  '224': [2, 4, 2],
  '223': [2, 3, 2],
  '332': [3, 2, 3],
  '331': [3, 1, 3],
  // The Pyraminx and the Master Pyraminx (pyraminx.ts) are no grid either:
  // their pieces sit within +-2 and +-3 on every axis (see `pyraSize`).
  pyra: [5, 5, 5],
  pyra4: [7, 7, 7],
  pyra5: [9, 9, 9],
  // The Pyraminx Jing's pieces sit within +-1 (see pyraminx.ts).
  jing: [3, 3, 3],
  // The Pyramorphinx is a 2x2 cut down to a tetrahedron (morph.ts).
  morph: [2, 2, 2],
  // The 4-Trajber's Octahedron is a 4x4x4 cut to an octahedron (oct4.ts).
  oct4: [4, 4, 4],
  // The Octahedron VTO is a 3x3x3 cut to an octahedron, its tips apart: it
  // turns on a 5x5's grid (vto.ts).
  vto: [5, 5, 5],
  // The GEM-0 is the VTO with its tips cut flat (vto.ts).
  gem: [3, 3, 3],
  // The Rainbow (rainbow.ts) is no grid: its pieces sit within +-1.
  rainbow: [3, 3, 3],
  // The Gear Cubes (gear.ts): a 3x3x3 whose edges are gears.
  gearCube: [3, 3, 3],
  gearU: [3, 3, 3],
  // The Violet (violet.ts) turns on a 5x5's outer slabs: its pieces sit
  // within +-3, in half mini cubes about its off-center core.
  violet: [5, 5, 5],
  // The Floppy Ghost (ghost.ts) is no grid: its slots sit within +-3 in its
  // plane, all at z = 0.
  ghost: [7, 7, 1],
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

/** The Pyraminx, the Master Pyraminx (its 4x4 version) and the Pyraminx
 *  Jing (its deep-cut cousin). */
export type PyraShape = 'pyra' | 'pyra4' | 'pyra5' | 'jing'

/** Whether a shape is a Pyraminx, which turns about its corners (pyraminx.ts). */
export const isPyraminx = (shape: CubeShape): shape is PyraShape =>
  shape === 'pyra' || shape === 'pyra4' || shape === 'pyra5' || shape === 'jing'

/** The Gear Cubes (gear.ts): a 3x3x3's cubies, turned by gear moves. */
export const isGear = (shape: CubeShape): boolean => shape === 'gearCube' || shape === 'gearU'

/** Whether a Gear Cube's clips bear colors (the Ultimate): then they turn
 *  over apart from their gears, which the plain Gear Cube does not show. */
export const hasColoredClips = (shape: CubeShape): boolean => shape === 'gearU'

/** Whether a shape builds and turns in its own module rather than on a grid
 *  of layers (the star prisms, the Pyraminx, the Floppy Ghost): drawn from
 *  polygons, turned by its own pad. */
export const isGridless = (shape: CubeShape): boolean =>
  isStar(shape) || isPyraminx(shape) || shape === 'ghost' || shape === 'rainbow' || isGear(shape)

/** Whether a shape is drawn from polygons rather than cubie boxes: every
 *  gridless one, the Pyramorphinx (a 2x2 whose pieces are not cubes) and
 *  the 4-Trajber's Octahedron and the VTO (cubes cut to an octahedron), the Violet
 *  (pieces of two sizes). */
export const isPolyDrawn = (shape: CubeShape): boolean =>
  (isGridless(shape) && !isGear(shape)) ||
  shape === 'morph' ||
  shape === 'oct4' ||
  shape === 'vto' ||
  shape === 'gem' ||
  shape === 'violet'

/**
 * Shapes that leave their box: their mechanism is a bigger cube with pieces
 * missing, so they turn like that cube and come out bumpy. The 2x2x4 tower
 * turns like a 4x4x4 (`turnDims`): its wide turns (Rw: half the puzzle) always
 * go, an outer turn (R) only when its end is a complete layer (`turnAllowed`).
 * A property of the real puzzle's core, not of its dimensions: a 1x3x3 Floppy
 * forbids such turns where its Super Floppy cousin allows them. The
 * Pyramorphinx shifts too, inside its box: its pieces differ in shape, so a
 * big one where a small one belongs changes its form. Such a puzzle is
 * entered in the form it stands in (forms.ts).
 */
export const SHAPE_SHIFTS: Record<CubeShape, boolean> = {
  '2': false,
  '3': false,
  '4': false,
  '5': false,
  '123': false,
  '223': false,
  '224': true,
  '332': false,
  '331': false,
  pyra: false,
  pyra4: false,
  pyra5: false,
  jing: false,
  morph: true,
  oct4: false,
  vto: false,
  gem: false,
  rainbow: false,
  gearCube: false,
  gearU: false,
  violet: true,
  ghost: false,
  star: false,
  star4: false,
}

/**
 * Inner layers a puzzle's mechanism turns besides its outer faces, on every
 * axis of 3 layers or more: the 4x4 its inner slices (2R) and wide turns
 * (Rw); the tower only its wide turns (a slice is a wide then an outer turn
 * there, rarely useful); the slim tower its wide turns (Uw: the top block,
 * fan2cube's H*); the 4-Trajber's Octahedron its slices only (a wide turn
 * there turns four whole faces: the puzzle stays solved). Like
 * SHAPE_SHIFTS, a property of the real puzzle.
 */
export const SHAPE_INNER_TURNS: Record<CubeShape, readonly ('slice' | 'wide')[]> = {
  '2': [],
  '3': [],
  '4': ['slice', 'wide'],
  '5': ['slice', 'wide'],
  '123': [],
  '224': ['wide'],
  '223': ['wide'],
  '332': [],
  '331': [],
  pyra: [],
  pyra4: [],
  pyra5: [],
  jing: [],
  morph: [],
  oct4: ['slice'],
  vto: ['wide'],
  gem: [],
  rainbow: [],
  gearCube: [],
  gearU: [],
  violet: [],
  ghost: [],
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
  '5': [],
  '123': [],
  '224': [],
  '223': [],
  '332': [],
  '331': [],
  pyra: [],
  pyra4: [],
  pyra5: [],
  jing: [],
  morph: [],
  oct4: [],
  vto: [],
  gem: [],
  rainbow: [],
  gearCube: [],
  gearU: [],
  violet: [],
  ghost: [],
  star: [],
  star4: [],
}

/** Name of each shape in the picker (identical in every language). */
export const SHAPE_LABEL: Record<CubeShape, string> = {
  '2': '2x2 (Pocket)',
  '3': '3x3',
  '4': '4x4',
  '5': '5x5',
  '123': '1x2x3',
  '224': '2x2x4',
  '223': '2x2x3 (Slim Tower)',
  '332': '3x3x2 (Domino)',
  '331': '3x3x1 (Floppy)',
  pyra: 'Pyraminx',
  pyra4: 'Master Pyraminx (4x4)',
  pyra5: 'Professor Pyraminx (5x5)',
  jing: 'Pyraminx Jing',
  morph: 'Pyramorphinx',
  oct4: "4-Trajber's Octahedron",
  vto: 'Octahedron VTO',
  gem: 'GEM-0 (Jewel)',
  rainbow: 'Rainbow',
  gearCube: 'Gear Cube',
  gearU: 'Gear Cube Ultimate',
  violet: 'Violet',
  ghost: 'Floppy Ghost',
  star: '2-Star Prism (UFO)',
  star4: '4-Star Prism',
}

/** Name of each shape in the address (`#/fr/floppy-ghost`, see route.ts):
 *  the same in every language, so a link works whatever the reader's. */
export const SHAPE_SLUG: Record<CubeShape, string> = {
  '2': '2x2',
  '3': '3x3',
  '4': '4x4',
  '5': '5x5',
  '123': '1x2x3',
  '224': '2x2x4',
  '223': 'slim-tower',
  '332': 'domino',
  '331': 'floppy',
  pyra: 'pyraminx',
  pyra4: 'master-pyraminx',
  pyra5: 'professor-pyraminx',
  jing: 'pyraminx-jing',
  morph: 'pyramorphinx',
  oct4: '4-trajber',
  vto: 'vto',
  gem: 'gem-0',
  rainbow: 'rainbow',
  gearCube: 'gear-cube',
  gearU: 'gear-cube-ultimate',
  violet: 'violet',
  ghost: 'floppy-ghost',
  star: '2-star',
  star4: '4-star',
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
  '5': false,
  '123': false,
  '223': false,
  '224': false,
  '332': false,
  '331': false,
  pyra: false,
  pyra4: false,
  pyra5: false,
  jing: false,
  morph: false,
  oct4: false,
  vto: false,
  gem: false,
  rainbow: false,
  gearCube: false,
  gearU: false,
  violet: false,
  ghost: false,
  star: false,
  star4: false,
}

export function supportsMirror(shape: CubeShape): boolean {
  return SHAPE_MIRROR[shape]
}

/** One entry of the cube picker: a shape plus a rendering variant. */
export interface CubeKind {
  readonly shape: CubeShape
  readonly variant: CubeVariant
}

/** Groups of the cube picker, in display order: the classic NxNxN cubes, their
 *  mirror versions, the other cuboids (tower, Domino), the flat puzzles (one
 *  layer thick: 1x2x3, Floppy), the pyramids, then the star prisms. */
export const CUBE_CATEGORIES = [
  'standard',
  'mirror',
  'tower',
  'flat',
  'pyramid',
  'octahedron',
  'star',
  'gear',
  'odd',
] as const
export type CubeCategory = (typeof CUBE_CATEGORIES)[number]

/** Picker group of a cube choice, derived from its variant and dimensions. */
export function cubeCategory({ shape, variant }: CubeKind): CubeCategory {
  if (variant === 'mirror') return 'mirror'
  if (isStar(shape)) return 'star'
  if (isPyraminx(shape) || shape === 'morph') return 'pyramid'
  if (shape === 'oct4' || shape === 'vto' || shape === 'gem' || shape === 'rainbow') {
    return 'octahedron'
  }
  if (isGear(shape)) return 'gear'
  if (shape === 'violet') return 'odd'
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
export type Color = CubeColor | 'P' | 'V' | RainbowColor | GemColor

/** The Rainbow's six more triangle colors: dark green, dark blue,
 *  turquoise, pale pink, brown, lime. */
type RainbowColor = 'E' | 'N' | 'T' | 'K' | 'M' | 'L'

/** The GEM-0's squares: golden, as on the real puzzle. */
type GemColor = 'C'

/** The six colors of the cubes (the standard scheme); the star prism adds
 *  pink and violet for its six valleys. */
export type CubeColor = 'W' | 'Y' | 'G' | 'B' | 'O' | 'R'

/** Every cube color, in palette order. */
const COLORS: readonly CubeColor[] = ['W', 'Y', 'G', 'B', 'O', 'R']

/** Every sticker color of every puzzle. */
export const ALL_COLORS: readonly Color[] = [...COLORS, 'P', 'V', 'E', 'N', 'T', 'K', 'M', 'L', 'C']

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
  /** A gear edge's turn about its own axis, in sixths of a turn (0 to 5),
   *  which no cube rotation says (the Gear Cubes, gear.ts). */
  readonly spin?: number
  /** A gear edge whose clips bear no color (the plain Gear Cube): only its
   *  gear shows, so a half turn of it on them is no state (gear.ts). */
  readonly plainClips?: true
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
  /** Inner layer selector: 2 = second layer in from `face`, 3 = the third
   *  (a 5x5's middle slice). Absent = outer. */
  readonly depth?: 2 | 3
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

/** A corner of the Pyraminx, named like the international notation: the top
 *  (U), the front left (L) and right (R), the back (B). */
export type PyraVertex = 'U' | 'L' | 'R' | 'B'

/**
 * A Pyraminx turn: a third of a turn about one of its corners, clockwise seen
 * from that corner (`amount` 1) or back (2). With `tip`, its tip alone; on
 * the Master Pyraminx, with `slice`, one slice counted from the corner (1:
 * under the tip, 3: the opposite face); on the Jing, with `deep`, the corner's
 * half of the puzzle, cut beyond its center; otherwise the Pyraminx's whole
 * layer under the corner (its tip, center piece and three edges).
 */
export interface PyraMove {
  readonly vertex: PyraVertex
  readonly amount: 1 | 2
  readonly tip?: true
  readonly slice?: 1 | 2 | 3 | 4
  readonly deep?: true
}

/** A side of the Floppy Ghost, clockwise from the top: the top (U), the
 *  right (R), the bottom right (D), the bottom left (B), the left (L). */
export type GhostSide = 'U' | 'R' | 'D' | 'B' | 'L'

/** A Floppy Ghost turn: the half turn of one side (ghost.ts). */
export interface GhostMove {
  readonly side: GhostSide
}

/** A triangle of the Rainbow, as the puzzle is held (a square in front):
 *  the four around the front square (U above, D below, L left, R right),
 *  then the four behind them, in lowercase. */
export type RainbowCorner = 'U' | 'D' | 'L' | 'R' | 'u' | 'd' | 'l' | 'r'

/** A Rainbow turn: a third of a turn of one triangle (its three pieces),
 *  clockwise seen from it (`amount` 1) or back (2). */
export interface RainbowMove {
  readonly triangle: RainbowCorner
  readonly amount: 1 | 2
}

/** Any turn of any puzzle: a face-layer move, a star prism's, the
 *  Pyraminx's, the Floppy Ghost's or the Rainbow's. Generic code (the animation queue, the
 *  display) handles turns; solvers of the cubes, which only ever make face
 *  moves, keep `Move`. */
/** A Gear Cube move (gear.ts): a half turn of a face, clockwise seen from
 *  it (1) or back (3), its opposite face held, the slice between a quarter
 *  along, its gears a third of a turn. */
export interface GearMove {
  readonly gear: Face
  readonly amount: 1 | 3
  /** Played three times in a row (the guide's 3U2: the gears go round once
   *  and the cube is a cube again). */
  readonly times?: 3
}

export type Turn = Move | StarMove | PyraMove | GhostMove | RainbowMove | GearMove

/** Whether a turn is a star prism's. */
export const isStarMove = (turn: Turn): turn is StarMove => 'ring' in turn || 'slash' in turn

/** Whether a turn is the Pyraminx's. */
export const isPyraMove = (turn: Turn): turn is PyraMove => 'vertex' in turn

/** Whether a turn is the Floppy Ghost's. */
export const isGhostMove = (turn: Turn): turn is GhostMove => 'side' in turn

/** Whether a turn is the Rainbow's. */
export const isRainbowMove = (turn: Turn): turn is RainbowMove => 'triangle' in turn

/** Whether a turn is a Gear Cube's. */
export const isGearMove = (turn: Turn): turn is GearMove => 'gear' in turn

/** Whether a turn is a face-layer move (the cubes and cuboids). */
export const isFaceMove = (turn: Turn): turn is Move => 'face' in turn
