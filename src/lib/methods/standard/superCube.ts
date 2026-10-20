import { isSolved, solvedCube } from '../../core/cube'
import { AXIS_ROTATIONS, FACE_NORMAL, faceOfNormal, mapVec, vecKey } from '../../core/geometry'
import { allTurnsOf, type MoveSet } from '../../core/moveSet'
import { invertMoves } from '../../core/moves'
import { parseMoves } from '../../core/notation'
import { projectPlan, type MethodPlan } from '../../solve/solverKit'
import { centerKey, isOuter, withoutBorders } from '../../puzzles/standard/superCube'
import { applyMoves } from '../../core/turn'
import type { Cube, Cubie, Face, Move, Vec3 } from '../../core/types'
import { cycleTable, nextCycle, placeByCycles } from '../../solve/cycleTable'
import { once } from '../../solve/once'

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

/** A sequence held another way: its faces carried by a whole-cube turn. */
const heldAs = (moves: readonly Move[], turn: (v: Vec3) => Vec3): Move[] =>
  moves.map((m) => ({ ...m, face: faceOfNormal(turn(FACE_NORMAL[m.face])) }))

const everyWay = (moves: readonly Move[]) => AXIS_ROTATIONS.map((turn) => heldAs(moves, turn))

/** A big cube plan, played on its super cube: on its colors. */
const onColors = (plan: MethodPlan): MethodPlan => projectPlan(plan, withoutBorders)

interface Super {
  readonly solved: Cube
  readonly reach: number
}

const SUPERS = {
  super4: { solved: solvedCube('super4'), reach: 3 },
  super5: { solved: solvedCube('super5'), reach: 2 },
} as const satisfies Record<string, Super>

const isCenterAt = (reach: number) => (c: Cubie) =>
  c.position.filter((v) => Math.abs(v) === reach).length === 1
/** How many coordinates of a center are off its face's middle: 2 for a
 *  corner one (a Revenge's all), 1 for an edge one, 0 for the middle. */
const offMiddle = (reach: number) => (c: Cubie) =>
  c.position.filter((v) => v !== 0 && Math.abs(v) !== reach).length

/** Each center of a kind, from where it stands to its home. */
function homesFor(sup: Super, kind: (c: Cubie) => boolean) {
  const home = new Map(
    sup.solved.filter(kind).map((c) => [centerKey(c, sup.reach), vecKey(c.position)]),
  )
  return (state: Cube) =>
    new Map(state.filter(kind).map((c) => [vecKey(c.position), home.get(centerKey(c, sup.reach))!]))
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

type SuperShape = keyof typeof SUPERS

/** The centers placed by cycles, kind after kind: how far off the middle
 *  (a Revenge's all 2, a Professor's corner ones, then its edge ones), and
 *  the formula cycling them. */
const PLACED: Record<SuperShape, readonly (readonly [number, string])[]> = {
  super4: [[2, O_CORNER]],
  super5: [
    [2, O_CORNER],
    [1, O_EDGE],
  ],
}

/** A kind of center's cycles and homes. */
function centerKind(name: SuperShape, off: number, formula: string) {
  const sup = SUPERS[name]
  const kind = (c: Cubie) => isCenterAt(sup.reach)(c) && offMiddle(sup.reach)(c) === off
  return { table: cyclesFor(`${name}${off}`, sup, kind, formula), homes: homesFor(sup, kind) }
}

/** The centers of a kind, each to its own place. */
const placeCenters = (name: SuperShape, off: number, formula: string) => (cube: Cube) => {
  const { table, homes } = centerKind(name, off, formula)
  return placeByCycles(cube, table, homes)
}

/** The face a slot (`x,y,z`) is on, by its outer coordinate. */
const faceOfSlot = (slot: string, reach: number) =>
  slot
    .split(',')
    .map((v, axis) => (Math.abs(Number(v)) === reach ? `${axis}${Math.sign(Number(v))}` : ''))
    .join('')

/** Whether every sticker but the borders is home (the colors done). */
const colorsDone = (cube: Cube) => isSolved(withoutBorders(cube))

/** The next 3-cycle bringing a center home (the tutorial's step), the
 *  kinds in turn, a face at a time: its three slots on one face, so the
 *  colors stay done between steps. When a face's centers stand an odd
 *  permutation off (two swapped), no cycle on it does: the solver's own
 *  cycles then, through another face, until the colors are done again (two
 *  in one step). Null once all are home. */
export function nextCenterCycle(name: SuperShape, cube: Cube): Move[] | null {
  const { reach } = SUPERS[name]
  for (const [off, formula] of PLACED[name]) {
    const { table, homes } = centerKind(name, off, formula)
    const wrong = [...homes(cube)].find(([at, to]) => at !== to)
    if (!wrong) continue
    const face = faceOfSlot(wrong[0], reach)
    const onFace = (state: Cube) =>
      new Map([...homes(state)].filter(([at]) => faceOfSlot(at, reach) === face))
    try {
      return nextCycle(cube, table, onFace)
    } catch {
      const moves: Move[] = []
      let state = cube
      do {
        const cycle = nextCycle(state, table, homes)!
        moves.push(...cycle)
        state = applyMoves(state, cycle)
      } while (!colorsDone(state))
      return moves
    }
  }
  return null
}

/** The centers home, of how many (the Professor's middle ones apart: they
 *  never leave). */
export function centersAtHome(name: SuperShape, cube: Cube): { done: number; total: number } {
  const sup = SUPERS[name]
  const moving = (c: Cubie) => isCenterAt(sup.reach)(c) && offMiddle(sup.reach)(c) > 0
  const home = [...homesFor(sup, moving)(cube)]
  return { done: home.filter(([at, to]) => at === to).length, total: home.length }
}

const centersHome = (name: SuperShape) => (cube: Cube) => {
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
  cube.find((c) => vecKey(c.position) === vecKey(mapVec(FACE_NORMAL[face], (v) => 2 * v)))!

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
    if (vecKey(v) === vecKey(now)) return k
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
export const TURN_HALF = parseMoves("U R L U2 R' L' U R L U2 R' L'")

/** Every way of holding both, and back: what each does to the turns. */
const turners = once(() =>
  [TURN_PAIR, invertMoves(TURN_PAIR), TURN_HALF].flatMap((base) =>
    everyWay(base).map((moves) => ({ moves, effect: turnsOf(applyMoves(SOLVED5, moves)) })),
  ),
)

/** The fewest of them turning the middle centers back (a search on their
 *  turns, 4^6 states), formula by formula. */
export function middleTurns(cube: Cube): Move[][] {
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
        return out
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

const turnMiddles = (cube: Cube): Move[] => middleTurns(cube).flat()

/** The Professor's middle centers turned right. */
export const middlesStraight = (cube: Cube) => turnsOf(cube).filter((v) => v === 0).length
const middlesDone = (cube: Cube) => middlesStraight(cube) === FACES.length

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
