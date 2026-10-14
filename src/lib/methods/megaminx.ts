import { cubeOrientations, solvedCube } from '../cube'
import {
  applyMegaMove,
  CRYSTAL_TURNS,
  MEGA_FACES,
  MEGA_SLOTS,
  MEGA_TURNS,
  megaAround,
  megaFaceOf,
  megaNormal,
  megaPosition,
  megaSlotAt,
} from '../megaminx'
import { allTurnsOf } from '../moveSet'
import { simplifyMoves } from '../moves'
import type { MethodPlan } from '../solverKit'
import { applyMoves } from '../turn'
import type { Cube, Cubie, MegaFace, MegaMove } from '../types'

/**
 * Megaminx, "l'étoile prolongée", as taught on fan2cube.fr (megaminx2): the
 * Rubik's Cube's layer by layer, a face more at each turn. From the bottom
 * face (D) up:
 *
 *   1. Star          the bottom's edges, centers matching: A², A.H'DH
 *   2. Corners       the bottom's corners: D'B'D, twisted by D'BD.ABA'
 *   3. Low equator   the edges between the five faces around the bottom:
 *                    [H'A'][HD], [HD][H'A']
 *   4. Five faces    those faces finished: corners H'A'²HA², H'A'H²A,
 *                    HD²H'D'², HDH'²D', HDH'D', edges as in 3
 *   5. High equator  the edges between the five faces around the top
 *   6. Top edges     placed by A[HD]A' = (HA)->(HP)->(HD), then
 *   7.               turned two at a time by A[HD]HA'HA.H³A'
 *   8. Top corners   placed by [HA].P'[AH]P, then
 *   9.               twisted two at a time by (D'BDABA').H'(AB'A'D'B'D)H
 *
 * Each formula from all 60 ways of holding the puzzle, and set up by a turn
 * of the top undone after; a piece goes home by the shortest chain of
 * those (and of single turns) that leave everything done in place, worked
 * out on that piece alone: a formula's effect does not depend on the
 * state, so it is read once on the solved puzzle.
 *
 * Notation (page): the puzzle held with A in front, H above it, and around
 * A clockwise H, D, B, P (underlined), G; P (plain) behind H and D.
 * Each formula's effect is asserted in tests/unit/megaminx.test.ts.
 */

/** A formula in the page's letters (`A'2` the page's A'², `H3` its H³),
 *  played from one way of holding the puzzle. */
type Letters = Record<'H' | 'A' | 'D' | 'G' | 'B' | 'P', MegaFace>

/** The page's letters held with `top` up and `front` in front. */
function holding(top: MegaFace, front: MegaFace): Letters {
  const around = megaAround(front)
  const at = around.indexOf(top)
  const [H, D, B, , G] = [0, 1, 2, 3, 4].map((k) => around[(at + k) % 5]!)
  // P: behind H and D, the third face at their far corner.
  const ring = megaAround(top)
  const i = ring.indexOf(D!)
  const P = ring[(i + 1) % 5] === front ? ring[(i + 4) % 5]! : ring[(i + 1) % 5]!
  return { H: H!, A: front, D: D!, G: G!, B: B!, P }
}

/** Every way of holding it: each face up, each of its neighbors in front. */
const HOLDINGS: readonly Letters[] = MEGA_FACES.flatMap((top) =>
  megaAround(top).map((front) => holding(top, front)),
)

/** A formula's turns, held one way. */
export function megaFormula(formula: string, held: Letters = holding('U', 'F')): MegaMove[] {
  return formula
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const match = /^([HADGBP])('?)([23]?)$/.exec(token)
      if (!match) throw new Error(`megaFormula: ${token}`)
      const n = match[3] ? Number(match[3]) : 1
      const amount = (match[2] ? 5 - n : n) as MegaMove['amount']
      return { megaFace: held[match[1] as keyof Letters], amount }
    })
}

/** 1: A², A.H'DH */
export const STAR = ['A2', "A H' D H"]
/** 2: D'B'D = (BAD) -> (HDA); (HDA)° = D'BD.ABA' */
export const CORNER = ["D' B' D", "D' B D A B A'"]
/** 3, 5: (HD)->(AD) = [H'A'][HD]; (HA)->(AD) = [HD][H'A'] */
export const EQUATOR = ["H' A' H A H D H' D'", "H D H' D' H' A' H A"]
/** 4: the left corner, the right one, the last one (taken or twisted). */
export const SIDE_CORNERS = ["H' A'2 H A2", "H' A' H2 A", "H D2 H' D'2", "H D H'2 D'", "H D H' D'"]
/** 6: A[HD]A' = (HA)->(HP)->(HD) */
export const TOP_EDGES = ["A H D H' D' A'"]
/** 7: (HA)+(HD)+ = A[HD]HA'HA.H³A' */
export const TOP_FLIP = ["A H D H' D' H A' H A H3 A'"]
/** 8: (HDA)->(HPD)->(H B P) = [HA].P'[AH]P (B underlined) */
export const TOP_CORNERS = ["H A H' A' P' A H A' H' P"]
/** 9: (HAG)°(HDA)° = (D'BDABA').H'(AB'A'D'B'D)H */
export const TOP_TWIST = ["D' B D A B A' H' A B' A' D' B' D H"]

