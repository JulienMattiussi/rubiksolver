import { twistSolved } from './twist'
import type { Color, Cube, Cubie, Vec3 } from './types'

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
 *
 * The Windmill (fan2cube.fr/windmill1, Hidetoshi Takeji, 2006), "le frère
 * jumeau du Fisher's Cube": the same mechanism, its solid turned only so
 * far that each vertical cut runs along one of its upright edges
 * (three/windmillGeometry.ts). Its side centers are rectangles cut in the
 * slanting sides: turned, even a half turn, they stick out; its middle
 * edges and corners show their way round too. A side center bears a second
 * mark, along its face (up x its normal), which turns as the first does:
 * it tells nothing more, but tells the Windmill from the Fisher Cube by
 * its stickers.
 */

/** The mark's color, never drawn nor painted. */
const MARK: Color = 'H'

const isSideCenter = (c: Cubie) =>
  c.stickers.length === 1 && c.position[1] === 0 && c.position.some((v) => v !== 0)

/** A 3x3 as a Fisher Cube: its side centers marked, the marks up (and,
 *  `windmill`, a second one along the face: up x the center's normal). */
export const withMarks = (cube: Cube, windmill = false): Cube =>
  cube.map((c) => {
    if (!isSideCenter(c)) return c
    const [x, , z] = c.stickers[0]!.normal
    const along = [z, 0, -x].map((v) => v + 0) as unknown as Vec3
    return {
      ...c,
      stickers: [
        ...c.stickers,
        { normal: [0, 1, 0], color: MARK },
        ...(windmill ? [{ normal: along, color: MARK }] : []),
      ],
    }
  })

/** The 3x3 it is, its centers' marks set aside. */
export const withoutMarks = (cube: Cube): Cube =>
  cube.map((c) =>
    c.stickers.some((s) => s.color === MARK)
      ? { ...c, stickers: c.stickers.filter((s) => s.color !== MARK) }
      : c,
  )

/** Whether a piece's mark, if any, points to the white center (up, held
 *  as solved; any way it is held, the solid turning with it). A Windmill's
 *  second mark follows its first. */
const markHome = (cube: Cube) => {
  const white = cube.find((c) => c.stickers.length === 1 && c.stickers[0]!.color === 'W')!
  const up = white.stickers[0]!.normal.join()
  return (c: Cubie) => {
    const mark = c.stickers.find((s) => s.color === MARK)
    return !mark || mark.normal.join() === up
  }
}

/** The side centers turned off: their marks not to the white center. */
export const centersOff = (cube: Cube): Cubie[] => cube.filter((c) => !markHome(cube)(c))

/** The Windmill solved as it shows: its colors (every piece showing its
 *  way round), its side centers home (`solved3`: the 3x3's test, cube.ts). */
export const windmillSolved = (cube: Cube, solved3: (cube: Cube) => boolean): boolean =>
  solved3(withoutMarks(cube)) && centersOff(cube).length === 0

/** Solved as it shows: its colors, its middle edges either way round, and
 *  its side centers home. */
export const fisherSolved = (cube: Cube): boolean =>
  twistSolved(withoutMarks(cube)) && centersOff(cube).length === 0
