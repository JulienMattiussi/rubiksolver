import { stickerId, tablesFor } from '../../editor/editorTables'
import { withFixedHome } from '../../editor/edit'
import type { EditStickers, EntryMarks, Parts, PartsSpec, TogglesSpec } from '../../editor/entry'
import { gearAt, shownSpin, withEnteredGears } from './gear'
import { normalIndex, parseVecKey } from '../../core/geometry'
import { type Color, type Cube } from '../../core/types'
import { hasColoredClips, type CubeShape } from '../../core/shapes'

/**
 * How a Gear Cube is entered (lib/editor/entry.ts): its gears' pivots
 * first, a click a sixth on (`toggles`), then its colors; on the Ultimate
 * and the Extreme, its gears painted apart from their clips (`parts`), by
 * the same sticker ids: the gear's color on that face. A gear carries its
 * clips' pair of colors, either their way or turned over on them (see
 * gear.ts), so once that pair is known, one face of the gear tells the
 * other. Read when called: the editor's modules load after the models.
 */

/** The edge slots that hold gears (not the Extreme's middle ones). */
const edgeSlots = (shape: CubeShape) =>
  tablesFor(shape).slots.filter((s) => s.kind === 'edge' && gearAt(shape, s.position))

/** The clips' pair of an edge slot, once both are painted. */
function clipPair(edit: EditStickers, ids: readonly string[]): readonly Color[] | null {
  const pair = ids.map((id) => edit[id])
  return pair.every((c) => c !== undefined) ? (pair as Color[]) : null
}

/** Each gear one face of which is painted, and its clips' pair known: its
 *  other face, the pair's other color. */
function completeGears(gear: Parts, edit: EditStickers, shape: CubeShape): Parts {
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

/** The gears painted apart from their clips (the Ultimate's, the Extreme's). */
const gearParts = (shape: CubeShape): PartsSpec => ({
  // With its clips painted, a color not theirs is refused, and the gear's
  // other face follows.
  paint: (gear, edit, slotKey, ni, color) => {
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
  },
  complete: (gear, edit) => completeGears(gear, edit, shape),
  // A face's four gears each show it once.
  count: (gear) => {
    const slots = edgeSlots(shape)
    const remaining: Partial<Record<Color, number>> = {}
    for (const slot of slots) {
      for (const s of slot.stickers) remaining[s.solvedColor] = (remaining[s.solvedColor] ?? 0) + 1
    }
    const painted = Object.values(gear)
    for (const color of painted) remaining[color] = (remaining[color] ?? 0) - 1
    return {
      remaining,
      painted: painted.length,
      total: slots.length * 2,
      done: slots.filter((s) => s.stickers.every((st) => gear[st.id])).length,
      pieces: slots.length,
    }
  },
  // Its clips' colors, the other way round where the gear is turned over
  // (half a turn or more of spin), held as the editor holds it.
  of: (cube) => {
    const gear: Record<string, Color> = {}
    for (const c of withFixedHome(cube)) {
      if (c.spin === undefined) continue
      c.stickers.forEach((s, i) => {
        const shown = c.spin! >= 3 ? c.stickers[1 - i]! : s
        gear[stickerId(c.position, normalIndex(s.normal))] = shown.color
      })
    }
    return gear
  },
})

/** The gears' pivots: a click a sixth on, its slice's four with it on a
 *  Gear Cube or an Ultimate (`wholeSlices`), each on its own on the
 *  Extreme. */
const pivots = (shape: CubeShape, wholeSlices: boolean): TogglesSpec => ({
  name: 'gears',
  keyAt: (slot) => (slot.stickers === 2 && gearAt(shape, slot.position) ? slot.key : null),
  ways: 3,
  mates: (key) => {
    if (!wholeSlices) return [key]
    const axis = parseVecKey(key).findIndex((v) => v === 0)
    return edgeSlots(shape)
      .filter((s) => s.position[axis] === 0)
      .map((s) => s.key)
  },
  // Each as it shows (`shownSpin`), held as the editor holds it.
  of: (cube) => {
    const spins: Record<string, number> = {}
    for (const c of withFixedHome(cube)) {
      if (c.spin !== undefined && shownSpin(c.spin)) spins[c.position.join(',')] = shownSpin(c.spin)
    }
    return spins
  },
})

/** The edges whose gear stands turned over on its clips, by slot; null when
 *  a gear is not its clips' pair, either way. */
function turnedOf(cube: Cube, gear: Parts, shape: CubeShape): string[] | null {
  const colorAt = new Map(
    cube.flatMap((c) =>
      c.stickers.map((s) => [stickerId(c.position, normalIndex(s.normal)), s.color] as const),
    ),
  )
  const turned: string[] = []
  for (const slot of edgeSlots(shape)) {
    const [a, b] = slot.stickers.map((s) => s.id) as [string, string]
    if (gear[a] === colorAt.get(a) && gear[b] === colorAt.get(b)) continue
    if (gear[a] === colorAt.get(b) && gear[b] === colorAt.get(a)) turned.push(slot.key)
    else return null
  }
  return turned
}

/** A Gear Cube's entry: its pivots, then its colors (its gears apart, when
 *  its clips bear colors), the state built with both. */
export function gearEntry(shape: CubeShape, wholeSlices: boolean) {
  const clips = hasColoredClips(shape)
  return {
    steps: () => [{ kind: 'toggles' as const, toggles: pivots(shape, wholeSlices) }],
    paint: { by: 'colors' as const, ...(clips && { parts: gearParts(shape) }) },
    built: (cube: Cube, { toggles, parts }: EntryMarks): Cube | null => {
      const turned = clips ? turnedOf(cube, parts, shape) : []
      return turned && withEnteredGears(cube, shape, turned, toggles)
    },
  }
}