const SOLVED = solvedCube('megaminx')
const keyOf = (faces: readonly MegaFace[]) => [...faces].sort().join()
const SLOT_INDEX = new Map(MEGA_SLOTS.map((faces, i) => [keyOf(faces), i]))
const slotIndex = (c: Cubie) => SLOT_INDEX.get(keyOf(megaSlotAt(c.position)))!

/** A place: a slot and one of its faces, where a piece's first sticker (by
 *  color) lies; it says where the piece is and how it is turned. */
const PLACES = MEGA_SLOTS.flatMap((faces, slot) => faces.map((face) => ({ slot, face })))
const PLACE = new Map(PLACES.map((p, i) => [`${p.slot}:${p.face}`, i]))

/** A piece's place. */
function placeOf(c: Cubie): number {
  const first = c.stickers.reduce((m, s) => (s.color < m.color ? s : m))
  return PLACE.get(`${slotIndex(c)}:${megaFaceOf(first.normal)}`)!
}

const turnKey = (m: MegaMove) => m.megaFace + m.amount + (m.crystal ? 'c' : '')

/** Where every place goes as a turn is played (a probe piece carried). */
const TURN_TABLES = new Map(
  [...MEGA_TURNS, ...CRYSTAL_TURNS].map((move) => {
    const table = new Int16Array(PLACES.length)
    PLACES.forEach(({ slot, face }, i) => {
      const probe: Cubie = {
        position: megaPosition(MEGA_SLOTS[slot]!),
        stickers: [{ normal: megaNormal(face), color: 'W' }],
      }
      table[i] = placeOf(applyMegaMove([probe], move)[0]!)
    })
    return [turnKey(move), table] as const
  }),
)

/** What a sequence does, whatever the state: where each place goes, and
 *  which slots it changes. */
interface Macro {
  readonly moves: readonly MegaMove[]
  readonly to: Int16Array
  readonly moved: ReadonlySet<number>
  /** The slots whose piece it takes elsewhere (not just turns). */
  readonly displaced: ReadonlySet<number>
}

function macroOf(moves: readonly MegaMove[]): Macro {
  const to = Int16Array.from(PLACES, (_, i) => i)
  for (const move of moves) {
    const table = TURN_TABLES.get(turnKey(move))!
    for (let i = 0; i < to.length; i++) to[i] = table[to[i]!]!
  }
  const moved = new Set<number>()
  const displaced = new Set<number>()
  to.forEach((j, i) => {
    if (j !== i) moved.add(PLACES[i]!.slot)
    if (PLACES[j]!.slot !== PLACES[i]!.slot) displaced.add(PLACES[i]!.slot)
  })
  return { moves, to, moved, displaced }
}

const inverse = (move: MegaMove): MegaMove => ({
  ...move,
  amount: (5 - move.amount) as MegaMove['amount'],
})

/** Single turns, and every formula held every way, alone or set up by a
 *  turn undone after (X F X'): as macros, each once. */
function macrosOf(formulas: readonly string[], crystal: boolean, top: boolean): Macro[] {
  const turns = crystal ? CRYSTAL_TURNS : MEGA_TURNS
  // On the top's steps, all else done: only the formulas held top up, set
  // up by a turn of the top, can leave it in place.
  const holdings = top ? HOLDINGS.filter((h) => h.H === 'U') : HOLDINGS
  const setups = top ? turns.filter((t) => t.megaFace === 'U') : turns
  const seen = new Set<string>()
  const out: Macro[] = []
  const add = (moves: MegaMove[]) => {
    const key = moves.map((m) => m.megaFace + m.amount).join()
    if (seen.has(key)) return
    seen.add(key)
    out.push(macroOf(moves))
  }
  for (const move of turns) add([move])
  for (const formula of formulas) {
    for (const held of holdings) {
      const moves = megaFormula(formula, held).map((m) =>
        crystal ? { ...m, crystal: true as const } : m,
      )
      add(moves)
      for (const setup of setups) add([setup, ...moves, inverse(setup)])
    }
  }
  return out
}

