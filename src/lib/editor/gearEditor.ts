import { stickerId, tablesFor } from './editorTables'
import { withFixedHome, type EditStickers } from './editor'
import { gearAt, shownSpin } from '../puzzles/gear/gear'
import { normalIndex, parseVecKey } from '../core/geometry'
import type { Color, Cube, CubeShape } from '../core/types'

/**
 * Entering a Gear Cube: its edges' gears are painted apart from their clips
 * (the stickers), by the same sticker ids: the gear's color on that face.
 * A gear carries its clips' pair of colors, either their way or turned over
 * on them (see gear.ts), so once that pair is known, one face of the gear
 * tells the other.
 */
export type GearColors = Readonly<Record<string, Color>>

/** The gears' pivots, entered before the colors: each one's as it shows
 *  (`shownSpin`: 0, 1 or 2 sixths of a turn), by slot; none for 0. */
export type Spins = Readonly<Record<string, number>>

/** The edge slots that hold gears (not the Extreme's middle ones). */
const edgeSlots = (shape: CubeShape) =>
  tablesFor(shape).slots.filter((s) => s.kind === 'edge' && gearAt(shape, s.position))

/** The clips' pair of an edge slot, once both are painted. */
function clipPair(edit: EditStickers, ids: readonly string[]): readonly Color[] | null {
  const pair = ids.map((id) => edit[id])
  return pair.every((c) => c !== undefined) ? (pair as Color[]) : null
}

/** Paint a face of a gear. With its clips painted, a color not theirs is
 *  refused, and the gear's other face follows. */
export function paintGear(
  gear: GearColors,
  edit: EditStickers,
  shape: CubeShape,
  slotKey: string,
  ni: number,
  color: Color,
): GearColors {
  const slot = tablesFor(shape).byKey.get(slotKey)
  const here = slot?.stickers.find((s) => s.ni === ni)
  if (!slot || !here) return gear
  const pair = clipPair(
    edit,
    slot.stickers.map((s) => s.id),
  )
  if (pair && !pair.includes(color)) return gear
  const next: Record<string, Color> = { ...gear, [here.id]: color }
  const there = slot.stickers.find((s) => s.ni !== ni)!
  if (next[there.id] === color) delete next[there.id]
  return completeGears(next, edit, shape)
}

/** Each gear one face of which is painted, and its clips' pair known: its
 *  other face, the pair's other color. */
export function completeGears(gear: GearColors, edit: EditStickers, shape: CubeShape): GearColors {
  const next: Record<string, Color> = { ...gear }
  for (const slot of edgeSlots(shape)) {
    const [a, b] = slot.stickers.map((s) => s.id) as [string, string]
    const pair = clipPair(edit, [a, b])
    if (!pair) continue
    const other = (c: Color) => (c === pair[0] ? pair[1]! : pair[0]!)
    if (next[a] && !next[b] && pair.includes(next[a])) next[b] = other(next[a])
    if (next[b] && !next[a] && pair.includes(next[b])) next[a] = other(next[b])
  }
  return next
}

/** The gear faces left to paint in each color (a face's four gears each
 *  show it once), and how many are painted, of all. */
export function gearFaces(
  gear: GearColors,
  shape: CubeShape,
): {
  remaining: Partial<Record<Color, number>>
  painted: number
  total: number
} {
  const slots = edgeSlots(shape)
  const remaining: Partial<Record<Color, number>> = {}
  for (const slot of slots) {
    for (const s of slot.stickers) remaining[s.solvedColor] = (remaining[s.solvedColor] ?? 0) + 1
  }
  const painted = Object.values(gear)
  for (const color of painted) remaining[color] = (remaining[color] ?? 0) - 1
  return { remaining, painted: painted.length, total: slots.length * 2 }
}

/** How many gears are painted, of all. */
export function gearsPainted(
  gear: GearColors,
  shape: CubeShape,
): { painted: number; total: number } {
  const slots = edgeSlots(shape)
  const painted = slots.filter((s) => s.stickers.every((st) => gear[st.id])).length
  return { painted, total: slots.length }
}

/** The edges whose gear stands turned over on its clips, by slot; null when
 *  a gear is not its clips' pair, either way. */
export function turnedOf(gear: GearColors, edit: EditStickers, shape: CubeShape): string[] | null {
  const turned: string[] = []
  for (const slot of edgeSlots(shape)) {
    const [a, b] = slot.stickers.map((s) => s.id) as [string, string]
    if (gear[a] === edit[a] && gear[b] === edit[b]) continue
    if (gear[a] === edit[b] && gear[b] === edit[a]) turned.push(slot.key)
    else return null
  }
  return turned
}

/** The gears pivoting with a gear, by slot (itself among them): a Gear
 *  Cube's or an Ultimate's slice turns its four gears together, so they
 *  always share their pivot; the Extreme's gears each go on their own. */
export function spinMates(shape: CubeShape, slotKey: string): string[] {
  if (shape === 'gearX') return [slotKey]
  const axis = parseVecKey(slotKey).findIndex((v) => v === 0)
  return edgeSlots(shape)
    .filter((s) => s.position[axis] === 0)
    .map((s) => s.key)
}

/** A gear clicked: its pivot a sixth on, its mates' with it (`spinMates`). */
export function nextSpin(spins: Spins, shape: CubeShape, slotKey: string): Spins {
  const mates = spinMates(shape, slotKey)
  const to = ((spins[slotKey] ?? 0) + 1) % 3
  const next: Record<string, number> = { ...spins }
  for (const key of mates) {
    if (to) next[key] = to
    else delete next[key]
  }
  return next
}

/** The gears' pivots of a state, held as the editor holds it. */
export function spinsOf(cube: Cube): Spins {
  const spins: Record<string, number> = {}
  for (const c of withFixedHome(cube)) {
    if (c.spin !== undefined && shownSpin(c.spin)) spins[c.position.join(',')] = shownSpin(c.spin)
  }
  return spins
}

/** The gears of a Gear Cube: its clips' colors, the other way round where
 *  the gear is turned over (half a turn or more of spin). Held as the
 *  editor holds it, its centers home (`cubeToEdit`). */
export function gearColorsOf(cube: Cube): GearColors {
  const gear: Record<string, Color> = {}
  for (const c of withFixedHome(cube)) {
    if (c.spin === undefined) continue
    c.stickers.forEach((s, i) => {
      const shown = c.spin! >= 3 ? c.stickers[1 - i]! : s
      gear[stickerId(c.position, normalIndex(s.normal))] = shown.color
    })
  }
  return gear
}
