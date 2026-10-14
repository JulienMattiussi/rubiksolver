import { isSolved, solvedCube } from '../../core/cube'
import { AXIS_ROTATIONS, FACE_NORMAL, faceOfNormal } from '../../core/geometry'
import { allTurnsOf, type MoveSet } from '../../core/moveSet'
import { invertMoves, parseMoves } from '../../core/moves'
import type { MethodPlan } from '../../solve/solverKit'
import { centerKey, isOuter, withoutBorders } from '../../puzzles/standard/superCube'
import { applyMoves } from '../../core/turn'
import type { Cube, Cubie, Face, Move, Vec3 } from '../../core/types'
import { cycleTable, placeByCycles } from '../../solve/cycleTable'

/**
 * Super Revenge and Super Professor (superCube.ts), "méthode des centres"
 * of fan2cube.fr (superrevenge2, superprofessor2), turned around: solved as
 * a Revenge or a Professor on their colors (the borders set aside), then
 * each center brought to its own place, as the page's "états singuliers"
 * do: with colors done, the centers of a face can only stand among
 * themselves.
 *
 *   - The Professor's middle centers turned back first (they never move):
 *     (H)+(G)- = Hd*'h*'d*.H'd*'h*d* (the page's, its d* and h* the three
 *     inner layers) turns the top one a quarter and the left one back, and
 *     (H)2+ = (HDGH²D'G')² the top one a half, each held every way.
 *   - Then the centers, by pure 3-cycles: O = g'HdH'.gHd'H' (the page's,
 *     for a Revenge's centers and a Professor's corner ones; for its edge
 *     ones, the same with the middle slice), set up by turns undone after.
 *
 * With the colors done, the corners and the wings are home: the centers
 * stand an even permutation away, which 3-cycles undo.
 */

const key = (p: Vec3) => p.join()

/** A sequence held another way: its faces carried by a whole-cube turn. */
const heldAs = (moves: readonly Move[], turn: (v: Vec3) => Vec3): Move[] =>
  moves.map((m) => ({ ...m, face: faceOfNormal(turn(FACE_NORMAL[m.face])) }))

const everyWay = (moves: readonly Move[]) => AXIS_ROTATIONS.map((turn) => heldAs(moves, turn))

/** A big cube plan, played on its super cube: on its colors. */
const onColors = (plan: MethodPlan): MethodPlan =>
  plan.map((spec) => ({
    ...spec,
    goal: (cube: Cube) => spec.goal(withoutBorders(cube)),
    phases: spec.phases.map((phase) => (cube: Cube) => phase(withoutBorders(cube))),
  }))

interface Super {
  readonly solved: Cube
  readonly reach: number
}

const SUPERS = {
  super4: { solved: solvedCube('super4'), reach: 3 },
  super5: { solved: solvedCube('super5'), reach: 2 },
} satisfies Record<string, Super>

const isCenterAt = (reach: number) => (c: Cubie) =>
  c.position.filter((v) => Math.abs(v) === reach).length === 1
/** How many coordinates of a center are off its face's middle: 2 for a
 *  corner one (a Revenge's all), 1 for an edge one, 0 for the middle. */
const offMiddle = (reach: number) => (c: Cubie) =>
  c.position.filter((v) => v !== 0 && Math.abs(v) !== reach).length

/** Each center of a kind, from where it stands to its home. */
function homesFor(sup: Super, kind: (c: Cubie) => boolean) {
  const home = new Map(
    sup.solved.filter(kind).map((c) => [centerKey(c, sup.reach), key(c.position)]),
  )
  return (state: Cube) =>
    new Map(state.filter(kind).map((c) => [key(c.position), home.get(centerKey(c, sup.reach))!]))
}

const TABLES = new Map<string, Map<string, Move[]>>()
function cyclesFor(name: string, sup: Super, kind: (c: Cubie) => boolean, formula: string) {
  let table = TABLES.get(name)
  if (!table) {
    const setups = allTurnsOf(name.startsWith('super4') ? 'super4' : 'super5').turns as Move[]
    table = cycleTable(sup.solved, kind, everyWay(parseMoves(formula)), setups)
    TABLES.set(name, table)
  }
  return table
}

/** The page's O, a 3-cycle of centers: on a Revenge, of its centers; on a
 *  Professor, of its corner ones (its inner slices), or of its edge ones
 *  (the middle slice for one of them). */
export const O_CORNER = "2L' U 2R U' 2L U 2R' U'"
export const O_EDGE = "3R' U 2L U' 3R U 2L' U'"

/** The centers of a kind, each to its own place. */
const placeCenters = (name: 'super4' | 'super5', off: number, formula: string) => {
  const sup = SUPERS[name]
  const kind = (c: Cubie) => isCenterAt(sup.reach)(c) && offMiddle(sup.reach)(c) === off
  return (cube: Cube) =>
    placeByCycles(cube, cyclesFor(`${name}${off}`, sup, kind, formula), homesFor(sup, kind))
}

const centersHome = (name: 'super4' | 'super5') => (cube: Cube) => {
  const sup = SUPERS[name]
  const home = homesFor(sup, isCenterAt(sup.reach))(cube)
  return [...home].every(([at, to]) => at === to)
}

// ---------------------------------------------------------------------------
// The Professor's middle centers
// ---------------------------------------------------------------------------

