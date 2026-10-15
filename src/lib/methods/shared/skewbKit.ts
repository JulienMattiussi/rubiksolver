import { solvedCube } from '../../core/cube'
import { invertMoves } from '../../core/moves'
import { solvePieces } from '../../solve/pieceSearch'
import { parseDinoMoves, RAINBOW_CORNERS, RAINBOW_TRIANGLES } from '../../puzzles/shared/rainbow'
import { applyMoves as applyMovesTo } from '../../core/turn'
import type { Cube, CubeShape, Cubie, RainbowMove, Turn, Vec3 } from '../../core/types'

/**
 * Bricks of the Skewbs' methods (the Skewb, the Skewb Ultimate), "le Haut
 * d'abord" as fan2cube.fr teaches it: only the bottom corners turn, so the
 * top center never moves and sets how the puzzle is held. The puzzle is
 * read held as solved, its top center home (any holding that does), the
 * turns found there played back from how it stands.
 */

/** A fan2cube formula (`[B'E'][HE]`), in the Skewbs' turns. */
export const parse = (formula: string) => parseDinoMoves(formula, 'skewb')

/** Each formula, and the way back. */
export const both = (formulas: readonly string[]) =>
  formulas.flatMap((f) => [parse(f), invertMoves(parse(f))])

const at = (p: Vec3) => (c: Cubie) => c.position.join() === p.join()

const keyOf = (c: Cubie) =>
  c.position.join() +
  c.stickers
    .map((s) => s.normal.join() + s.color)
    .sort()
    .join()

const turned = (cube: Cube, turn: (v: Vec3) => Vec3): Cube =>
  cube.map((c) => ({
    ...c,
    position: turn(c.position),
    stickers: c.stickers.map((s) => ({ normal: turn(s.normal), color: s.color })),
  }))

const NONE = { generators: [], turns: [] }

/** The bricks for a shape held by `generators` (whole-puzzle turns of its
 *  vectors: the Skewb Ultimate's twelve holdings, the Skewb's 24), among
 *  those that bring its top center home the first that `fits` (the Skewb's
 *  corners in their own four: its two sets of corners never mix). */
export function skewbKit(
  shape: CubeShape,
  generators: readonly ((v: Vec3) => Vec3)[],
  fits: (upright: Cube) => boolean = () => true,
) {
  const SOLVED = solvedCube(shape)

  /** Every way of holding it, each as the turn of the whole puzzle. */
  const HOLDINGS: ((v: Vec3) => Vec3)[] = (() => {
    const found = new Map<string, (v: Vec3) => Vec3>([['1,0,0|0,1,0', (v) => v]])
    let frontier = [...found.values()]
    while (frontier.length) {
      const next: ((v: Vec3) => Vec3)[] = []
      for (const f of frontier) {
        for (const g of generators) {
          const h = (v: Vec3) => g(f(v))
          const key = `${h([1, 0, 0])}|${h([0, 1, 0])}`
          if (!found.has(key)) {
            found.set(key, h)
            next.push(h)
          }
        }
      }
      frontier = next
    }
    return [...found.values()]
  })()

  const TOP_CENTER = keyOf(SOLVED.find(at([0, 1, 0]))!)

  /** The holding that brings the top center home, and the inverse turn. */
  function holdingOf(cube: Cube): { turn: (v: Vec3) => Vec3; back: (v: Vec3) => Vec3 } {
    const turn = HOLDINGS.find((h) => {
      const upright = turned(cube, h)
      return keyOf(upright.find(at([0, 1, 0]))!) === TOP_CENTER && fits(upright)
    })!
    const back = HOLDINGS.find((h) =>
      (
        [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ] as Vec3[]
      ).every((v) => h(turn(v)).join() === v.join()),
    )!
    return { turn, back }
  }

  /** A phase worked out on the puzzle held as solved, played back as it
   *  stands: each corner's turn becomes the one of the corner it is. */
  function held(phase: (cube: Cube) => Turn[]) {
    return (cube: Cube): Turn[] => {
      const { turn, back } = holdingOf(cube)
      return phase(turned(cube, turn)).map((t) => {
        const m = t as RainbowMove
        const d = back(RAINBOW_CORNERS[m.triangle])
        const triangle = RAINBOW_TRIANGLES.find((x) => RAINBOW_CORNERS[x].join() === d.join())!
        return { ...m, triangle }
      })
    }
  }

  /** Whether these pieces are home (or only in place) in the puzzle held
   *  as solved. */
  const home =
    (homes: readonly Vec3[], placed = false) =>
    (cube: Cube) => {
      const upright = turned(cube, holdingOf(cube).turn)
      return homes.every((p) => {
        const want = SOLVED.find(at(p))!
        const colors = want.stickers
          .map((s) => s.color)
          .sort()
          .join()
        const piece = upright.find(
          (c) =>
            c.stickers
              .map((s) => s.color)
              .sort()
              .join() === colors,
        )
        return (
          piece !== undefined &&
          (placed ? piece.position.join() === p.join() : keyOf(piece) === keyOf(want))
        )
      })
    }

  /** Pieces placed one after another, each by the fewest generators. */
  function oneByOne(
    homes: readonly Vec3[],
    keep: readonly Vec3[],
    macros: readonly (readonly Turn[])[],
    placed: boolean,
    maxDepth: number,
  ) {
    return (cube: Cube): Turn[] => {
      let state = cube
      const all: Turn[] = []
      for (let k = 1; k <= homes.length; k++) {
        const now = homes.slice(0, k)
        const track = [...keep, ...now]
        const moves = solvePieces<Turn>(state, {
          track,
          moves: NONE,
          macros,
          ...(placed && {
            goal: (pieces: readonly Cubie[]) =>
              pieces.every((c, i) =>
                i < keep.length
                  ? keyOf(c) === keyOf(SOLVED.find(at(track[i]!))!)
                  : c.position.join() === track[i]!.join(),
              ),
          }),
          maxDepth,
        })
        state = applyMovesTo(state, moves)
        all.push(...moves)
      }
      return all
    }
  }

  return { SOLVED, held, home, oneByOne }
}

/** A formula from each side of the top (fan2cube's t H): turned a quarter
 *  about the vertical, each corner's turn the one of the corner it is
 *  brought to; the four, the formula itself first. */
export function aroundTop(moves: readonly RainbowMove[]): RainbowMove[][] {
  const quarter = ([x, y, z]: Vec3): Vec3 => [z, y, -x + 0]
  const out: RainbowMove[][] = []
  let current = [...moves]
  for (let k = 0; k < 4; k++) {
    out.push(current)
    current = current.map((m) => {
      const d = quarter(RAINBOW_CORNERS[m.triangle])
      return {
        ...m,
        triangle: RAINBOW_TRIANGLES.find((t) => RAINBOW_CORNERS[t].join() === d.join())!,
      }
    })
  }
  return out
}
