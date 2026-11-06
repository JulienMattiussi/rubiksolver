// Domain types for the cube engine. Pure data, zero React / three.js; the
// puzzles' ids and catalog tables are in shapes.ts.

/** Number of layers along x, y and z. Everything geometric derives from it. */
export type Dims = readonly [number, number, number]

/** A face of the cube, named with the standard Singmaster letters. */
export type Face = 'U' | 'D' | 'L' | 'R' | 'F' | 'B'

/** Sticker colors. Kept distinct from Face letters (a sticker's color is not
 *  the same concept as the face it currently sits on). */
export type Color = CubeColor | 'P' | 'V' | RainbowColor | GemColor | MegaColor | 'H'

/** The Rainbow's six more triangle colors: dark green, dark blue,
 *  turquoise, pale pink, brown, lime. */
type RainbowColor = 'E' | 'N' | 'T' | 'K' | 'M' | 'L'

/** The GEM-0's squares: golden, as on the real puzzle. */
type GemColor = 'C'

/** The Megaminx's grey and beige faces, as on the real puzzle. */
type MegaColor = 'A' | 'S'

/** The six colors of the cubes (the standard scheme); the star prism adds
 *  pink and violet for its six valleys. */
export type CubeColor = 'W' | 'Y' | 'G' | 'B' | 'O' | 'R'

/** Every cube color, in palette order. */
const COLORS: readonly CubeColor[] = ['W', 'Y', 'G', 'B', 'O', 'R']

/** Every sticker color of every puzzle. */
export const ALL_COLORS: readonly Color[] = [
  ...COLORS,
  'P',
  'V',
  'E',
  'N',
  'T',
  'K',
  'M',
  'L',
  'C',
  'A',
  'S',
  'H',
]

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

/** A lenticular tile (the Rubik's Impossible's): its second color (none:
 *  it shows one color only), its ridges' direction, the direction across
 *  them, and how far the eye must lean that way (the sine of its angle
 *  from the tile's normal) for the tile to turn to its second color. */
export interface Lens {
  readonly secondary?: Color
  readonly ridges: Vec3
  readonly across: Vec3
  readonly turn: number
}

