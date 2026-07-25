// Domain types for the cube engine. Pure data, zero React / three.js.

/** Supported cube sizes (NxNxN), in display order. */
export const CUBE_SIZES = [2, 3] as const
export type CubeSize = (typeof CUBE_SIZES)[number]

/** A face of the cube, named with the standard Singmaster letters. */
export type Face = 'U' | 'D' | 'L' | 'R' | 'F' | 'B'

/** Sticker colors. Kept distinct from Face letters (a sticker's color is not
 *  the same concept as the face it currently sits on). */
export type Color = 'W' | 'Y' | 'G' | 'B' | 'O' | 'R'

/** Integer coordinate axis. */
export type Axis = 'x' | 'y' | 'z'

/** Integer 3D vector. Cubie positions and sticker normals live in {-1,0,1}^3. */
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
 * The whole cube: 27 cubies for a 3x3 (26 visible + 1 hidden core), or the 8
 * corner cubies (positions in {-1,1}^3) for a 2x2.
 */
export type Cube = readonly Cubie[]

/**
 * A quarter-or-half turn of one face, e.g. `U`, `R'`, `F2`.
 * `amount` is the number of clockwise quarter turns (1, 2, or 3 = counter-clockwise).
 */
export interface Move {
  readonly face: Face
  readonly amount: 1 | 2 | 3
}
