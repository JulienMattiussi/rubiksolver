import { cubeOrientations, solvedCube } from '../cube'
import {
  applyMegaMove,
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

/** Where every place goes as a turn is played (a probe piece carried). */
const TURN_TABLES = new Map(
  MEGA_TURNS.map((move) => {
    const table = new Int16Array(PLACES.length)
    PLACES.forEach(({ slot, face }, i) => {
      const probe: Cubie = {
        position: megaPosition(MEGA_SLOTS[slot]!),
        stickers: [{ normal: megaNormal(face), color: 'W' }],
      }
      table[i] = placeOf(applyMegaMove([probe], move)[0]!)
    })
    return [move.megaFace + move.amount, table] as const
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
    const table = TURN_TABLES.get(move.megaFace + move.amount)!
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
  megaFace: move.megaFace,
  amount: (5 - move.amount) as MegaMove['amount'],
})

/** Single turns, and every formula held every way, alone or set up by a
 *  turn undone after (X F X'): as macros, each once. */
function macrosOf(formulas: readonly string[]): Macro[] {
  const seen = new Set<string>()
  const out: Macro[] = []
  const add = (moves: MegaMove[]) => {
    const key = moves.map((m) => m.megaFace + m.amount).join()
    if (seen.has(key)) return
    seen.add(key)
    out.push(macroOf(moves))
  }
  for (const move of MEGA_TURNS) add([move])
  for (const formula of formulas) {
    for (const held of HOLDINGS) {
      const moves = megaFormula(formula, held)
      add(moves)
      for (const setup of MEGA_TURNS) add([setup, ...moves, inverse(setup)])
    }
  }
  return out
}

const MACROS = new Map<string, Macro[]>()
const macrosFor = (formulas: readonly string[]) => {
  const key = formulas.join('|')
  let macros = MACROS.get(key)
  if (!macros) MACROS.set(key, (macros = macrosOf(formulas)))
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

const STEPS: readonly { slots: Slots; formulas: readonly string[]; placed?: true }[] = [
  { slots: STAR_SLOTS, formulas: STAR },
  { slots: CORNER_SLOTS, formulas: CORNER },
  { slots: LOW_SLOTS, formulas: EQUATOR },
  { slots: SIDE_SLOTS, formulas: [...SIDE_CORNERS, ...EQUATOR] },
  { slots: HIGH_SLOTS, formulas: EQUATOR },
  { slots: TOP_EDGE_SLOTS, formulas: TOP_EDGES, placed: true },
  { slots: TOP_EDGE_SLOTS, formulas: TOP_FLIP },
  { slots: TOP_CORNER_SLOTS, formulas: TOP_CORNERS, placed: true },
  { slots: TOP_CORNER_SLOTS, formulas: TOP_TWIST },
]

/** The solved puzzle held every way: the one aimed at is the one whose
 *  centers (which never move) the state shows. */
let HELD: Cube[] | undefined
const centers = (cube: Cube) =>
  cube
    .filter((c) => c.stickers.length === 1)
    .map((c) => c.position.join() + c.stickers[0]!.color)
    .sort()
    .join()
function targetOf(cube: Cube): Cube {
  HELD ??= cubeOrientations(SOLVED)
  const seen = centers(cube)
  return HELD.find((held) => centers(held) === seen)!
}

/** A slot's piece in the target, where it belongs. */
const homeIn = (target: Cube, slot: readonly MegaFace[]) =>
  target.find((c) => c.position.join() === megaPosition(slot).join())!

const colorsOf = (c: Cubie) =>
  c.stickers
    .map((s) => s.color)
    .sort()
    .join()

/** The piece a slot wants (found by its colors), where it stands. */
const pieceOf = (cube: Cube, target: Cube, slot: readonly MegaFace[]) => {
  const colors = colorsOf(homeIn(target, slot))
  return cube.find((c) => colorsOf(c) === colors)!
}

const isHome = (cube: Cube, target: Cube, slot: readonly MegaFace[]) =>
  placeOf(pieceOf(cube, target, slot)) === placeOf(homeIn(target, slot))
const isPlaced = (cube: Cube, target: Cube, slot: readonly MegaFace[]) =>
  pieceOf(cube, target, slot).position.join() === megaPosition(slot).join()

/** Every step up to `k` done (the last one only placed, if so). */
const doneTo = (k: number) => (cube: Cube) => {
  const target = targetOf(cube)
  return STEPS.slice(0, k + 1).every(({ slots, placed }, i) =>
    slots.every((s) => (placed && i === k ? isPlaced : isHome)(cube, target, s)),
  )
}

/** A step's work: its pieces one after another. */
function phase(k: number) {
  const { slots, formulas, placed } = STEPS[k]!
  return (cube: Cube): MegaMove[] => {
    const macros = macrosFor(formulas)
    // Done: the steps before (and the centers, never moved).
    const mine = new Set(slots.map((s) => SLOT_INDEX.get(keyOf(s))!))
    const before = STEPS.slice(0, k).flatMap((step) =>
      step.slots.map((s) => SLOT_INDEX.get(keyOf(s))!),
    )
    // Done: the steps before (the centers never move); this step's own
    // pieces, placed by the step before, only keep their slots.
    const done = new Set(before.filter((i) => !mine.has(i)))
    const kept = new Set(before.filter((i) => mine.has(i)))
    const target = targetOf(cube)
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

const KEYS = [
  'stepMegaStar',
  'stepMegaCorners',
  'stepMegaLowEdges',
  'stepMegaSides',
  'stepMegaHighEdges',
  'stepMegaTopEdges',
  'stepMegaTopFlip',
  'stepMegaTopCorners',
  'stepMegaTopTwist',
]

export const MEGAMINX_PLAN: MethodPlan = STEPS.map((_, k) => ({
  key: KEYS[k]!,
  goal: doneTo(k),
  moves: allTurnsOf('megaminx'),
  phases: [phase(k)],
}))