/** A single small cube (cubie), at an integer grid position. */
export interface Cubie {
  readonly position: Vec3
  readonly stickers: readonly Sticker[]
  /** A gear edge's turn about its own axis, in sixths of a turn (0 to 5),
   *  which no cube rotation says (the Gear Cubes, gear.ts); a Z-Twist side
   *  center's, in quarters modulo 2 (its shape shows a quarter turn, not a
   *  half: twist.ts). */
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
 * A quarter-or-half turn of one or more layers, e.g. `U`, `R'`, `F2`, `2R`, `Rw`.
 * `amount` is the number of clockwise quarter turns (1, 2, or 3 = counter-clockwise).
 *
 * Moves have a single canonical shape so structural comparison works:
 * - `{ face, amount }`: outer face turn;
 * - `{ face, amount, depth: 2 }`: inner slice, second layer in from the face
 *   (SiGN notation `2R`): the middle slice M/E/S of a 3x3, an inner slice of
 *   a 4x4;
 * - `{ face, amount, depth: 2, wide: true }`: wide turn, outer + inner layers
 *   together (`Rw`); with `depth: 3`, three layers (a 6x6's `3Rw`; `4`, a
 *   Meffert's Pocket Cube's half beyond its core). `wide`
 *   never appears without `depth`, and `depth: 1` / `wide: false` are never
 *   used.
 */
export interface Move {
  readonly face: Face
  readonly amount: 1 | 2 | 3
  /** Inner layer selector: 2 = second layer in from `face`, 3 = the third
   *  (a 5x5's middle slice, a 6x6's inner one). Absent = outer. */
  readonly depth?: 2 | 3 | 4
  /** Wide turn: layers 1..depth turn together. Requires `depth`. */
  readonly wide?: true
  /** The whole puzzle turned as `face` turns (x, y, z: held another way,
   *  nothing moved on it). Kept on R, U or F. */
  readonly whole?: true
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

/** A Hockey Puck turn (puck.ts): a layer turned some twelfths, clockwise
 *  seen from above, or the slash. */
export type SectorSteps = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11
export type SectorMove =
  { readonly layer: 'U' | 'D'; readonly steps: SectorSteps } | { readonly flip: true }

/** A triangle of the Rainbow, as the puzzle is held (a square in front):
 *  the four around the front square (U above, D below, L left, R right),
 *  then the four behind them, in lowercase. */
export type RainbowCorner = 'U' | 'D' | 'L' | 'R' | 'u' | 'd' | 'l' | 'r'

/** How deep a turn of the Rainbow's way cuts, along its diagonal: it
 *  takes what lies at least `from` along it, and at most `to` for a slice
 *  between two cuts. Each puzzle of the family declares its own (the
 *  Dino Cube's in dinoRex.ts, the Skewbs' in skewbs.ts...). */
export interface RainbowCut {
  readonly from: number
  readonly to?: number
}

/** A turn of the Rainbow's way: a third of a turn about one triangle's
 *  diagonal (a cube's corner on the Dino Cube and the like), clockwise
 *  seen from it (`amount` 1) or back (2), taking what its `cut` says. */
export interface RainbowMove {
  readonly triangle: RainbowCorner
  readonly amount: 1 | 2
  readonly cut: RainbowCut
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

/** A face of the Megaminx (megaminx.ts), as it is held: the top (U), the
 *  five around it clockwise seen from above (F in front, L, BL, BR, R), the
 *  five of the lower ring (DR under F and R, DBR, B, DBL, DL), the bottom. */
export type MegaFace = 'U' | 'F' | 'R' | 'BR' | 'BL' | 'L' | 'DR' | 'DBR' | 'B' | 'DBL' | 'DL' | 'D'

/** A Megaminx turn: a face turned some fifths, clockwise seen from it. */
export interface MegaMove {
  readonly megaFace: MegaFace
  readonly amount: 1 | 2 | 3 | 4
  /** The Pyraminx Crystal's, cut deeper: the face's layer also takes the
   *  five edges leaving its corners. */
  readonly crystal?: true
  /** The whole puzzle turned as the face turns (held another way: a face
   *  behind brought in sight, megaSight.ts). */
  readonly whole?: true
}

/** An edge of the Curvy Copters (copter.ts), by fan2cube's letter. */
export type CopterEdge = 'A' | 'P' | 'G' | 'D' | 'O' | 'E' | 'N' | 'S' | 'B' | 'H' | 'C' | 'T'

/** A Curvy Copter turn: the half turn of an edge (copter.ts). */
export interface CopterMove {
  readonly edge: CopterEdge
}

export type Turn =
  | Move
  | StarMove
  | PyraMove
  | GhostMove
  | SectorMove
  | RainbowMove
  | GearMove
  | MegaMove
  | CopterMove

/** The color of a hidden mark: a sticker no one sees, which tells a
 *  piece's state its colors do not (a bandaged puzzle's blocks, the Fisher
 *  Cube's and the Master Morphinx's turned centers, the Latch Cube's core). */
export const MARK: Color = 'H'

/** Whether a sticker is a hidden mark. */
export const isMark = (s: { readonly color: Color }): boolean => s.color === MARK

/** Whether a turn is a star prism's. */
export const isStarMove = (turn: Turn): turn is StarMove => 'ring' in turn || 'slash' in turn

/** Whether a turn is the Pyraminx's. */
export const isPyraMove = (turn: Turn): turn is PyraMove => 'vertex' in turn

/** Whether a turn is the Floppy Ghost's. */
export const isGhostMove = (turn: Turn): turn is GhostMove => 'side' in turn

/** Whether a turn is a Curvy Copter's. */
export const isCopterMove = (turn: Turn): turn is CopterMove => 'edge' in turn

/** Whether a turn is the Hockey Puck's. */
export const isSectorMove = (turn: Turn): turn is SectorMove => 'layer' in turn || 'flip' in turn

/** Whether a turn is the Megaminx's. */
export const isMegaMove = (turn: Turn): turn is MegaMove => 'megaFace' in turn

/** Whether a turn is the Rainbow's. */
export const isRainbowMove = (turn: Turn): turn is RainbowMove => 'triangle' in turn

/** Whether a turn is a Gear Cube's. */
export const isGearMove = (turn: Turn): turn is GearMove => 'gear' in turn

/** Whether a turn is a face-layer move (the cubes and cuboids). */
export const isFaceMove = (turn: Turn): turn is Move => 'face' in turn
