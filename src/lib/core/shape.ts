import { FACE_COLOR } from './cube'
import type { CubeColor, CubeVariant, Face, Sticker } from './types'

/**
 * Piece shapes: what turns a cube into a mirror cube.
 *
 * A mirror cube is a plain NxN underneath (same logical state, same moves,
 * same solvers): only the pieces differ in size. Each layer of an axis has its
 * own thickness, and a piece carries its dimensions when it turns, so a
 * scrambled cube stops being a cuboid and gets bumpy.
 *
 * The shape of a cubie is a pure function of its stickers, so the renderer
 * stays a pure function of the engine state and needs no extra bookkeeping:
 * - the thickness along an axis is the one of the color facing that axis;
 * - a cubie with no sticker on an axis sits in a middle layer (thickness 1);
 * - the box is anchored on the cubie's INNER face (the one facing the cube
 *   center) and grows outward, which is what makes the bumps appear.
 *
 * That last rule is also what keeps a turn rigid: the shape recomputed after a
 * move is exactly the shape before the move, rotated (tested in shape.test.ts).
 *
 * Lengths are in cell units: a cubie occupies one unit of the visual grid
 * whatever the cube size (see three/core/layout.ts).
 */

/** A point or an extent in cell units (unlike Vec3, not an integer vector). */
type Point = readonly [number, number, number]

/**
 * Layer thickness per sticker color. Two rules shape this table:
 *
 * - **opposite colors sum to 2**, so an axis measures thickness(neg) + 1 per
 *   middle layer + thickness(pos) = size: the solved cube is a perfect cube.
 *   Middle layers of the same axis are necessarily equal (a piece moves freely
 *   between them), so on a 4x4 only the two end layers differ.
 * - **the six values are distinct**, close to the Mirror Blocks proportions
 *   (12.5 / 19 / 25.5 mm layers on a 57 mm cube) but grouped rather than
 *   shared. A thickness therefore identifies its color: the shape of a piece
 *   tells exactly which piece it is, which is what lets the editor paint
 *   thicknesses instead of colors. The real puzzle reuses one pair on all
 *   three axes, which leaves pieces of identical shape (its three all-but-one
 *   -thick corners, for instance); here each axis gets its own pair, like a
 *   core offset by a different amount along each axis.
 */
export const LAYER_THICKNESS: Record<CubeVariant, Record<CubeColor, number>> = {
  classic: { W: 1, Y: 1, G: 1, B: 1, O: 1, R: 1 },
  mirror: { O: 0.54, Y: 0.68, B: 0.78, G: 1.22, W: 1.32, R: 1.46 },
}

/** What a sticker tells on each variant: its color, or (all alike, a
 *  mirror's) its layer's size, which the variant's thicknesses give. */
const STICKERS_TELL: Record<CubeVariant, 'color' | 'size'> = {
  classic: 'color',
  mirror: 'size',
}

/** Whether a variant's stickers tell sizes rather than colors. */
export const tellsSizes = (variant: CubeVariant): boolean => STICKERS_TELL[variant] === 'size'

/** Colors ordered from the thinnest layer to the thickest. */
export function byThickness(thickness: Record<CubeColor, number>): CubeColor[] {
  return (Object.keys(thickness) as CubeColor[]).sort((a, b) => thickness[a] - thickness[b])
}

/** Box of one cubie, in cell units. */
export interface CubieBox {
  /** Extents along x, y, z. */
  readonly size: Point
  /** Box center, relative to the center of the cubie's cell. */
  readonly center: Point
}

/** The plain cubie: a unit cube centered on its cell. */
export const UNIT_BOX: CubieBox = { size: [1, 1, 1], center: [0, 0, 0] }

/** Extent of a cubie along one axis, from the sticker facing that axis. */
function axisExtent(
  stickers: readonly Sticker[],
  axis: 0 | 1 | 2,
  thickness: Record<CubeColor, number>,
): { size: number; center: number } {
  const sticker = stickers.find((s) => s.normal[axis] !== 0)
  if (!sticker) return { size: 1, center: 0 }
  // A color no cube wears (the star prism's) keeps a plain layer.
  const t = thickness[sticker.color as CubeColor] ?? 1
  const dir = (sticker.normal[axis] ?? 0) > 0 ? 1 : -1
  // Anchored on the inner face, at -0.5 from the cell center along `dir`.
  // `|| 0` keeps a plain zero (instead of -0) on a uniform thickness table.
  return { size: t, center: dir * (t / 2 - 0.5) || 0 }
}

/** Box of the cubie carrying `stickers`, for the given thickness table. */
export function cubieBox(
  stickers: readonly Sticker[],
  thickness: Record<CubeColor, number>,
): CubieBox {
  const x = axisExtent(stickers, 0, thickness)
  const y = axisExtent(stickers, 1, thickness)
  const z = axisExtent(stickers, 2, thickness)
  return { size: [x.size, y.size, z.size], center: [x.center, y.center, z.center] }
}

/**
 * Translation that recenters the solid: with unequal end layers, a solved cube
 * sits off-origin by half their difference (the real puzzle's offset core).
 */
export function centeringOffset(thickness: Record<CubeColor, number>): Point {
  const half = (pos: Face, neg: Face) =>
    (thickness[FACE_COLOR[neg]] - thickness[FACE_COLOR[pos]]) / 2
  return [half('R', 'L'), half('U', 'D'), half('F', 'B')]
}
