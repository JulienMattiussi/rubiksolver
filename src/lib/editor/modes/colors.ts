import { cubeShape, shapeColors } from '../../core/cube'
import {
  stickerId,
  tablesFor,
  type Placement,
  type PlacementOption,
  type Slot,
  type SlotTables,
} from '../editorTables'
import { cubeToEdit, emptyEdit, progress } from '../edit'
import type { EditStickers } from '../entry'
import type { Color, Cube } from '../../core/types'
import type { CubeShape } from '../../core/shapes'

/**
 * Entry by colors (pure, no React / three.js): the stickers painted one by
 * one, guided by what real pieces can show.
 *
 * The user paints sticker colors onto the fixed slots. To make it impossible
 * to enter an inconsistent piece, we precompute - from every orientation of
 * the solved puzzle - every valid (normal -> color) placement a real piece can
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
 * Fixed centers (on their face's axis: the 3x3's, the Domino's) are
 * pre-filled; moving ones (4x4) are paintable like any piece.
 *
 * This guarantees valid pieces during entry. Global solvability (parity) is
 * checked separately, see validate.ts.
 *
 * A shape-shifting puzzle is entered in the form it stands in: every function
 * here takes that `form` (a state of it, see modes/form.ts), the box by
 * default. A puzzle put piece by piece fills the same map of stickers
 * (modes/pieces.ts).
 */

/** The colors to pick from: the shape's, but one its pre-filled stickers
 *  all take (Meffert's Pocket Cube's violet). */
export function paletteColors(shape: CubeShape, form?: Cube): Color[] {
  const { remaining } = progress(emptyEdit(shape, form), shape, form)
  return shapeColors(shape).filter((c) => remaining[c] > 0)
}

