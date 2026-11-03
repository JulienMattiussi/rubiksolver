import { faceColorsOf, solvedCube, turnDims } from '../../core/cube'
import { faceOfNormal } from '../../core/geometry'
import { CUBE_HOLDS } from '../../core/hold'
import { atHome, colorRenames, colorsOf, layoutKey, recolored, sameAt } from '../../core/pieces'
import type { CubeShape } from '../../core/shapes'
import type { Color, Cube, Cubie, Vec3 } from '../../core/types'
import type { Target } from '../../teach/kit'
import { gestureChain, type Gesture } from '../../teach/macros'
import type { TutorialPick } from '../../teach/tutorial'

/**
 * What the towers' tutorials share (the 2x2x3's, the 2x2x4's). No center
 * says how a tower is held: each is read the way up and round that keeps
 * the most pieces placed, its stages in order (`holdOf`), and its targets,
 * the colors of its sides and the chains of its steps read so.
 */

/** A way of holding a tower: each color renamed to the solved one of the
 *  side it stands for then. */
type Rename = ReadonlyMap<Color, Color>

const pieceAt = (cube: Cube, at: Vec3) => cube.find((c) => sameAt(c.position, at))

/** How a piece stage's chain reads its pieces: those it tracks (`keep`),
 *  how it tells their states apart (`key`), and whether a formula may
 *  leave the whole tower turned round its height (`turned`: the 2x2x3's
 *  formula 2). */
interface ChainOptions {
  readonly keep: (c: Cubie) => boolean
  readonly key?: (pieces: Cube) => string
  readonly turned?: true
}

/** The kit of a tower, its stages' places in order (each stage's pieces'
 *  homes on the solved tower). */
export function towerKit(shape: CubeShape, stages: readonly (readonly Vec3[])[]) {
  const SOLVED = solvedCube(shape)
  const COLORS = faceColorsOf(shape)
  const MECHANISM = turnDims(shape)
  /** Upright, either way up: its eight ways. */
  const RENAMES: readonly Rename[] = colorRenames(SOLVED, COLORS).filter((r) =>
    [COLORS.U, COLORS.D].includes(r.get(COLORS.U)!),
  )
  const read = (c: Cubie, r: Rename) => recolored([c], r)[0]!
  const home = (c: Cubie, r: Rename) => atHome(read(c, r), shape)

  /** A place as a target, the tower held as `r` reads it: the piece the
   *  solved tower has there, by its colors (a twin will do, the 2x2x4's
   *  middles: `interchangeable`), placed when it stands there home. */
  function target(at: Vec3, r: Rename): Target {
    const colors = colorsOf(pieceAt(SOLVED, at)!)
    const twin = SOLVED.filter((c) => colorsOf(c) === colors).length > 1
    return {
      // Of twins, one not home yet.
      piece: (cube) => {
        const mine = cube.flatMap((c, i) => (colorsOf(read(c, r)) === colors ? [i] : []))
        return mine.find((i) => !home(cube[i]!, r)) ?? mine[0]!
      },
      slot: at,
      placed: (cube) => {
        const c = pieceAt(cube, at)
        return c !== undefined && colorsOf(read(c, r)) === colors && home(c, r)
      },
      ...(twin && { interchangeable: true as const }),
    }
  }

  const placedIn = (cube: Cube, r: Rename, places: readonly Vec3[]) =>
    places.filter((at) => target(at, r).placed(cube)).length

  /**
   * How to hold the tower: the way keeping the most pieces of its first
   * stage placed, then of the next... (a bottom turned out of line, or
   * built on top, is so used as it stands); the tower as it is on a tie.
   * A stage only grows step after step, so the way stays the same.
   */
  function holdOf(cube: Cube): Rename {
    const score = (r: Rename) => stages.map((places) => placedIn(cube, r, places))
    const better = (a: number[], b: number[]) => {
      const k = a.findIndex((n, i) => n !== b[i])
      return k >= 0 && a[k]! > b[k]!
    }
    let best = RENAMES[0]!
    let bestScore = score(best)
    for (const r of RENAMES.slice(1)) {
      const s = score(r)
      if (better(s, bestScore)) [best, bestScore] = [r, s]
    }
    return best
  }

  /** The ways of holding the tower as `hold` does, or turned round its
   *  height: its top and bottom the same. */
  const turnedRound = (hold: Rename) =>
    RENAMES.filter((r) => [COLORS.U, COLORS.D].every((c) => r.get(c) === hold.get(c)))

  /** Whether these pieces (by their colors: a tower with no twins) all
   *  stand home together, the tower held one of these ways. */
  const homeTogether = (pieces: Cube, colors: readonly string[], ways: readonly Rename[]) =>
    ways.some((r) =>
      colors.every((k) => {
        const c = pieces.find((p) => colorsOf(p) === k)
        return c !== undefined && home(c, r)
      }),
    )

  return {
    /** A stage's targets, read where the step began. */
    targetsOf: (places: readonly Vec3[]) => (begun: Cube) =>
      places.map((at) => target(at, holdOf(begun))),

    /** A side's color, the tower held its way where the step began: the
     *  color renamed to the solved one there. */
    faceColor: (_: Cube, normal: Vec3, begun: Cube): Color | null => {
      const wanted = COLORS[faceOfNormal(normal)]
      return [...holdOf(begun)].find(([, to]) => to === wanted)?.[0] ?? null
    },

    /**
     * A piece stage's chain: the shortest chain of its gestures (the
     * shortest gestures first, of chains as long) bringing the pick home,
     * the pieces of `places` home where the step began kept home: at their
     * places, or, `turned`, the same pieces home together, the tower held
     * turned round (twins would not say which place each holds).
     */
    placeChain:
      (gestures: readonly Gesture[], places: readonly Vec3[], options: ChainOptions) =>
      (cube: Cube, pick: TutorialPick, begun: Cube) => {
        const hold = holdOf(begun)
        const kept = places
          .map((at) => target(at, hold))
          .filter((t) => t.placed(begun) || sameAt(t.slot, pick.slot))
        const colors = kept.map((t) => colorsOf(cube[t.piece(cube)]!))
        const ways = turnedRound(hold)
        const goal = options.turned
          ? (pieces: Cube) => homeTogether(pieces, colors, ways)
          : (pieces: Cube) => kept.every((t) => t.placed(pieces))
        return gestureChain(
          cube,
          [...gestures].sort((a, b) => a.moves.length - b.moves.length),
          goal,
          {
            keep: options.keep,
            key: options.key ?? ((pieces) => layoutKey(pieces)),
            mechanism: MECHANISM,
            frame: CUBE_HOLDS,
          },
        )
      },
  }
}
