import { cubeSize, normalIndex, stickersTotal } from './cube'
import {
  centersArePaintable,
  paintableKind,
  stickerId,
  tablesFor,
  type Placement,
  type PlacementOption,
  type Slot,
  type SlotTables,
} from './editorTables'
import type { Color, Cube, CubeSize } from './types'

/**
 * Constraint-guided cube editor logic (pure, no React / three.js).
 *
 * The user paints sticker colors onto the fixed slots. To make it impossible
 * to enter an inconsistent piece, we precompute - from the 24 orientations of
 * a solved cube - every valid (normal -> color) placement a real piece can
 * take at each paintable slot (see editorTables.ts). A paint is only accepted
 * if the slot's painted stickers still match some available placement, and
 * when a placement becomes the only option its remaining stickers
 * auto-complete.
 *
 * Each placement carries the identity of the physical piece it corresponds to
 * (corners and edges are unique; the two wings of a 4x4 color pair are told
 * apart by their chirality, which the placements encode; same-color centers
 * share one identity with a budget of four). A placement stays available only
 * while its piece has budget left, so no duplicate piece can ever be entered.
 * On a 3x3 the centers are fixed and pre-filled; on even sizes they move, so
 * their slots are paintable like any piece.
 *
 * This guarantees valid pieces during entry. Global solvability (parity) is
 * checked separately, see validate.ts.
 */

/** The slots a cube of `size` exposes to the editor. */
export function slotsFor(size: CubeSize): readonly Slot[] {
  return tablesFor(size).slots
}

/** Whether the user can paint this slot on a cube of `size`. */
export function canPaint(size: CubeSize, slotKey: string): boolean {
  const slot = tablesFor(size).byKey.get(slotKey)
  return slot !== undefined && paintableKind(size, slot.kind)
}

/** Painted stickers, keyed by sticker id. Absent id = not yet painted. */
export type EditStickers = Record<string, Color>

/** A blank slate: only the fixed centers are set (movable ones stay empty). */
export function emptyEdit(size: CubeSize): EditStickers {
  const edit: EditStickers = {}
  for (const slot of slotsFor(size)) {
    if (slot.kind === 'center' && !centersArePaintable(size)) {
      edit[slot.stickers[0]!.id] = slot.stickers[0]!.solvedColor
    }
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

/** The unique placement option a fully painted slot shows, if any. */
function optionOf(tables: SlotTables, slot: Slot, painted: Placement): PlacementOption | undefined {
  return (tables.placements.get(slot.key) ?? []).find((option) =>
    slot.stickers.every((s) => option.colors[s.ni] === painted[s.ni]),
  )
}

/** Piece usage of every fully painted paintable slot other than `exceptKey`. */
function committedPieceUse(
  edit: EditStickers,
  tables: SlotTables,
  exceptKey: string,
): Map<string, number> {
  const used = new Map<string, number>()
  for (const slot of tables.paintableSlots) {
    if (slot.key === exceptKey) continue
    const painted = paintedOf(edit, slot)
    if (Object.keys(painted).length !== slot.stickers.length) continue
    const option = optionOf(tables, slot, painted)
    if (option) used.set(option.pieceKey, (used.get(option.pieceKey) ?? 0) + 1)
  }
  return used
}

/** Placements of a slot matching its painted stickers, with budget left. */
function candidates(
  edit: EditStickers,
  tables: SlotTables,
  slot: Slot,
  painted: Placement,
): readonly PlacementOption[] {
  const used = committedPieceUse(edit, tables, slot.key)
  return (tables.placements.get(slot.key) ?? []).filter((option) => {
    for (const ni of Object.keys(painted).map(Number)) {
      if (option.colors[ni] !== painted[ni]) return false
    }
    return (used.get(option.pieceKey) ?? 0) < (tables.budgets.get(option.pieceKey) ?? 0)
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
  if (!slot || !paintableKind(size, slot.kind)) return edit
  const id = stickerId(slot.position, ni)
  if (edit[id] === color) return edit

  const tryPlace = (base: EditStickers): EditStickers | null => {
    const next = { ...base, [id]: color }
    const painted = paintedOf(next, slot)
    const matches = candidates(next, tables, slot, painted)
    if (matches.length === 0) return null
    if (matches.length === 1) {
      for (const s of slot.stickers) next[s.id] = matches[0]!.colors[s.ni]!
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

/** Clear a paintable slot's stickers (fixed centers are untouched). */
export function clearSlot(edit: EditStickers, size: CubeSize, slotKey: string): EditStickers {
  const slot = tablesFor(size).byKey.get(slotKey)
  if (!slot || !paintableKind(size, slot.kind)) return edit
  const next = { ...edit }
  for (const s of slot.stickers) delete next[s.id]
  return next
}

/**
 * True when every paintable slot of a complete cube shows a real physical
 * piece and the piece usage matches the budgets exactly (each corner and each
 * wing once, four centers per color). With the color counts already checked,
 * this is the piece-level half of 4x4 solvability (see validate.ts).
 */
export function usesRealPieces(cube: Cube): boolean {
  const tables = tablesFor(cubeSize(cube))
  const edit = cubeToEdit(cube)
  const used = new Map<string, number>()
  for (const slot of tables.paintableSlots) {
    const option = optionOf(tables, slot, paintedOf(edit, slot))
    if (!option) return false
    used.set(option.pieceKey, (used.get(option.pieceKey) ?? 0) + 1)
  }
  for (const [key, count] of used) {
    if (count > (tables.budgets.get(key) ?? 0)) return false
  }
  return true
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
