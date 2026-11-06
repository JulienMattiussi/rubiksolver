import { colorsSolved, solvedCube } from '../../core/cube'
import { AXIS_ROTATIONS, cross, faceOfNormal, mapVec } from '../../core/geometry'
import { stickerColors } from '../../core/pieces'
import { isMark, MARK } from '../../core/types'
import type { Color, Cube, CubeColor, Cubie, Face, Lens, Sticker, Vec3 } from '../../core/types'
import type { TogglesSpec } from '../../editor/entry'

/**
 * The Rubik's Impossible (Spin Master, 2020): a 3x3 whose tiles are
 * lenticular. Each shows one of two colors by the angle it is seen from:
 * its dominant one, its face's when solved, or its secondary one, which
 * differs from tile to tile (a few, the anchors, show one color only: the
 * centers, six tiles and one whole corner). Its official guide ("You Can
 * Do The Rubik's Impossible", its solved reference grid) gives every tile.
 *
 * Each tile is ridged, its color turning over as it is tilted across its
 * ridges: solved, a face's ridges all lie along its center's, on top and
 * bottom from left to right (along x), up and down on the sides (along y).
 * So a center's way round counts, by a half turn: its line along the face's
 * or across it. In the model a center's line is a hidden mark along it
 * (`MARK`, at each of its ends): every turn carries it.
 *
 * The state is a 3x3's of the dominant colors, its centers' lines marked;
 * the rest (a tile's secondary color, its ridges) goes with the piece and
 * is read from where it stands (`lensOf`).
 */

/** A center: its one colored sticker (its line's mark aside). */
const isCenter = (c: Cubie) => c.stickers.filter((s) => !isMark(s)).length === 1

/** The colored sticker of a center. */
const faceOf = (c: Cubie): Sticker => c.stickers.find((s) => !isMark(s))!

/** Where a face's line lies when solved: along x on top and bottom, along
 *  y on the sides. */
const solvedLine = (normal: Vec3): Vec3 => (normal[1] !== 0 ? [1, 0, 0] : [0, 1, 0])

/** A line's marks: one at each end, so that a half turn leaves them as
 *  they were (and the Master Morphinx, one mark a center, stays apart). */
const lineMarks = (along: Vec3): Sticker[] => [
  { normal: along, color: MARK },
  { normal: mapVec(along, (v) => -v), color: MARK },
]

/** The 3x3 as a Rubik's Impossible: its centers' lines marked, as solved. */
export const withLines = (cube: Cube): Cube =>
  cube.map((c) =>
    c.stickers.length === 1
      ? {
          ...c,
          stickers: [...c.stickers, ...lineMarks(solvedLine(c.stickers[0]!.normal))],
        }
      : c,
  )

/** The 3x3 as a Rubik's Impossible, the lines of the centers at these
 *  places (by key) across their face. */
export const withTurnedLines = (cube: Cube, turned: readonly string[]): Cube =>
  withLines(cube).map((c) => {
    if (!turned.includes(c.position.join())) return c
    const [face] = c.stickers
    const along = solvedLine(face!.normal)
    return { ...c, stickers: [face!, ...lineMarks(cross(face!.normal, along))] }
  })

/** Its centers' lines turned a quarter while entered, a click each, as a
 *  state shows them. */
export const lineToggles: TogglesSpec = {
  name: 'centers',
  keyAt: (slot) => (slot.stickers === 1 ? slot.key : null),
  ways: 2,
  of: (cube) =>
    Object.fromEntries(
      cube.filter((c) => isCenter(c) && !lineRight(cube, c)).map((c) => [c.position.join(), 1]),
    ),
}

/** The faces a center's line points to when solved, by its color: the top
 *  and bottom ones' to the right and left (red and orange), the sides' up
 *  and down (white and yellow). Read on colors, it holds however the
 *  puzzle is held. */
const LINE_TOWARD: Record<string, readonly Color[]> = {
  W: ['R', 'O'],
  Y: ['R', 'O'],
  G: ['W', 'Y'],
  B: ['W', 'Y'],
  R: ['W', 'Y'],
  O: ['W', 'Y'],
}

/** Whether a center's line lies as solved: toward the faces its color
 *  says (the face along its mark, by that face's center). */
function lineRight(cube: Cube, center: Cubie): boolean {
  const mark = center.stickers.find(isMark)!.normal
  const beyond = cube.find((c) => isCenter(c) && faceOf(c).normal.join() === mark.join())
  return LINE_TOWARD[faceOf(center).color]!.includes(faceOf(beyond!).color)
}

/** The 3x3 it is, its centers' lines set aside. */
export const withoutLines = (cube: Cube): Cube =>
  cube.map((c) =>
    c.stickers.some(isMark) ? { ...c, stickers: c.stickers.filter((s) => !isMark(s)) } : c,
  )

/** Solved: each face one color (read on the 3x3 it is: a line's marks
 *  face sideways), each center's line along its face's. */
export const impossibleSolved = (cube: Cube): boolean =>
  colorsSolved(withoutLines(cube)) && linesOff(cube).length === 0

/** The centers whose line lies across their face, by the face they are on. */
export const linesOff = (cube: Cube): Face[] =>
  cube.filter((c) => isCenter(c) && !lineRight(cube, c)).map((c) => faceOfNormal(faceOf(c).normal))