const MACROS = new Map<string, Macro[]>()
const macrosFor = (formulas: readonly string[], crystal: boolean, top: boolean) => {
  const key = formulas.join('|') + crystal + top
  let macros = MACROS.get(key)
  if (!macros) MACROS.set(key, (macros = macrosOf(formulas, crystal, top)))
  return macros
}

/** The fewest turns taking a piece from its place home (or just to its
 *  slot), by macros that leave the done slots alone (Dijkstra on its
 *  places). */
function route(from: number, home: number, macros: readonly Macro[], placed: boolean): MegaMove[] {
  const goal = (p: number) => (placed ? PLACES[p]!.slot === PLACES[home]!.slot : p === home)
  const cost = new Map<number, number>([[from, 0]])
  const back = new Map<number, { from: number; macro: Macro }>()
  const done = new Set<number>()
  for (;;) {
    let here = -1
    for (const [p, c] of cost) if (!done.has(p) && (here < 0 || c < cost.get(here)!)) here = p
    if (here < 0) throw new Error('megaminx: this piece cannot go home')
    if (goal(here)) {
      const moves: MegaMove[] = []
      for (let p = here; p !== from; p = back.get(p)!.from)
        moves.unshift(...back.get(p)!.macro.moves)
      return moves
    }
    done.add(here)
    const base = cost.get(here)!
    for (const macro of macros) {
      const next = macro.to[here]!
      const c = base + macro.moves.length
      if (!done.has(next) && c < (cost.get(next) ?? Infinity)) {
        cost.set(next, c)
        back.set(next, { from: here, macro })
      }
    }
  }
}

/** The slots of a step, in the order they are filled. */
type Slots = readonly (readonly MegaFace[])[]

const LOWER = megaAround('D')
const UPPER = megaAround('U')
const has = (slot: readonly MegaFace[], faces: readonly MegaFace[]) =>
  slot.filter((f) => faces.includes(f)).length
const edges = MEGA_SLOTS.filter((s) => s.length === 2)
const corners = MEGA_SLOTS.filter((s) => s.length === 3)

const STAR_SLOTS = edges.filter((s) => s.includes('D'))
const CORNER_SLOTS = corners.filter((s) => s.includes('D'))
const LOW_SLOTS = edges.filter((s) => has(s, LOWER) === 2)
/** Each face around the bottom finished in turn: the corner it shares
 *  with the next one down, its edges up, its top corner. */
const SIDE_SLOTS: Slots = (() => {
  const out: (readonly MegaFace[])[] = []
  const listed = new Set<string>()
  const add = (slot: readonly MegaFace[]) => {
    if (!listed.has(keyOf(slot))) out.push(slot)
    listed.add(keyOf(slot))
  }
  for (const face of LOWER) {
    const mine = MEGA_SLOTS.filter((s) => s.includes(face) && !s.includes('D') && s.length > 1)
    mine.filter((s) => s.length === 3 && has(s, LOWER) === 2).forEach(add)
    mine.filter((s) => s.length === 2 && has(s, UPPER) === 1).forEach(add)
    mine.filter((s) => s.length === 3 && has(s, UPPER) === 2).forEach(add)
  }
  return out
})()
const HIGH_SLOTS = edges.filter((s) => has(s, UPPER) === 2)
const TOP_EDGE_SLOTS = edges.filter((s) => s.includes('U'))
const TOP_CORNER_SLOTS = corners.filter((s) => s.includes('U'))

interface Step {
  readonly key: string
  readonly slots: Slots
  readonly formulas: readonly string[]
  readonly placed?: true
}

const MEGA_STEPS: readonly Step[] = [
  { key: 'stepMegaStar', slots: STAR_SLOTS, formulas: STAR },
  { key: 'stepMegaCorners', slots: CORNER_SLOTS, formulas: CORNER },
  { key: 'stepMegaLowEdges', slots: LOW_SLOTS, formulas: EQUATOR },
  { key: 'stepMegaSides', slots: SIDE_SLOTS, formulas: [...SIDE_CORNERS, ...EQUATOR] },
  { key: 'stepMegaHighEdges', slots: HIGH_SLOTS, formulas: EQUATOR },
  { key: 'stepMegaTopEdges', slots: TOP_EDGE_SLOTS, formulas: TOP_EDGES, placed: true },
  { key: 'stepMegaTopFlip', slots: TOP_EDGE_SLOTS, formulas: TOP_FLIP },
  { key: 'stepMegaTopCorners', slots: TOP_CORNER_SLOTS, formulas: TOP_CORNERS, placed: true },
  { key: 'stepMegaTopTwist', slots: TOP_CORNER_SLOTS, formulas: TOP_TWIST },
]

