import type { ToggleSlot, Toggles, TogglesSpec } from '../entry'

/**
 * Entry by toggles (a model's `toggles` step, or its paint's own): clicks
 * turning something round, a key at a time, its mates with it: a
 * RoadBlock-I's bars (a face's lie a quarter off, or not), a Gear Cube's
 * gears' pivots (a sixth, a third), a Z-Twist's side centers (a quarter).
 * The model says which slot a click turns (`keyAt`), how many ways round
 * it goes, and what turns with it; the state it builds reads them back
 * (`EntryMarks.toggles`).
 */

/** The keys turning when `key` does: itself, then its mates. */
const turning = (spec: TogglesSpec, key: string): readonly string[] => [
  key,
  ...(spec.mates?.(key) ?? []).filter((k) => k !== key),
]

/** A key clicked: it and its mates the next way round. */
export function nextToggle(toggles: Toggles, spec: TogglesSpec, key: string): Toggles {
  const to = ((toggles[key] ?? 0) + 1) % spec.ways
  const next: Record<string, number> = { ...toggles }
  for (const k of turning(spec, key)) {
    if (to) next[k] = to
    else delete next[k]
  }
  return next
}

/** The keys turned at all (a two-way toggle's: those on). */
export const turnedKeys = (toggles: Toggles): string[] =>
  Object.keys(toggles).filter((k) => toggles[k])

/** The slots lit up while the pointer is on one: every slot whose key
 *  turns with its own. */
export function litSlots(
  spec: TogglesSpec,
  slots: readonly ToggleSlot[],
  hovered: string | undefined,
): string[] {
  const at = hovered && slots.find((s) => s.key === hovered)
  const key = at && spec.keyAt(at)
  if (!key) return []
  const keys = new Set(turning(spec, key))
  return slots.filter((s) => keys.has(spec.keyAt(s) ?? '')).map((s) => s.key)
}

/** Keys as a toggles map, each one way round (a state's turned slots). */
export const togglesOfKeys = (keys: readonly string[]): Toggles =>
  Object.fromEntries(keys.map((k) => [k, 1]))
