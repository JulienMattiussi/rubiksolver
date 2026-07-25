import { cubeOrientations, normalIndex, solvedCube, stickersTotal } from './cube'
import type { Color, Cube, CubeSize, Cubie, Vec3 } from './types'

/**
 * Constraint-guided cube editor logic (pure, no React / three.js).
 *
 * The user paints sticker colors onto the fixed slots. To make it impossible
 * to enter an inconsistent piece, we precompute - from the 24 orientations of
 * a solved cube - every valid (normal -> color) placement a real piece can
 * take at each corner/edge slot. A paint is only accepted if the slot's
 * painted stickers still match some available placement, and when a placement
 * becomes the only option its remaining stickers auto-complete.
 *
 * Slots and placements are derived per cube size from that size's solved cube
 * (memoized in `tablesFor`), so every entry point takes the size alongside the
 * edit state.
 *
 * This guarantees valid, unique pieces during entry. Global solvability
 * (parity) is checked separately, see validate.ts.
 */

const posKey = (p: Vec3): string => p.join(',')
const stickerId = (p: Vec3, ni: number): string => `${posKey(p)}:${ni}`

type SlotKind = 'corner' | 'edge' | 'center' | 'core'

interface SlotSticker {
  readonly ni: number
  readonly normal: Vec3
  readonly id: string
  readonly solvedColor: Color
}

export interface Slot {
  readonly key: string
  readonly position: Vec3
  readonly kind: SlotKind
  readonly stickers: readonly SlotSticker[]
}

function kindOf(stickerCount: number): SlotKind {
  return stickerCount === 3
    ? 'corner'
    : stickerCount === 2
      ? 'edge'
      : stickerCount === 1
        ? 'center'
        : 'core'
}

/** A cubie of a solved cube as a slot (fixed position + exterior normals). */
function toSlot(cubie: Cubie): Slot {
  return {
    key: posKey(cubie.position),
    position: cubie.position,
    kind: kindOf(cubie.stickers.length),
    stickers: cubie.stickers.map((s) => ({
      ni: normalIndex(s.normal),
      normal: s.normal,
      id: stickerId(cubie.position, normalIndex(s.normal)),
      solvedColor: s.color,
    })),
  }
}

/** A placement maps each of a slot's normal indices to a color. */
type Placement = Record<number, Color>

interface SlotTables {
  readonly slots: readonly Slot[]
  /** Paintable slots (corners and edges). */
  readonly pieceSlots: readonly Slot[]
  readonly byKey: ReadonlyMap<string, Slot>
  /** Valid piece placements per slot key, from the 24 solved orientations. */
  readonly placements: ReadonlyMap<string, readonly Placement[]>
}

const TABLES = new Map<CubeSize, SlotTables>()

/** Slot + placement tables of a cube size, derived from its solved cube. */
function tablesFor(size: CubeSize): SlotTables {
  let tables = TABLES.get(size)
  if (!tables) {
    const slots = solvedCube(size).map(toSlot)
    const pieceSlots = slots.filter((s) => s.kind === 'corner' || s.kind === 'edge')
    tables = {
      slots,
      pieceSlots,
      byKey: new Map(slots.map((s) => [s.key, s])),
      placements: computePlacements(size, pieceSlots),
    }
    TABLES.set(size, tables)
  }
  return tables
}

/** The slots a cube of `size` exposes to the editor. */
export function slotsFor(size: CubeSize): readonly Slot[] {
  return tablesFor(size).slots
}

function placementKey(p: Placement): string {
  return Object.keys(p)
    .map(Number)
    .sort((a, b) => a - b)
    .map((ni) => ni + p[ni]!)
    .join('')
}

/** For each corner/edge slot, all valid piece placements (from the 24 orientations). */
function computePlacements(size: CubeSize, pieceSlots: readonly Slot[]): Map<string, Placement[]> {
  const perSlot = new Map<string, Map<string, Placement>>()
  for (const slot of pieceSlots) perSlot.set(slot.key, new Map())
  for (const cube of cubeOrientations(solvedCube(size))) {
    for (const cubie of cube) {
      const bucket = perSlot.get(posKey(cubie.position))
      if (!bucket) continue // center / core
      const placement: Placement = {}
      for (const s of cubie.stickers) placement[normalIndex(s.normal)] = s.color
      bucket.set(placementKey(placement), placement)
    }
  }
  return new Map([...perSlot].map(([k, m]) => [k, [...m.values()]]))
}

/** Painted stickers, keyed by sticker id. Absent id = not yet painted. */
export type EditStickers = Record<string, Color>