/** The Pyraminx Crystal's formulas (fan2cube.fr/pyraminxcrystal2): take a
 *  corner up D'BD, twist it D'BD.ABA', a low corner A'²HA'², a high one
 *  [HD], three top corners [HA].P'[AH]P, two twisted
 *  D'BDABA'.H'.AB'A'D'B'D.H, three top edges [G'P], two flipped
 *  ([G'P]H')².([PG']H)². */
export const CRYSTAL_FORMULAS = [
  "D' B D",
  "D' B D A B A'",
  "A'2 H A'2",
  "H D H' D'",
  "H A H' A' P' A H A' H' P",
  "D' B D A B A' H' A B' A' D' B' D H",
  "G' P G P'",
  "G' P G P' H' G' P G P' H' P G' P' G H P G' P' G H",
]

/** The top's 3-cycles, then each followed by itself or its inverse a turn
 *  of the top further on: sharing two pieces, two 3-cycles make a 3-cycle
 *  of pieces side by side, which the formula alone cannot reach. */
const EDGE_CYCLE = "G' P G P'"
const EDGE_CYCLE_BACK = "P G' P' G"
const CORNER_CYCLE = "H A H' A' P' A H A' H' P"
const CORNER_CYCLE_BACK = "P' H A H' A' P A H A' H'"
const withShifted = (cycle: string, back: string) => [
  cycle,
  ...[
    ['H', "H'"],
    ['H2', "H'2"],
    ["H'2", 'H2'],
    ["H'", 'H'],
  ].flatMap(([k, undo]) => [cycle, back].map((then) => `${cycle} ${k} ${then} ${undo}`)),
]
const CRYSTAL_TOP_CORNERS = [...withShifted(CORNER_CYCLE, CORNER_CYCLE_BACK), CRYSTAL_FORMULAS[5]!]
const CRYSTAL_TOP_EDGES = [...withShifted(EDGE_CYCLE, EDGE_CYCLE_BACK), CRYSTAL_FORMULAS[7]!]

/** The Crystal, "les sommets d'abord": as the Megaminx, each layer's
 *  corners before its edges. */
const CRYSTAL_STEPS: readonly Step[] = [
  { key: 'stepCrystalCorners', slots: CORNER_SLOTS, formulas: CRYSTAL_FORMULAS },
  { key: 'stepCrystalEdges', slots: STAR_SLOTS, formulas: CRYSTAL_FORMULAS },
  {
    key: 'stepCrystalLowCorners',
    slots: corners.filter((s) => !s.includes('D') && has(s, LOWER) === 2),
    formulas: CRYSTAL_FORMULAS,
  },
  {
    key: 'stepCrystalHighCorners',
    slots: corners.filter((s) => !s.includes('U') && has(s, UPPER) === 2),
    formulas: CRYSTAL_FORMULAS,
  },
  {
    key: 'stepMegaSides',
    slots: edges.filter((s) => !s.includes('D') && has(s, LOWER) >= 1),
    formulas: CRYSTAL_FORMULAS,
  },
  {
    key: 'stepMegaTopCorners',
    slots: TOP_CORNER_SLOTS,
    formulas: CRYSTAL_TOP_CORNERS,
    placed: true,
  },
  { key: 'stepMegaTopTwist', slots: TOP_CORNER_SLOTS, formulas: CRYSTAL_TOP_CORNERS },
  { key: 'stepMegaHighEdges', slots: HIGH_SLOTS, formulas: CRYSTAL_FORMULAS },
  { key: 'stepMegaTopEdges', slots: TOP_EDGE_SLOTS, formulas: CRYSTAL_TOP_EDGES, placed: true },
  { key: 'stepMegaTopFlip', slots: TOP_EDGE_SLOTS, formulas: CRYSTAL_TOP_EDGES },
]

/** The solved puzzle held every way: the one aimed at is the one whose
 *  centers (which never move) the state shows; without centers (the Holey
 *  Megaminx), the one the most steps then the most pieces already agree
 *  with. Its turns being even permutations, every holding is reachable. */
let HELD: Cube[] | undefined
const centers = (cube: Cube) =>
  cube
    .filter((c) => c.stickers.length === 1)
    .map((c) => c.position.join() + c.stickers[0]!.color)
    .sort()
    .join()
