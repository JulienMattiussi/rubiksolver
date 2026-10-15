import { allTurnsOf } from '../../core/moveSet'
import { PUCK_COLORS, puckNumber, puckPlace, puckSolved } from '../../puzzles/round/puck'
import type { MethodPlan } from '../../solve/solverKit'
import type { Cube, PuckMove, PuckSteps } from '../../core/types'
import { once } from '../../solve/once'

/**
 * Hockey Puck, "isolate, then permute" (the 2-Star Prism's way, starPrism.ts),
 * with the puck's own K (no page teaches this puzzle's two-layer form):
 *
 *   1. Isolate   the numbered pieces on top, the plain ones below, by short
 *                searches on where the numbered ones are
 *   2. Bottom    its colors in order, by swaps: K = / B / 1-B / -1 / swaps
 *                the two top pieces either side of the slash's line, and
 *                the two bottom ones; its kin (`SWAPS`) swap two pieces d
 *                slots apart on each layer,
 *                and turns of the layers before and after bring any two
 *                slots there
 *   3. Top       its numbers in order, by 3-cycles: two swaps of the same
 *                bottom pair (which comes back), a, a + d and a + 2d on top
 *   4. Align     the top turned so each pair sits on its color
 *
 * Worked on the slots alone: a number per slot, or a color pair below.
 */

/** Slots 0 to 11 on top, 12 to 23 below: a top piece's number, or 100 +
 *  its pair for a plain one. */
type Slots = number[]
const PLAIN = 100

function slotsOf(cube: Cube): Slots {
  const slots: Slots = []
  for (const c of cube) {
    const place = puckPlace(c.position)
    if (!place) continue
    slots[place.z > 0 ? place.m : 12 + place.m] =
      puckNumber(c) ?? PLAIN + PUCK_COLORS.indexOf(c.stickers[0]!.color)
  }
  return slots
}

const mod = (a: number, n: number) => ((a % n) + n) % n

function apply(slots: readonly number[], move: PuckMove): Slots {
  const out = [...slots]
  if ('flip' in move) {
    for (let m = 0; m <= 5; m++) {
      out[5 - m] = slots[12 + m]!
      out[12 + 5 - m] = slots[m]!
    }
  } else {
    const base = move.layer === 'U' ? 0 : 12
    for (let m = 0; m < 12; m++) out[base + mod(m + move.steps, 12)] = slots[base + m]!
  }
  return out
}
const play = (slots: readonly number[], moves: readonly PuckMove[]): Slots =>
  moves.reduce<Slots>(apply, [...slots])

const turn = (layer: 'U' | 'D', k: number): PuckMove[] =>
  mod(k, 12) ? [{ layer, steps: mod(k, 12) as PuckSteps }] : []
const FLIP: PuckMove = { flip: true }

/** / (a, b) / (c, d) / (e, f) /: top turned a, bottom b, and so on. */
const slashes = (...k: readonly number[]): PuckMove[] => [
  FLIP,
  ...turn('U', k[0]!),
  ...turn('D', k[1]!),
  FLIP,
  ...turn('U', k[2]!),
  ...turn('D', k[3]!),
  FLIP,
  ...turn('U', k[4]!),
  ...turn('D', k[5]!),
  FLIP,
]

/** K and its kin, by the distance d (1 to 6) between the two pieces they
 *  swap on each layer, all else in place: / dB / 1-B / -1 (1-d)B /, K
 *  itself d = 1 (found by trying every turn between four slashes; their
 *  effects are asserted in tests/unit/puzzles/round/puck.test.ts). */
export const SWAPS: readonly PuckMove[][] = [1, 2, 3, 4, 5, 6].map((d) =>
  slashes(0, d, 1, 11, 11, mod(1 - d, 12)),
)

const ID = Array.from({ length: 24 }, (_, i) => i)

/** A swap's moves and the slots it swaps on each layer. */
interface Swap {
  readonly moves: PuckMove[]
  readonly top: readonly number[]
  readonly bottom: readonly number[]
}

