import { cubeOrientations, solvedCube } from '../../core/cube'
import {
  applyMegaMove,
  CRYSTAL_TURNS,
  MEGA_SLOTS,
  MEGA_TURNS,
  megaFaceOf,
  megaNormal,
  megaPosition,
  megaSlotAt,
} from '../../puzzles/polyhedron/megaminx'
import { allTurnsOf } from '../../core/moveSet'
import { HOLDINGS, megaFormula } from './megaminxFormulas'
import { CRYSTAL_STEPS, MEGA_STEPS, type Step } from './megaminxSteps'
import { simplifyMoves } from '../../core/moves'
import type { MethodPlan } from '../../solve/solverKit'
import { applyMoves } from '../../core/turn'
import type { Cube, Cubie, MegaFace, MegaMove } from '../../core/types'
import { colorsOf } from '../../core/pieces'
import { macroOf, placesOf, route, type Macro } from '../../solve/placeTable'

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
 * Each formula's effect is asserted in tests/unit/puzzles/polyhedron/megaminx.test.ts.
 */

const SOLVED = solvedCube('megaminx')
const keyOf = (faces: readonly MegaFace[]) => [...faces].sort().join()

/** A place: a slot and one of its faces, where a piece's first sticker (by
 *  color) lies; it says where the piece is and how it is turned. */
const PLACE_LIST = MEGA_SLOTS.flatMap((faces) =>
  faces.map((face) => ({ faces, slot: keyOf(faces), face })),
)
const PLACE = new Map(PLACE_LIST.map((p, i) => [`${p.slot}:${p.face}`, i]))

/** A piece's place. */
function placeOf(c: Cubie): number {
  const first = c.stickers.reduce((m, s) => (s.color < m.color ? s : m))
  return PLACE.get(`${keyOf(megaSlotAt(c.position))}:${megaFaceOf(first.normal)}`)!
}

const PLACES = placesOf<(typeof PLACE_LIST)[number], MegaMove>(PLACE_LIST, {
  slot: (p) => p.slot,
  // A probe piece carried.
  follow: ({ faces, face }, move) => {
    const probe: Cubie = {
      position: megaPosition(faces),
      stickers: [{ normal: megaNormal(face), color: 'W' }],
    }
    return placeOf(applyMegaMove([probe], move)[0]!)
  },
  key: (m) => m.megaFace + m.amount + (m.crystal ? 'c' : ''),
})

const inverse = (move: MegaMove): MegaMove => ({
  ...move,
  amount: (5 - move.amount) as MegaMove['amount'],
})

/** Single turns, and every formula held every way, alone or set up by a
 *  turn undone after (X F X'): as macros, each once. */
function macrosOf(formulas: readonly string[], crystal: boolean, top: boolean): Macro<MegaMove>[] {
  const turns = crystal ? CRYSTAL_TURNS : MEGA_TURNS
  // On the top's steps, all else done: only the formulas held top up, set
  // up by a turn of the top, can leave it in place.
  const holdings = top ? HOLDINGS.filter((h) => h.H === 'U') : HOLDINGS
  const setups = top ? turns.filter((t) => t.megaFace === 'U') : turns
  const seen = new Set<string>()
  const out: Macro<MegaMove>[] = []
  const add = (moves: MegaMove[]) => {
    const key = moves.map((m) => m.megaFace + m.amount).join()
    if (seen.has(key)) return
    seen.add(key)
    out.push(macroOf(PLACES, moves))
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

const MACROS = new Map<string, Macro<MegaMove>[]>()
const macrosFor = (formulas: readonly string[], crystal: boolean, top: boolean) => {
  const key = formulas.join('|') + crystal + top
  let macros = MACROS.get(key)
  if (!macros) MACROS.set(key, (macros = macrosOf(formulas, crystal, top)))
  return macros
}

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
    const mine = new Set(slots.map(keyOf))
    const before = STEPS.slice(0, k).flatMap((step) => step.slots.map(keyOf))
    // Done: the steps before (the centers never move); this step's own
    // pieces, placed by the step before, only keep their slots.
    const done = new Set(before.filter((i) => !mine.has(i)))
    const kept = new Set(before.filter((i) => mine.has(i)))
    const target = targetOf(cube, STEPS)
    let state = cube
    const all: MegaMove[] = []
    for (const slot of slots) {
      const index = keyOf(slot)
      const safe = macros.filter(
        (m) => ![...m.moved].some((i) => done.has(i)) && ![...m.displaced].some((i) => kept.has(i)),
      )
      // Home, or just in its slot when the step only places.
      const home = placeOf(homeIn(target, slot))
      const moves = route(
        placeOf(pieceOf(state, target, slot)),
        (p) => (placed ? PLACES.slotOf(p) === index : p === home),
        safe,
        'megaminx: this piece cannot go home',
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