function targetOf(cube: Cube, STEPS: readonly Step[]): Cube {
  HELD ??= cubeOrientations(SOLVED)
  const seen = centers(cube)
  if (seen) return HELD.find((held) => centers(held) === seen)!
  const score = (held: Cube) => {
    const home = (slot: readonly MegaFace[]) => isHome(cube, held, slot)
    const steps = STEPS.findIndex(({ slots }) => !slots.every(home))
    const pieces = MEGA_SLOTS.filter((slot) => slot.length > 1 && home(slot)).length
    return (steps < 0 ? STEPS.length : steps) * 100 + pieces
  }
  return HELD.reduce((best, held) => (score(held) > score(best) ? held : best))
}

/** A puzzle's pieces by position, and by colors (built once per state). */
const BY_POSITION = new WeakMap<Cube, Map<string, Cubie>>()
const BY_COLORS = new WeakMap<Cube, Map<string, Cubie>>()
function indexed(map: WeakMap<Cube, Map<string, Cubie>>, cube: Cube, key: (c: Cubie) => string) {
  let index = map.get(cube)
  if (!index) map.set(cube, (index = new Map(cube.map((c) => [key(c), c]))))
  return index
}

/** A slot's piece in the target, where it belongs. */
const homeIn = (target: Cube, slot: readonly MegaFace[]) =>
  indexed(BY_POSITION, target, (c) => c.position.join()).get(megaPosition(slot).join())!

const colorsOf = (c: Cubie) =>
  c.stickers
    .map((s) => s.color)
    .sort()
    .join()

/** The piece a slot wants (found by its colors), where it stands. */
const pieceOf = (cube: Cube, target: Cube, slot: readonly MegaFace[]) =>
  indexed(BY_COLORS, cube, colorsOf).get(colorsOf(homeIn(target, slot)))!

const isHome = (cube: Cube, target: Cube, slot: readonly MegaFace[]) =>
  placeOf(pieceOf(cube, target, slot)) === placeOf(homeIn(target, slot))
const isPlaced = (cube: Cube, target: Cube, slot: readonly MegaFace[]) =>
  pieceOf(cube, target, slot).position.join() === megaPosition(slot).join()

/** Every step up to `k` done (the last one only placed, if so). */
const doneTo = (STEPS: readonly Step[], k: number) => (cube: Cube) => {
  const target = targetOf(cube, STEPS)
  return STEPS.slice(0, k + 1).every(({ slots, placed }, i) =>
    slots.every((s) => (placed && i === k ? isPlaced : isHome)(cube, target, s)),
  )
}

/** A step's work: its pieces one after another. */
function phase(STEPS: readonly Step[], k: number, crystal: boolean) {
  const { slots, formulas, placed } = STEPS[k]!
  return (cube: Cube): MegaMove[] => {
    // The top's steps: every slot left is on the top.
    const top = slots.every((slot) => slot.includes('U'))
    const macros = macrosFor(formulas, crystal, top)
    // Done: the steps before (and the centers, never moved).
    const mine = new Set(slots.map((s) => SLOT_INDEX.get(keyOf(s))!))
    const before = STEPS.slice(0, k).flatMap((step) =>
      step.slots.map((s) => SLOT_INDEX.get(keyOf(s))!),
    )
    // Done: the steps before (the centers never move); this step's own
    // pieces, placed by the step before, only keep their slots.
    const done = new Set(before.filter((i) => !mine.has(i)))
    const kept = new Set(before.filter((i) => mine.has(i)))
    const target = targetOf(cube, STEPS)
    let state = cube
    const all: MegaMove[] = []
    for (const slot of slots) {
      const index = SLOT_INDEX.get(keyOf(slot))!
      const safe = macros.filter(
        (m) => ![...m.moved].some((i) => done.has(i)) && ![...m.displaced].some((i) => kept.has(i)),
      )
      const moves = route(
        placeOf(pieceOf(state, target, slot)),
        placeOf(homeIn(target, slot)),
        safe,
        !!placed,
      )
      state = applyMoves(state, moves)
      all.push(...moves)
      // A piece only placed may still turn: it only keeps its slot.
      ;(placed ? kept : done).add(index)
      if (!placed) kept.delete(index)
    }
    return simplifyMoves(all)
  }
}

/** A plan: its steps, on the Megaminx's turns or the Crystal's. */
const planOf = (steps: readonly Step[], crystal: boolean): MethodPlan =>
  steps.map((step, k) => ({
    key: step.key,
    goal: doneTo(steps, k),
    moves: allTurnsOf(crystal ? 'crystal' : 'megaminx'),
    phases: [phase(steps, k, crystal)],
  }))

/** The Megaminx's, and the Holey Megaminx's (the same turns). */
export const MEGAMINX_PLAN = planOf(MEGA_STEPS, false)
export const CRYSTAL_PLAN = planOf(CRYSTAL_STEPS, true)