/** Every swap: each of `SWAPS` with turns of both layers around it. */
const allSwaps = once((): Swap[] =>
  SWAPS.flatMap((swap) =>
    Array.from({ length: 144 }, (_, i): Swap => {
      const [u, v] = [Math.floor(i / 12), i % 12]
      const moves = [...turn('U', -u), ...turn('D', -v), ...swap, ...turn('U', u), ...turn('D', v)]
      const after = play(ID, moves)
      const moved = after.flatMap((p, k) => (p !== k ? [k] : []))
      // Each layer's two pieces swapped within it.
      if (moved.some((k) => after[k]! < 12 !== k < 12))
        throw new Error('puck: a swap crosses layers')
      return { moves, top: moved.filter((k) => k < 12), bottom: moved.filter((k) => k >= 12) }
    }),
  ),
)

const has = (pair: readonly number[], a: number, b: number) =>
  pair.length === 2 && pair.includes(a) && pair.includes(b)

const numberedOnTop = (slots: Slots) => slots.slice(0, 12).filter((p) => p < PLAIN).length

/** 1: the numbered pieces on top, one more at a time. A search on where
 *  the numbered ones are, each step the two layers turned then the slash
 *  (only the slash changes which are on top). */
function isolate(cube: Cube): PuckMove[] {
  const steps = Array.from({ length: 144 }, (_, i) => [
    ...turn('U', Math.floor(i / 12)),
    ...turn('D', i % 12),
    FLIP,
  ])
  const mask = (s: Slots) => s.map((p) => (p < PLAIN ? 1 : 0)).join('')
  let slots = slotsOf(cube)
  const all: PuckMove[] = []
  for (let guard = 0; numberedOnTop(slots) < 12; guard++) {
    if (guard > 12) throw new Error('puck: cannot isolate')
    const want = numberedOnTop(slots) + 1
    const seen = new Map<string, { from: string; step: PuckMove[] } | null>([[mask(slots), null]])
    let frontier = [slots]
    let found: Slots | undefined
    for (let depth = 0; depth < 4 && !found && frontier.length; depth++) {
      const next: Slots[] = []
      for (const s of frontier) {
        for (const step of steps) {
          const n = play(s, step)
          const k = mask(n)
          if (seen.has(k)) continue
          seen.set(k, { from: mask(s), step })
          if (numberedOnTop(n) >= want) found ??= n
          next.push(n)
        }
        if (found) break
      }
      frontier = next
    }
    if (!found) throw new Error('puck: cannot isolate')
    const path: PuckMove[] = []
    for (let k = mask(found); seen.get(k); k = seen.get(k)!.from) path.unshift(...seen.get(k)!.step)
    // The turns before a slash only matter for it: once isolated, the last
    // step's are kept (the next steps turn as they like).
    slots = play(slots, path)
    all.push(...path)
  }
  return all
}

const isolated = (cube: Cube) => numberedOnTop(slotsOf(cube)) === 12

/** 2: the bottom's colors in order, slot after slot, by swaps. */
function sortBottom(cube: Cube): PuckMove[] {
  let slots = slotsOf(cube)
  const all: PuckMove[] = []
  for (let i = 0; i < 12; i++) {
    const want = PLAIN + (i >> 1)
    if (slots[12 + i] === want) continue
    const j = slots.findIndex((p, k) => k > 12 + i && p === want)
    const swap = allSwaps().find((s) => has(s.bottom, 12 + i, j))!
    slots = play(slots, swap.moves)
    all.push(...swap.moves)
  }
  return all
}

const bottomDone = (cube: Cube) => {
  const slots = slotsOf(cube)
  return numberedOnTop(slots) === 12 && slots.slice(12).every((p, i) => p === PLAIN + (i >> 1))
}