const FACES: readonly Face[] = ['U', 'D', 'L', 'R', 'F', 'B']
const SOLVED5 = SUPERS.super5.solved
const middleOf = (cube: Cube, face: Face) =>
  cube.find((c) => key(c.position) === key(FACE_NORMAL[face].map((v) => 2 * v) as unknown as Vec3))!

/** How far a middle center stands turned, in quarters (clockwise seen
 *  from its face): where its first border went. */
function turnOf(cube: Cube, face: Face): number {
  const home = middleOf(SOLVED5, face)
  const border = home.stickers.find((s) => !isOuter(home, s, 2))!
  const now = middleOf(cube, face).stickers.find(
    (s) => s.color === border.color && !isOuter(middleOf(cube, face), s, 2),
  )!.normal
  const n = FACE_NORMAL[face]
  // A quarter clockwise seen from n: v -> n x v... (v' = v x n).
  let v = border.normal
  for (let k = 0; k < 4; k++) {
    if (key(v) === key(now)) return k
    v = [v[1] * n[2] - v[2] * n[1], v[2] * n[0] - v[0] * n[2], v[0] * n[1] - v[1] * n[0]] as Vec3
  }
  throw new Error('superCube: a middle center lies askew')
}

const turnsOf = (cube: Cube) => FACES.map((f) => turnOf(cube, f))

const OPPOSITE: Record<Face, Face> = { U: 'D', D: 'U', L: 'R', R: 'L', F: 'B', B: 'F' }
/** The three inner layers of a face, a quarter (d* of the page, h*...):
 *  its inner slice, the middle one, the opposite face's inner slice back. */
const inner = (face: Face, amount: 1 | 3): Move[] => [
  { face, amount, depth: 2 },
  { face, amount, depth: 3 },
  { face: OPPOSITE[face], amount: (4 - amount) as 1 | 3, depth: 2 },
]
/** (H)+(G)- = Hd*'h*'d*.H'd*'h*d*, and (H)2+ = (HDGH²D'G')². */
export const TURN_PAIR: Move[] = [
  { face: 'U', amount: 1 },
  ...inner('R', 3),
  ...inner('U', 3),
  ...inner('R', 1),
  { face: 'U', amount: 3 },
  ...inner('R', 3),
  ...inner('U', 1),
  ...inner('R', 1),
]
const TURN_HALF = parseMoves("U R L U2 R' L' U R L U2 R' L'")

let TURNERS: { moves: Move[]; effect: number[] }[] | undefined
/** Every way of holding both, and back: what each does to the turns. */
const turners = () =>
  (TURNERS ??= [TURN_PAIR, invertMoves(TURN_PAIR), TURN_HALF].flatMap((base) =>
    everyWay(base).map((moves) => ({ moves, effect: turnsOf(applyMoves(SOLVED5, moves)) })),
  ))

/** The fewest of them turning the middle centers back (a search on their
 *  turns, 4^6 states). */
function turnMiddles(cube: Cube): Move[] {
  const start = turnsOf(cube)
  const id = (t: readonly number[]) => t.join()
  const back = new Map<string, { from: string; moves: Move[] } | null>([[id(start), null]])
  let frontier = [start]
  while (frontier.length) {
    const next: number[][] = []
    for (const t of frontier) {
      if (t.every((v) => v === 0)) {
        const out: Move[][] = []
        for (let at = id(t); back.get(at); at = back.get(at)!.from) out.unshift(back.get(at)!.moves)
        return out.flat()
      }
      for (const { moves, effect } of turners()) {
        const u = t.map((v, i) => (v + effect[i]!) % 4)
        if (back.has(id(u))) continue
        back.set(id(u), { from: id(t), moves })
        next.push(u)
      }
    }
    frontier = next
  }
  throw new Error('superCube: the middle centers cannot turn back')
}

const middlesDone = (cube: Cube) => turnsOf(cube).every((v) => v === 0)

// ---------------------------------------------------------------------------

/** A Super Revenge plan from a Revenge plan. */
export function super4Plan(plan4: MethodPlan): MethodPlan {
  const all = allTurnsOf('super4')
  return [
    ...onColors(plan4),
    {
      key: 'stepSuperCenters',
      goal: (cube) => centersHome('super4')(cube) && isSolved(cube),
      moves: all,
      phases: [placeCenters('super4', 2, O_CORNER)],
    },
  ]
}

/** Every turn of a Professor, its middle slices too (each face's). */
const WITH_MIDDLES: MoveSet = (() => {
  const base = allTurnsOf('super5').turns as Move[]
  const middles = FACES.flatMap((face) =>
    ([1, 2, 3] as const).map((amount): Move => ({ face, amount, depth: 3 })),
  )
  return { generators: [...base, ...middles], turns: [...base, ...middles] }
})()

/** A Super Professor plan from a Professor plan. */
export function super5Plan(plan5: MethodPlan): MethodPlan {
  const all = WITH_MIDDLES
  return [
    ...onColors(plan5),
    {
      key: 'stepSuperMiddles',
      goal: middlesDone,
      moves: all,
      phases: [turnMiddles],
      optional: true,
    },
    {
      key: 'stepSuperCenters',
      goal: (cube) => middlesDone(cube) && centersHome('super5')(cube) && isSolved(cube),
      moves: all,
      phases: [placeCenters('super5', 2, O_CORNER), placeCenters('super5', 1, O_EDGE)],
    },
  ]
}
