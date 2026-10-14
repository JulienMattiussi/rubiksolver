import { twistSolved } from './twist'
import type { Color, Cube, Cubie } from './types'

/**
 * The Fisher Cube (Tony Fisher, 1985): a 3x3x3 cut to a cube turned an
 * eighth about the vertical, "un Rubik's Cube déguisé" (fan2cube.fr). Its
 * mechanism is a 3x3's, so is its model; only its solid differs (drawn in
 * three/fisherGeometry.ts): the top and bottom centers are squares, whose
 * quarter turns never show; the four side centers are wedges along the
 * upright edges of the solid, which show theirs (turned, a wedge lies on
 * its side); the four middle edges sit in the middle of the solid's sides,
 * one color only, so their way round never shows (as the Z-Twist's thin
 * edges: twist.ts).
 *
 * A side center's way round is a hidden sticker, its mark, pointing up when
 * home: every turn carries it (a slice too), nothing else needs to know.
 */

/** The mark's color, never drawn nor painted. */
const MARK: Color = 'H'

const isSideCenter = (c: Cubie) =>
  c.stickers.length === 1 && c.position[1] === 0 && c.position.some((v) => v !== 0)

/** A 3x3 as a Fisher Cube: its side centers marked, the marks up. */
export const withMarks = (cube: Cube): Cube =>
  cube.map((c) =>
    isSideCenter(c) ? { ...c, stickers: [...c.stickers, { normal: [0, 1, 0], color: MARK }] } : c,
  )

/** The 3x3 it is, its centers' marks set aside. */
export const withoutMarks = (cube: Cube): Cube =>
  cube.map((c) =>
    c.stickers.some((s) => s.color === MARK)
      ? { ...c, stickers: c.stickers.filter((s) => s.color !== MARK) }
      : c,
  )

/** Whether a piece's mark, if any, points to the white center (up, held
 *  as solved; any way it is held, the solid turning with it). */
const markHome = (cube: Cube) => {
  const white = cube.find((c) => c.stickers.length === 1 && c.stickers[0]!.color === 'W')!
  const up = white.stickers[0]!.normal.join()
  return (c: Cubie) => c.stickers.every((s) => s.color !== MARK || s.normal.join() === up)
}

/** The side centers turned off: their marks not to the white center. */
export const centersOff = (cube: Cube): Cubie[] => cube.filter((c) => !markHome(cube)(c))

/** Solved as it shows: its colors, its middle edges either way round, and
 *  its side centers home. */
export const fisherSolved = (cube: Cube): boolean =>
  twistSolved(withoutMarks(cube)) && centersOff(cube).length === 0