/** The 3-cycles on top: two swaps of one bottom pair, a, a + d, a + 2d. */
let CYCLES: { moves: PuckMove[]; to: number[] }[] | undefined
function topCycles() {
  if (CYCLES) return CYCLES
  // Both swaps on one bottom pair, as far apart as the top ones.
  const swapOf = (a: number, b: number, d: number) =>
    allSwaps().find((s) => has(s.top, a, b) && has(s.bottom, 12, 12 + d))
  CYCLES = []
  for (let a = 0; a < 12; a++) {
    for (let d = 1; d <= 5; d++) {
      for (const [x, y, z] of [
        [a, a + d, a + 2 * d],
        [a + 2 * d, a + d, a],
      ]) {
        const first = swapOf(mod(x!, 12), mod(y!, 12), d)
        const second = swapOf(mod(y!, 12), mod(z!, 12), d)
        if (!first || !second) continue
        const moves = [...first.moves, ...second.moves]
        CYCLES.push({ moves, to: play(ID, moves) })
      }
    }
  }
  return CYCLES
}

/** 3: the top's numbers in order (its turn free), slot after slot, each
 *  piece brought by 3-cycles that leave the placed ones alone. */
function sortTop(cube: Cube): PuckMove[] {
  let slots = slotsOf(cube)
  const top = () => slots.slice(0, 12)
  // The turn aimed at: one 3-cycles can reach (an even permutation away).
  const even = (r: number) => {
    const to = top().map((p) => mod(p - 1 - r, 12))
    const seen = new Set<number>()
    let swaps = 0
    to.forEach((_, start) => {
      let length = 0
      for (let k = start; !seen.has(k); k = to[k]!) {
        seen.add(k)
        length++
      }
      if (length) swaps += length - 1
    })
    return swaps % 2 === 0
  }
  const r = Array.from({ length: 12 }, (_, k) => k).find(even)!
  const want = (m: number) => mod(m + r, 12) + 1
  const all: PuckMove[] = []
  for (let i = 0; i < 12; i++) {
    if (slots[i] === want(i)) continue
    // The fewest 3-cycles, touching none of the slots already placed,
    // bringing the wanted piece to slot i.
    const free = topCycles().filter((c) =>
      c.to.every((p, k) => p === k || k >= 12 || (k >= i && p >= i)),
    )
    const start = slots.indexOf(want(i))
    const back = new Map<number, { from: number; cycle: (typeof free)[number] } | null>([
      [start, null],
    ])
    let frontier = [start]
    while (!back.has(i) && frontier.length) {
      const next: number[] = []
      for (const at of frontier) {
        for (const cycle of free) {
          const to = cycle.to.indexOf(at)
          if (back.has(to)) continue
          back.set(to, { from: at, cycle })
          next.push(to)
        }
      }
      frontier = next
    }
    if (!back.has(i)) throw new Error('puck: top left unsorted')
    const path: PuckMove[] = []
    for (let k = i; back.get(k); k = back.get(k)!.from) path.unshift(...back.get(k)!.cycle.moves)
    slots = play(slots, path)
    all.push(...path)
  }
  return all
}

const topDone = (cube: Cube) => {
  const top = slotsOf(cube).slice(0, 12)
  return bottomDone(cube) && top.every((p, m) => mod(p - top[0]!, 12) === m)
}

/** 4: the top turned onto the bottom's colors. */
const align = (cube: Cube): PuckMove[] => turn('U', -slotsOf(cube).indexOf(1))

const ALL = allTurnsOf('puck')

export const PUCK_PLAN: MethodPlan = [
  { key: 'stepPuckIsolate', goal: isolated, moves: ALL, phases: [isolate] },
  { key: 'stepPuckBottom', goal: bottomDone, moves: ALL, phases: [sortBottom] },
  { key: 'stepPuckTop', goal: topDone, moves: ALL, phases: [sortTop] },
  { key: 'stepPuckAlign', goal: puckSolved, moves: ALL, phases: [align] },
]