/** A blank slate: only the fixed centers are set (a 2x2 has none). */
export function emptyEdit(size: CubeSize): EditStickers {
  const edit: EditStickers = {}
  for (const slot of slotsFor(size)) {
    if (slot.kind === 'center') edit[slot.stickers[0]!.id] = slot.stickers[0]!.solvedColor
  }
  return edit
}

/** Extract a paintable state from an existing cube (e.g. the current one). */
export function cubeToEdit(cube: Cube): EditStickers {
  const edit: EditStickers = {}
  for (const cubie of cube) {
    for (const s of cubie.stickers) edit[stickerId(cubie.position, normalIndex(s.normal))] = s.color
  }
  return edit
}

/** Count of each color currently painted (centers included). */
export function colorCounts(edit: EditStickers): Record<Color, number> {
  const counts: Record<Color, number> = { W: 0, Y: 0, G: 0, B: 0, O: 0, R: 0 }
  for (const color of Object.values(edit)) counts[color]++
  return counts
}

/** Number of painted stickers (out of `stickersTotal`). */
export function filledCount(edit: EditStickers): number {
  return Object.keys(edit).length
}

export function isComplete(edit: EditStickers, size: CubeSize): boolean {
  return filledCount(edit) === stickersTotal(size)
}

/** Painted colors of a slot, as a normal-index -> color map. */
function paintedOf(edit: EditStickers, slot: Slot): Placement {
  const out: Placement = {}
  for (const s of slot.stickers) {
    const color = edit[s.id]
    if (color) out[s.ni] = color
  }
  return out
}

/** Color-sets of every fully painted piece slot other than `exceptKey`. */
function committedColorSets(
  edit: EditStickers,
  pieceSlots: readonly Slot[],
  exceptKey: string,
): Set<string> {
  const sets = new Set<string>()
  for (const slot of pieceSlots) {
    if (slot.key === exceptKey) continue
    const painted = paintedOf(edit, slot)
    if (Object.keys(painted).length !== slot.stickers.length) continue
    sets.add(colorSetKey(Object.values(painted)))
  }
  return sets
}

function colorSetKey(colors: Color[]): string {
  return [...colors].sort().join('')
}

/** Placements of a slot matching its painted stickers and not already used. */
function candidates(
  edit: EditStickers,
  tables: SlotTables,
  slot: Slot,
  painted: Placement,
): readonly Placement[] {
  const committed = committedColorSets(edit, tables.pieceSlots, slot.key)
  return (tables.placements.get(slot.key) ?? []).filter((placement) => {
    for (const ni of Object.keys(painted).map(Number)) {
      if (placement[ni] !== painted[ni]) return false
    }
    return !committed.has(colorSetKey(Object.values(placement)))
  })
}

/**
 * Paint `color` on sticker (`slotKey`, `ni`). Returns the next state, or the
 * same reference if the paint is impossible. A conflicting paint restarts the
 * piece with just this sticker; a determined piece auto-completes.
 */
export function paint(
  edit: EditStickers,
  size: CubeSize,
  slotKey: string,
  ni: number,
  color: Color,
): EditStickers {
  const tables = tablesFor(size)
  const slot = tables.byKey.get(slotKey)
  if (!slot || slot.kind === 'center' || slot.kind === 'core') return edit
  const id = stickerId(slot.position, ni)
  if (edit[id] === color) return edit

  const tryPlace = (base: EditStickers): EditStickers | null => {
    const next = { ...base, [id]: color }
    const painted = paintedOf(next, slot)
    const matches = candidates(next, tables, slot, painted)
    if (matches.length === 0) return null
    if (matches.length === 1) {
      for (const s of slot.stickers) next[s.id] = matches[0]![s.ni]!
    }
    return next
  }

  // Try adding to the current piece; if inconsistent, restart the piece.
  const added = tryPlace(edit)
  if (added) return added

  const cleared = { ...edit }
  for (const s of slot.stickers) delete cleared[s.id]
  return tryPlace(cleared) ?? edit
}

/** Clear a piece slot's stickers (centers are untouched). */
export function clearSlot(edit: EditStickers, size: CubeSize, slotKey: string): EditStickers {
  const slot = tablesFor(size).byKey.get(slotKey)
  if (!slot || (slot.kind !== 'corner' && slot.kind !== 'edge')) return edit
  const next = { ...edit }
  for (const s of slot.stickers) delete next[s.id]
  return next
}

/** Build a full Cube from a complete edit state (throws if incomplete). */
export function buildCube(edit: EditStickers, size: CubeSize): Cube {
  return slotsFor(size).map((slot) => ({
    position: slot.position,
    stickers: slot.stickers.map((s) => {
      const color = edit[s.id]
      if (!color) throw new Error(`Missing sticker ${s.id}`)
      return { normal: s.normal, color }
    }),
  }))
}