// ---------------------------------------------------------------------------
// Its tiles (the guide's grid)
// ---------------------------------------------------------------------------

/**
 * The guide's solved reference grid, face by face as its net lays them:
 * yellow in the middle, blue above it, green below, red on its left,
 * orange on its right, white below green. Each tile is its dominant color
 * then its secondary one (`-`: an anchor, one color), row by row.
 */
const GRID: Record<CubeColor, string> = {
  B: 'B- BR BY  BO B- BO  BW BR BG',
  R: 'RO RG RB  RW R- RY  R- RB R-',
  Y: 'YO Y- YW  YB Y- YR  YW YG YR',
  O: 'O- OB OG  OG O- OY  OY OB OR',
  G: 'GB GW G-  GW G- GR  G- GO GY',
  W: 'W- WY WB  WO W- WG  WY W- WO',
}

/** Where a tile of the net is on the solved cube (row and column of its
 *  face, from the top left): the net folded round the yellow face, seen
 *  from below (red at x = 1, white at y = 1, green at z = 1). */
const NET: Record<string, (r: number, c: number) => Vec3> = {
  Y: (r, c) => [1 - c, -1, r - 1],
  B: (r, c) => [1 - c, 1 - r, -1],
  G: (r, c) => [1 - c, r - 1, 1],
  W: (r, c) => [1 - c, 1, 1 - r],
  R: (r, c) => [1, 1 - c, r - 1],
  O: (r, c) => [-1, c - 1, r - 1],
}

/** A tile's key on the solved cube: its piece's colors, then its own. */
const tileKey = (pieceColors: string, color: Color) => `${pieceColors}:${color}`

/** Every tile's secondary color, by `tileKey` (an anchor has none). */
const SECONDARY: ReadonlyMap<string, Color> = (() => {
  // Each place's colors first: a piece is told by its colors.
  const colorsAt = new Map<string, Color[]>()
  const tiles: { at: string; color: Color; second: string }[] = []
  for (const [face, row] of Object.entries(GRID)) {
    row.split(/\s+/).forEach((tile, i) => {
      const at = NET[face]!(Math.floor(i / 3), i % 3).join()
      colorsAt.set(at, [...(colorsAt.get(at) ?? []), tile[0] as Color])
      tiles.push({ at, color: tile[0] as Color, second: tile[1]! })
    })
  }
  const pieceColors = (at: string) => [...colorsAt.get(at)!].sort().join('')
  return new Map(
    tiles
      .filter((t) => t.second !== '-')
      .map((t) => [tileKey(pieceColors(t.at), t.color), t.second as Color]),
  )
})()

/** Which way a tile turns to its secondary color as it tilts, as solved
 *  (across its ridges, the way is the guide's to tell; set here so that a
 *  face seen from the corner the app shows shows its dominant color):
 *  toward the back on top, bottom and the left and right faces, toward
 *  the left on the front and back ones. */
const solvedAcross = (normal: Vec3): Vec3 => (normal[2] !== 0 ? [-1, 0, 0] : [0, 0, -1])

/** How far the eye leans across a tile's ridges for it to turn, by its
 *  dominant color: the guide says only that the tiles of a color turn
 *  together, each color at its own angle; these are set by eye, a face
 *  seen from the corner the app shows (leaning about -0.58) its dominant
 *  color. */
const TURN: Record<CubeColor, number> = {
  W: -0.3,
  Y: 0.3,
  G: -0.15,
  B: 0.15,
  R: -0.45,
  O: 0,
}

/** A piece's colors, its line's marks aside. */
export const colorsOf = (c: Cubie) => stickerColors(c.stickers.filter((s) => !isMark(s)))

/** The solved pieces, by their colors (built when first read: the solved
 *  3x3 comes from cube.ts, which loads after the models). */
let homes: Map<string, Cubie> | undefined
const homeOf = (colors: string): Cubie =>
  (homes ??= new Map(withLines(solvedCube('3')).map((c) => [colorsOf(c), c]))).get(colors)!

/** The tiles of a piece (its colored stickers, in order), each with its
 *  lens, as it stands: its turn from home (taking its home stickers, its
 *  line's marks with them if it has them, to its own) carries the ridges
 *  it had there. */
export function lensOf(cubie: Cubie): Lens[] {
  const colors = colorsOf(cubie)
  const home = homeOf(colors)
  const marked = cubie.stickers.some(isMark)
  const by = AXIS_ROTATIONS.find((rotate) =>
    home.stickers
      .filter((h) => marked || !isMark(h))
      .every((h) =>
        cubie.stickers.some(
          (s) => s.color === h.color && rotate(h.normal).join() === s.normal.join(),
        ),
      ),
  )!
  return cubie.stickers
    .filter((s) => !isMark(s))
    .map((s) => {
      const was = home.stickers.find((h) => h.color === s.color)!.normal
      const secondary = SECONDARY.get(tileKey(colors, s.color))
      return {
        ...(secondary && { secondary }),
        ridges: by(solvedLine(was)),
        across: by(solvedAcross(was)),
        turn: TURN[s.color as CubeColor],
      }
    })
}
