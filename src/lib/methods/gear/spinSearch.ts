import { applyMoves } from '../../core/turn'
import type { Cube, Cubie, Turn } from '../../core/types'

/**
 * Gears spun home by formulas that only spin them (the Gear Cube Extreme's
 * last step, gearExtreme.ts): each formula seen and set up a way is a
 * conjugate, bringing gears into a slice, spinning them, and taking them
 * back, so all it does is add a few sixths of a turn to the gear at some
 * slots, whatever the state (tested). Played once on the solved puzzle, it
 * is noted as that: eight numbers. The search then runs on the gears'
 * spins alone, a formula an addition, instead of playing out its dozens of
 * moves on every try.
 */

/** A gear's slot: where it stands. */
const at = (c: Cubie) => c.position.join()

/** What a formula does to the gears, slot by slot (`slots`): the sixths
 *  of a turn it adds; null if it moves a gear off its slot. */
export function spinEffect(
  solved: Cube,
  slots: readonly string[],
  formula: readonly Turn[],
): number[] | null {
  const after = applyMoves(solved, formula)
  const effect: number[] = []
  for (const slot of slots) {
    const before = solved.find((c) => at(c) === slot)!
    const now = after.find((c) => at(c) === slot)!
    // The same gear back in its slot: its stickers the same colors.
    const same = (c: Cubie) =>
      c.stickers
        .map((s) => s.color)
        .sort()
        .join()
    if (same(before) !== same(now)) return null
    effect.push(((((now.spin ?? 0) - (before.spin ?? 0)) % 6) + 6) % 6)
  }
  return effect
}

/** The formulas' distinct effects (`spinEffect`), the first formula of
 *  each kept; none that moves a gear, nor that does nothing. */
export function spinMacros(
  solved: Cube,
  slots: readonly string[],
  formulas: readonly (readonly Turn[])[],
): { effect: number[]; formula: readonly Turn[] }[] {
  const seen = new Set<string>()
  return formulas.flatMap((formula) => {
    const effect = spinEffect(solved, slots, formula)
    if (!effect || effect.every((v) => v === 0)) return []
    const key = effect.join()
    if (seen.has(key)) return []
    seen.add(key)
    return [{ effect, formula }]
  })
}

/**
 * The fewest formulas (`macros`) bringing every gear's spin to none, the
 * gears standing in `slots`; a breadth-first search on the spins alone
 * (6 to the power of the slots, 1.7 million states for eight gears).
 * Throws if none does: an impossible puzzle.
 */
export function spinsHome(
  cube: Cube,
  slots: readonly string[],
  macros: readonly { effect: number[]; formula: readonly Turn[] }[],
): Turn[] {
  const n = slots.length
  const size = 6 ** n
  const spins = slots.map((slot) => (((cube.find((c) => at(c) === slot)?.spin ?? 0) % 6) + 6) % 6)
  const code = (digits: readonly number[]) => digits.reduce((acc, d) => acc * 6 + d, 0)
  const digitsOf = (k: number) => {
    const out = new Array<number>(n)
    for (let i = n - 1; i >= 0; i--) {
      out[i] = k % 6
      k = Math.floor(k / 6)
    }
    return out
  }
  const start = code(spins)
  if (start === 0) return []
  // Where each state was reached from, and by which formula.
  const from = new Int32Array(size).fill(-1)
  const by = new Int16Array(size)
  from[start] = start
  let frontier = [start]
  while (frontier.length) {
    const next: number[] = []
    for (const state of frontier) {
      const digits = digitsOf(state)
      for (let m = 0; m < macros.length; m++) {
        const effect = macros[m]!.effect
        const to = code(digits.map((d, i) => (d + effect[i]!) % 6))
        if (from[to]! >= 0) continue
        from[to] = state
        by[to] = m
        if (to === 0) {
          const path: Turn[][] = []
          for (let k = 0; k !== start; k = from[k]!) path.unshift([...macros[by[k]!]!.formula])
          return path.flat()
        }
        next.push(to)
      }
    }
    frontier = next
  }
  throw new Error('gear: no formula spins the gears home (an impossible puzzle)')
}
