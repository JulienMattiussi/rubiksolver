import { isSolved, solvedCube } from '../cube'
import { namedSlice, parseFtoMoves } from '../fto'
import { applyRainbowMove } from '../rainbow'
import { AXIS_ROTATIONS } from '../geometry'
import { allTurnsOf } from '../moveSet'
import { colorsOf } from '../pieces'
import type { MethodPlan } from '../solverKit'
import type { Cube, Cubie, RainbowMove, Vec3 } from '../types'
import { cycleTable, placeByCycles } from './pyraCycles'
import { fromEverySide } from './rainbowKit'

/**
 * FTO, "méthode 2" of fan2cube.fr (FTO2): corners, then centers, then
 * edges, with four formulas.
 *
 *   1. Corners  placed and turned (the page's O1 = [D A'] and O2 =
 *               HD'H'.AHD; the corners alone, the fewest turns)
 *   2. Centers  by O4 = AhA'.B.Ah'A'.B', a 3-cycle of centers and nothing
 *               else; those of a color alike, one family at a time
 *   3. Edges    by O3 = dHd'h.dH'd'h', a 3-cycle of edges and nothing else
 *
 * Each formula from every side, set up by a turn undone after (the
 * page's conjugations). Nothing is fixed: the corners, done first, say how
 * the solved puzzle is held.
 */

const SOLVED = solvedCube('fto')
const TURNS = allTurnsOf('fto')
const SETUPS = TURNS.turns as RainbowMove[]
const FACE_TURNS = SETUPS.filter((m) => !m.slice)
const key = (p: Vec3) => p.join()

const isCorner = (c: Cubie) => c.stickers.length === 4
const isEdge = (c: Cubie) => c.stickers.length === 2
const isCenter = (c: Cubie) => c.stickers.length === 1

/** A formula from every side, its slices named as the pad names them. */
const everySide = (formula: string) =>
  fromEverySide(parseFtoMoves(formula)).map((moves) => moves.map(namedSlice))

/** The page's formulas (each effect asserted in tests/unit/fto.test.ts). */
export const FTO_FORMULAS = {
  O1: "[D A']",
  O2: "HD'H'.AHD",
  O3: "dHd'h.dH'd'h'",
  O4: "AhA'.B.Ah'A'.B'",
} as const

/** The solved puzzle held every way (the corners tell which). */
const HELD: readonly Cube[] = AXIS_ROTATIONS.map((turn) =>
  SOLVED.map((c) => ({
    position: turn(c.position),
    stickers: c.stickers.map((s) => ({ normal: turn(s.normal), color: s.color })),
  })),
)

/** Where the corners stand and how they are turned. */
const cornersKey = (cube: Cube) =>
  cube
    .filter(isCorner)
    .map(
      (c) =>
        key(c.position) +
        c.stickers
          .map((s) => s.color + key(s.normal))
          .sort()
          .join(),
    )
    .sort()
    .join('|')

const HELD_BY_CORNERS = new Map(HELD.map((held) => [cornersKey(held), held]))

/** The solved puzzle the corners say: the one they match, if they do. */
const targetOf = (cube: Cube) => HELD_BY_CORNERS.get(cornersKey(cube))
const cornersDone = (cube: Cube) => targetOf(cube) !== undefined

/** The fewest face turns bringing the corners home, held any way: a search
 *  on the six corners alone (a few thousand states). */
function solveCorners(cube: Cube): RainbowMove[] {
  let frontier: { corners: Cube; moves: RainbowMove[] }[] = [
    { corners: cube.filter(isCorner), moves: [] },
  ]
  const seen = new Set([cornersKey(frontier[0]!.corners)])
  for (let depth = 0; depth < 14; depth++) {
    for (const node of frontier) if (cornersDone(node.corners)) return node.moves
    const next: typeof frontier = []
    for (const node of frontier) {
      for (const turn of FACE_TURNS) {
        const corners = applyRainbowMove(node.corners, turn)
        const id = cornersKey(corners)
        if (seen.has(id)) continue
        seen.add(id)
        next.push({ corners, moves: [...node.moves, turn] })
      }
    }
    frontier = next
  }
  throw new Error('fto: the corners cannot go home')
}

let edgeTable: Map<string, RainbowMove[]> | undefined
let centerTable: Map<string, RainbowMove[]> | undefined
const edgeCycles = () =>
  (edgeTable ??= cycleTable(SOLVED, isEdge, everySide(FTO_FORMULAS.O3), SETUPS))
const centerCycles = () =>
  (centerTable ??= cycleTable(SOLVED, isCenter, everySide(FTO_FORMULAS.O4), SETUPS))

/** Each edge, from where it stands to the slot of its colors. */
function edgeHomes(state: Cube): Map<string, string> {
  const home = new Map(
    targetOf(state)!
      .filter(isEdge)
      .map((c) => [colorsOf(c), key(c.position)]),
  )
  return new Map(state.filter(isEdge).map((c) => [key(c.position), home.get(colorsOf(c))!]))
}

/** The two families of centers, which no turn mixes: the slots a center
 *  reaches, from each. */
const FAMILIES: readonly ReadonlySet<string>[] = (() => {
  const out: Set<string>[] = []
  for (const center of SOLVED.filter(isCenter)) {
    if (out.some((f) => f.has(key(center.position)))) continue
    const family = new Set([key(center.position)])
    let frontier = [center]
    while (frontier.length) {
      const next: Cubie[] = []
      for (const c of frontier) {
        for (const turn of SETUPS) {
          const [moved] = applyRainbowMove([c], turn)
          if (family.has(key(moved!.position))) continue
          family.add(key(moved!.position))
          next.push(moved!)
        }
      }
      frontier = next
    }
    out.push(family)
  }
  return out
})()

/** Each center of a family sent to a slot of its color: those right stay,
 *  the others each to one of the wrong slots of their color. */
const centerHomes = (family: ReadonlySet<string>) => (state: Cube) => {
  const colorAt = new Map(
    targetOf(state)!
      .filter(isCenter)
      .map((c) => [key(c.position), c.stickers[0]!.color]),
  )
  const centers = state.filter((c) => isCenter(c) && family.has(key(c.position)))
  const right = (c: Cubie) => colorAt.get(key(c.position)) === c.stickers[0]!.color
  const free = centers.filter((c) => !right(c)).map((c) => key(c.position))
  return new Map(
    centers.map((c): [string, string] => {
      const at = key(c.position)
      if (right(c)) return [at, at]
      const slot = free.findIndex((s) => colorAt.get(s) === c.stickers[0]!.color)
      return [at, free.splice(slot, 1)[0]!]
    }),
  )
}

const centersDone = (state: Cube) =>
  cornersDone(state) &&
  FAMILIES.every((family) => [...centerHomes(family)(state)].every(([at, to]) => at === to))

export const FTO_PLAN: MethodPlan = [
  { key: 'stepFtoCorners', goal: cornersDone, moves: TURNS, phases: [solveCorners] },
  {
    key: 'stepFtoCenters',
    goal: centersDone,
    moves: TURNS,
    phases: FAMILIES.map(
      (family) => (cube: Cube) => placeByCycles(cube, centerCycles(), centerHomes(family)),
    ),
  },
  {
    key: 'stepFtoEdges',
    goal: isSolved,
    moves: TURNS,
    phases: [(cube) => placeByCycles(cube, edgeCycles(), edgeHomes)],
  },
]
