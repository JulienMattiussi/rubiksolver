// Domain types for the cube engine. Pure data, zero React / three.js.

/** Supported cube sizes (NxNxN). */
export type CubeSize = 2 | 3 | 4

/** Sizes exposed in the UI, in display order. */
export const CUBE_SIZES: readonly CubeSize[] = [2, 3, 4]

/** A face of the cube, named with the standard Singmaster letters. */
export type Face = 'U' | 'D' | 'L' | 'R' | 'F' | 'B'

/** Sticker colors. Kept distinct from Face letters (a sticker's color is not
 *  the same concept as the face it currently sits on). */
export type Color = 'W' | 'Y' | 'G' | 'B' | 'O' | 'R'

/** Integer coordinate axis. */
export type Axis = 'x' | 'y' | 'z'

/** Integer 3D vector. Sticker normals are unit axis vectors; cubie positions
 *  live on the integer grid of their size (see `layerCoords` in cube.ts). */
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
 * The whole cube: 27 cubies for a 3x3 (26 visible + 1 hidden core), the 8
 * corner cubies (positions in {-1,1}^3) for a 2x2, or 64 cubies (8 hidden
 * inner ones) for a 4x4.
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