/** Whether the user can paint this slot on a cube of `shape`. */
export function canPaint(shape: CubeShape, slotKey: string, form?: Cube): boolean {
  const slot = tablesFor(shape, form).byKey.get(slotKey)
  return slot?.paintable ?? false
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

/** Whether stickers painted at once (a scan's, on a state found) could be
 *  real pieces: no color more often than the puzzle has it, each slot's
 *  painted stickers some piece's, and no piece shown whole more often than
 *  it exists. */
export function realPieces(edit: EditStickers, shape: CubeShape, form?: Cube): boolean {
  const { remaining } = progress(edit, shape, form)
  if (Object.values(remaining).some((n) => n < 0)) return false
  const tables = tablesFor(shape, form)
  const used = new Map<string, number>()
  for (const slot of tables.paintableSlots) {
    const painted = paintedOf(edit, slot)
    const shown = Object.entries(painted)
    if (!shown.length) continue
    const options = (tables.placements.get(slot.key) ?? []).filter((o) =>
      shown.every(([ni, color]) => o.colors[Number(ni)] === color),
    )
    if (!options.length) return false
    const piece = options[0]!.pieceKey
    if (shown.length === slot.stickers.length && options.every((o) => o.pieceKey === piece))
      used.set(piece, (used.get(piece) ?? 0) + 1)
  }
  return [...used].every(([piece, n]) => n <= (tables.budgets.get(piece) ?? 0))
}

/** How many ways of placing the pieces are weighed at most, past which
 *  nothing is completed. */
const MOST_WAYS = 4096

/** Stickers painted at once (a scan's: some on faces never seen) completed
 *  where the pieces tell them: every way of putting the pieces that fit the
 *  slots not yet whole (each piece no more often than it exists, the whole
 *  ones counted) agrees on that sticker's color. */
export function completed(edit: EditStickers, shape: CubeShape, form?: Cube): EditStickers {
  const tables = tablesFor(shape, form)
  const used = new Map<string, number>()
  const open: { slot: Slot; options: readonly PlacementOption[] }[] = []
  for (const slot of tables.paintableSlots) {
    const painted = Object.entries(paintedOf(edit, slot))
    const options = (tables.placements.get(slot.key) ?? []).filter((o) =>
      painted.every(([ni, color]) => o.colors[Number(ni)] === color),
    )
    if (painted.length < slot.stickers.length) open.push({ slot, options })
    else if (options[0]) used.set(options[0].pieceKey, (used.get(options[0].pieceKey) ?? 0) + 1)
  }
  // Each open sticker's colors over every way (undefined: none yet).
  const seen = new Map<string, Set<Color>>()
  let ways = 0
  const place = (k: number, chosen: PlacementOption[]): void => {
    if (ways > MOST_WAYS) return
    if (k === open.length) {
      ways++
      open.forEach(({ slot }, i) => {
        for (const s of slot.stickers) {
          if (edit[s.id]) continue
          const color = chosen[i]!.colors[s.ni]
          if (!seen.has(s.id)) seen.set(s.id, new Set())
          if (color) seen.get(s.id)!.add(color)
        }
      })
      return
    }
    for (const option of open[k]!.options) {
      const n = used.get(option.pieceKey) ?? 0
      if (n >= (tables.budgets.get(option.pieceKey) ?? 0)) continue
      used.set(option.pieceKey, n + 1)
      place(k + 1, [...chosen, option])
      used.set(option.pieceKey, n)
    }
  }
  place(0, [])
  if (!ways || ways > MOST_WAYS) return edit
  const next = { ...edit }
  for (const [id, colors] of seen) if (colors.size === 1) next[id] = [...colors][0]!
  return next
}

/**
 * Paint `color` on sticker (`slotKey`, `ni`). Returns the next state, or the
 * same reference if the paint is impossible. A conflicting paint restarts the
 * piece with just this sticker; a determined piece auto-completes. The last
 * click wins: a piece (or a color) already all used elsewhere is taken back
 * from there, its slot left to paint again (`takeBack`).
 */
export function paint(
  edit: EditStickers,
  shape: CubeShape,
  slotKey: string,
  ni: number,
  color: Color,
  form?: Cube,
  /** Slots a piece is never taken back from (a RoadBlock-I's bar being
   *  painted). */
  keep: ReadonlySet<string> = new Set(),
): EditStickers {
  const tables = tablesFor(shape, form)
  const slot = tables.byKey.get(slotKey)
  if (!slot?.paintable) return edit
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

  // The piece this paint makes with the slot's other stickers, all used
  // elsewhere: taken back from the slot holding it.
  const kept = takeBack(edit, tables, slot, { ...paintedOf(edit, slot), [ni]: color }, keep)
  const keptPlaced = kept && tryPlace(kept)
  if (keptPlaced) return keptPlaced

  // No such piece: the slot restarts with this sticker alone (taken back too
  // if need be).
  const cleared = { ...edit }
  for (const s of slot.stickers) delete cleared[s.id]
  const restarted = tryPlace(cleared)
  if (restarted) return restarted
  const freed = takeBack(cleared, tables, slot, { [ni]: color }, keep)
  return (freed && tryPlace(freed)) ?? edit
}

/**
 * The entry with a slot holding a piece that the stickers `wanted` on
 * `slot` could be cleared, so that piece has budget left (the first such
 * piece, the first slot holding it); undefined when no real piece shows
 * `wanted` there.
 */
function takeBack(
  edit: EditStickers,
  tables: SlotTables,
  slot: Slot,
  wanted: Placement,
  keep: ReadonlySet<string>,
): EditStickers | undefined {
  const option = (tables.placements.get(slot.key) ?? []).find((o) =>
    Object.entries(wanted).every(([ni, color]) => o.colors[Number(ni)] === color),
  )
  if (!option) return undefined
  const holder = tables.paintableSlots.find((other) => {
    if (other.key === slot.key || keep.has(other.key)) return false
    const painted = paintedOf(edit, other)
    return (
      Object.keys(painted).length === other.stickers.length &&
      optionOf(tables, other, painted)?.pieceKey === option.pieceKey
    )
  })
  if (!holder) return undefined
  const next = { ...edit }
  for (const s of holder.stickers) delete next[s.id]
  return next
}

/**
 * True when every paintable slot of a complete cube shows a real physical
 * piece and the piece usage matches the budgets exactly (each corner and each
 * wing once, four centers per color). With the color counts already checked,
 * this is the piece-level half of 4x4 solvability (see validate.ts).
 */
export function usesRealPieces(cube: Cube): boolean {
  const tables = tablesFor(cubeShape(cube))
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
