import { solvedCube } from '../../core/cube'
import { allTurnsOf } from '../../core/moveSet'
import { invertMoves } from '../../core/moves'
import { solvePieces } from '../../solve/pieceSearch'
import { parseDinoMoves, RAINBOW_CORNERS, RAINBOW_TRIANGLES } from '../../puzzles/shared/rainbow'
import type { MethodPlan } from '../../solve/solverKit'
import { applyMoves as applyMovesTo } from '../../core/turn'
import type { Cube, Cubie, RainbowMove, Turn, Vec3 } from '../../core/types'

/**
 * Skewb Ultimate, "le Haut d'abord", as taught on fan2cube.fr
 * (skewbultimate2). Only the four bottom corners turn (B, O, H, E), so the
 * top center never moves: it sets how the puzzle is held.
 *
 *   1. Top corners placed, by turns of the bottom ones
 *   2. Top corners turned: G- = [BO], A+ = [O'B'], P- = [OH], D+ = [B'E']
 *   3. Centers placed: (A)<->(P) by [OH'], (G)<->(D) by [BO'],
 *      (A)->(G)->(B) by [B'E'][HE], (D)->(A)->(B) by [H'E'][HO]
 *   4. Centers turned: (A)°(G)° = [HE']²[EB']²
 *   5. Bottom corners turned: K = [BO']⁴, Z = [OH']⁴ (the bottom corners
 *      follow the top ones: once these are placed, so are they)
 *
 * The puzzle is first read held as solved, its top center home (one of its
 * twelve holdings), and the turns found are played back from how it stands.
 * Each formula's effect is asserted in tests/unit/puzzles/polyhedron/skewbU.test.ts.
 */

export const TOP_TWISTS = ['[BO]', "[O'B']", '[OH]', "[B'E']"]
export const CENTER_SWAPS = ["[OH']", "[BO']", "[B'E'][HE]", "[H'E'][HO]"]
export const CENTER_TURN = "[HE'][HE'][EB'][EB']"
export const BOTTOM_TWISTS = ["[BO'][BO'][BO'][BO']", "[OH'][OH'][OH'][OH']"]

const SOLVED = solvedCube('skewbU')
const TURNS = allTurnsOf('skewbU')
const BOTTOM: readonly Vec3[] = SOLVED.filter(
  (c) => c.position[1] === -1 && c.stickers.length === 3,
).map((c) => c.position)
const at = (p: Vec3) => (c: Cubie) => c.position.join() === p.join()
const CENTERS = SOLVED.filter((c) => c.stickers.length === 4).map((c) => c.position)
const TOP_CORNERS = SOLVED.filter((c) => c.position[1] === 1 && c.stickers.length === 3).map(
  (c) => c.position,
)
const SIDE_CENTERS = CENTERS.filter((p) => p[1] !== 1)

/** The turns of the bottom corners, both ways. */
const BOTTOM_TURNS: RainbowMove[] = TURNS.turns.filter(
  (t): t is RainbowMove => 'triangle' in t && RAINBOW_CORNERS[t.triangle][1] === -1,
) as RainbowMove[]

const parse = (formula: string) => parseDinoMoves(formula, 'skewb')
const both = (formulas: readonly string[]) =>
  formulas.flatMap((f) => [parse(f), invertMoves(parse(f))])

/** The twelve ways of holding it, each as the turn of the whole puzzle. */
const HOLDINGS: ((v: Vec3) => Vec3)[] = (() => {
  const [third, half] = [
    ([x, y, z]: Vec3): Vec3 => [y, z, x],
    ([x, y, z]: Vec3): Vec3 => [-x + 0, y, -z + 0],
  ]
  const found = new Map<string, (v: Vec3) => Vec3>([['1,0,0|0,1,0', (v) => v]])
  let frontier = [...found.values()]
  while (frontier.length) {
    const next: ((v: Vec3) => Vec3)[] = []
    for (const f of frontier) {
      for (const g of [third, half]) {
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

const turned = (cube: Cube, turn: (v: Vec3) => Vec3): Cube =>
  cube.map((c) => ({
    ...c,
    position: turn(c.position),
    stickers: c.stickers.map((s) => ({ normal: turn(s.normal), color: s.color })),
  }))

const keyOf = (c: Cubie) =>
  c.position.join() +
  c.stickers
    .map((s) => s.normal.join() + s.color)
    .sort()
    .join()
const TOP_CENTER = keyOf(SOLVED.find(at([0, 1, 0]))!)

/** The holding that brings the top center home, and the inverse turn. */
function holdingOf(cube: Cube): { turn: (v: Vec3) => Vec3; back: (v: Vec3) => Vec3 } {
  const turn = HOLDINGS.find((h) => keyOf(turned(cube, h).find(at([0, 1, 0]))!) === TOP_CENTER)!
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

/** Whether these pieces are home (or only in place) in the puzzle held as
 *  solved. */
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
      )!
      return placed ? piece.position.join() === p.join() : keyOf(piece) === keyOf(want)
    })
  }

const NONE = { generators: [], turns: [] }

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

const TOP_TWIST_MACROS = both(TOP_TWISTS)
const SWAP_MACROS = both(CENTER_SWAPS)
const CENTER_TURN_MACROS = [
  parse(CENTER_TURN),
  ...SWAP_MACROS.map((x) => [...x, ...parse(CENTER_TURN), ...invertMoves(x)]),
]
const BOTTOM_MACROS = both(BOTTOM_TWISTS)

export const SKEWB_U_PLAN: MethodPlan = [
  {
    key: 'stepSkewbTopPlaced',
    goal: home(TOP_CORNERS, true),
    moves: TURNS,
    phases: [
      held(
        oneByOne(
          TOP_CORNERS,
          [],
          BOTTOM_TURNS.map((t) => [t]),
          true,
          8,
        ),
      ),
    ],
  },
  {
    key: 'stepSkewbTopTwist',
    goal: home(TOP_CORNERS),
    moves: TURNS,
    phases: [held(oneByOne(TOP_CORNERS, [], TOP_TWIST_MACROS, false, 4))],
  },
  {
    key: 'stepSkewbCenters',
    goal: (cube) => home(TOP_CORNERS)(cube) && home(SIDE_CENTERS, true)(cube),
    moves: TURNS,
    phases: [held(oneByOne(SIDE_CENTERS, TOP_CORNERS, SWAP_MACROS, true, 4))],
  },
  {
    key: 'stepSkewbCenterTurn',
    goal: (cube) => home([...TOP_CORNERS, ...CENTERS])(cube),
    moves: TURNS,
    phases: [held(oneByOne(SIDE_CENTERS, TOP_CORNERS, CENTER_TURN_MACROS, false, 4))],
  },
  {
    key: 'stepSkewbBottom',
    goal: (cube) => home([...TOP_CORNERS, ...CENTERS, ...BOTTOM])(cube),
    moves: TURNS,
    phases: [held(oneByOne(BOTTOM, [], BOTTOM_MACROS, false, 4))],
  },
]
