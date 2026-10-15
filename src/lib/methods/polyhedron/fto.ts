import { isSolved, solvedCube } from '../../core/cube'
import { namedSlice, parseFtoMoves } from '../../puzzles/polyhedron/fto'
import { applyRainbowMove } from '../../puzzles/shared/rainbow'
import { AXIS_ROTATIONS, vecKey } from '../../core/geometry'
import { allTurnsOf } from '../../core/moveSet'
import type { MethodPlan } from '../../solve/solverKit'
import type { Cube, Cubie, RainbowMove } from '../../core/types'
import { alikeHomes, cycleTable, placeByCycles, uniqueHomes } from '../../solve/cycleTable'
import { fromEverySide } from '../shared/rainbowKit'
import { once } from '../../solve/once'

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

const isCorner = (c: Cubie) => c.stickers.length === 4
const isEdge = (c: Cubie) => c.stickers.length === 2
const isCenter = (c: Cubie) => c.stickers.length === 1

/** A formula from every side, its slices named as the pad names them. */
const everySide = (formula: string) =>
  fromEverySide(parseFtoMoves(formula)).map((moves) => moves.map(namedSlice))

/** The page's formulas (each effect asserted in tests/unit/puzzles/polyhedron/fto.test.ts). */
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
        vecKey(c.position) +
        c.stickers
          .map((s) => s.color + vecKey(s.normal))
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

const edgeCycles = once(() => cycleTable(SOLVED, isEdge, everySide(FTO_FORMULAS.O3), SETUPS))
const centerCycles = once(() => cycleTable(SOLVED, isCenter, everySide(FTO_FORMULAS.O4), SETUPS))

/** Each edge, from where it stands to the slot of its colors. */
const edgeHomes = (state: Cube) => uniqueHomes(targetOf(state)!, isEdge)(state)

/** The two families of centers, which no turn mixes: the slots a center
 *  reaches, from each. */
const FAMILIES: readonly ReadonlySet<string>[] = (() => {
  const out: Set<string>[] = []
  for (const center of SOLVED.filter(isCenter)) {
    if (out.some((f) => f.has(vecKey(center.position)))) continue
    const family = new Set([vecKey(center.position)])
    let frontier = [center]
    while (frontier.length) {
      const next: Cubie[] = []
      for (const c of frontier) {
        for (const turn of SETUPS) {
          const [moved] = applyRainbowMove([c], turn)
          if (family.has(vecKey(moved!.position))) continue
          family.add(vecKey(moved!.position))
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
      .map((c) => [vecKey(c.position), c.stickers[0]!.color]),
  )
  return alikeHomes(
    state.filter((c) => isCenter(c) && family.has(vecKey(c.position))),
    (slot) => colorAt.get(vecKey(slot)),
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
