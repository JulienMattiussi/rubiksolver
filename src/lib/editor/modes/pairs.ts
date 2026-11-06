import { MODELS } from '../../puzzles/models'
import { stickerId, tablesFor, type PlacementOption, type Slot } from '../editorTables'
import { NO_MARKS, type EditStickers, type PaintTogether, type Toggles } from '../entry'
import { paint } from './colors'
import type { Color, Cubie, Lens } from '../../core/types'
import type { CubeShape } from '../../core/shapes'

/**
 * Entry by pairs (pure): a puzzle of lenticular tiles (the Rubik's
 * Impossible, `PuzzleModel.lenses`), each showing one of two colors by the
 * angle. The user paints what a tile shows, its two colors in any order
 * (tilting the puzzle to see the second), never knowing which is the
 * tile's own (its dominant one): a piece is told by the colors its tiles
 * show, and once only one piece shows them there, its dominant colors are
 * painted (modes/colors.ts, its budget and taking back as when painted by
 * colors) and the entry goes on as any.
 *
 * A color painted again on a tile showing it says it is the tile's own:
 * what tells a one-colored tile (an anchor) from a tile whose second color
 * is not painted yet. Pieces showing the same colors tile by tile (the
 * Impossible's ambiguous edges) are not asked: the first stands for them,
 * and its model picks the one that can be reached once built.
 *
 * What a tile was seen to show is kept with the stickers, under keys of its
 * own (`~1`, `~2`, its own color `~d`), which nothing reading the stickers
 * by their ids sees.
 */

const FIRST = '~1'
const SECOND = '~2'
const OWN = '~d'

/** What a tile was seen to show, painted. */
const seenOf = (edit: EditStickers, id: string): Color[] =>
  [edit[id + FIRST], edit[id + SECOND]].filter((c): c is Color => c !== undefined)

/** A piece as a placement puts it on a slot. */
const pieceOf = (slot: Slot, option: PlacementOption): Cubie => ({
  position: slot.position,
  stickers: slot.stickers.map((s) => ({ normal: s.normal, color: option.colors[s.ni]! })),
})

/** What each of a slot's tiles shows, as a placement puts a piece there:
 *  its own color, then its second one if any. */
function shows(shape: CubeShape, slot: Slot, option: PlacementOption): Color[][] {
  const lenses = MODELS[shape]!.lenses!(pieceOf(slot, option))
  return slot.stickers.map((s, i) => {
    const second = lenses[i]?.secondary
    return [option.colors[s.ni]!, ...(second ? [second] : [])]
  })
}

/** The placements of a slot that show what its tiles were seen to show. */
function fitting(shape: CubeShape, edit: EditStickers, slot: Slot): PlacementOption[] {
  return (tablesFor(shape).placements.get(slot.key) ?? []).filter((option) => {
    const looks = shows(shape, slot, option)
    return slot.stickers.every((s, i) => {
      const id = stickerId(slot.position, s.ni)
      const own = edit[id + OWN]
      return seenOf(edit, id).every((c) => looks[i]!.includes(c)) && (!own || own === looks[i]![0])
    })
  })
}

/** The slot's tiles seen, its colors cleared (to be told again). */
function cleared(edit: EditStickers, slot: Slot, alsoSeen: boolean): EditStickers {
  const next = { ...edit }
  for (const s of slot.stickers) {
    const id = stickerId(slot.position, s.ni)
    delete next[id]
    if (alsoSeen) for (const k of [FIRST, SECOND, OWN]) delete next[id + k]
  }
  return next
}

/** A tile's seen colors, as a click changes them. */
function seenAfter(edit: EditStickers, id: string, color: Color): EditStickers {
  const seen = seenOf(edit, id)
  const next = { ...edit }
  if (seen.includes(color)) next[id + OWN] = color
  else if (seen.length === 1) next[id + SECOND] = color
  else {
    next[id + FIRST] = color
    delete next[id + SECOND]
    delete next[id + OWN]
  }
  return next
}

/** The piece a slot's colors put there, once all told. */
const toldOption = (shape: CubeShape, edit: EditStickers, slot: Slot) =>
  (tablesFor(shape).placements.get(slot.key) ?? []).find((o) =>
    slot.stickers.every((s) => edit[stickerId(slot.position, s.ni)] === o.colors[s.ni]),
  )

/** Its own colors painted, if the tiles seen tell one piece only (one
 *  with budget left, rather than one already used elsewhere). */
function told(shape: CubeShape, edit: EditStickers, slot: Slot): EditStickers {
  const options = fitting(shape, edit, slot)
  const { budgets, paintableSlots } = tablesFor(shape)
  const used = new Map<string, number>()
  for (const other of paintableSlots) {
    const piece = other.key !== slot.key && toldOption(shape, edit, other)
    if (piece) used.set(piece.pieceKey, (used.get(piece.pieceKey) ?? 0) + 1)
  }
  const free = options.filter((o) => (used.get(o.pieceKey) ?? 0) < (budgets.get(o.pieceKey) ?? 0))
  const [only, ...others] = free.length ? free : options
  // Pieces that show the same, tile by tile, are told apart by its model
  // once built (`entry.built`): the first one stands for them.
  const looks = (o: PlacementOption) => shows(shape, slot, o).map((c) => [...c].sort().join())
  const alike = (o: PlacementOption) => looks(o).join(' ') === looks(only!).join(' ')
  if (!only || !others.every(alike)) return cleared(edit, slot, false)
  let next = cleared(edit, slot, false)
  for (const s of slot.stickers) next = paint(next, shape, slot.key, s.ni, only.colors[s.ni]!)
  return next
}

/** A tile painted by a lenticular puzzle's entry (its paint's `together`):
 *  what it shows, then its piece's colors if they are told. */
export const paintPair =
  (shape: CubeShape): PaintTogether =>
  (_paint, edit, slotKey, ni, color) => {
    const slot = tablesFor(shape).byKey.get(slotKey)
    if (!slot?.paintable) return edit
    const id = stickerId(slot.position, ni)
    // A piece told before: its tiles show its colors, which the click
    // goes on from.
    let next = edit
    if (edit[id] && !seenOf(edit, id).length) next = seenFromColors(shape, edit, slot)
    next = seenAfter(next, id, color)
    // Seen otherwise than any piece shows with the other tiles: the piece
    // starts again from this tile.
    if (!fitting(shape, next, slot).length) {
      next = seenAfter(cleared(next, slot, true), id, color)
      if (!fitting(shape, next, slot).length) return edit
    }
    return told(shape, next, slot)
  }

/** A slot's tiles seen as its colors show them (a state entered as it
 *  stands): its own color and its second one, its own said. */
function seenFromColors(shape: CubeShape, edit: EditStickers, slot: Slot): EditStickers {
  const next = { ...edit }
  for (const s of slot.stickers) {
    const id = stickerId(slot.position, s.ni)
    const [own, second] = tileColors(shape, edit, slot, s.ni)
    if (own) next[id + FIRST] = next[id + OWN] = own
    if (second) next[id + SECOND] = second
  }
  return next
}

/** A slot's piece as its colors tell it, its line's marks as the toggles
 *  say (its model's `built`), when all its stickers are told. */
function toldPiece(
  shape: CubeShape,
  edit: EditStickers,
  slot: Slot,
  toggles: Toggles,
): Cubie | undefined {
  const colors = slot.stickers.map((s) => edit[stickerId(slot.position, s.ni)])
  if (colors.some((c) => !c)) return undefined
  const piece: Cubie = {
    position: slot.position,
    stickers: slot.stickers.map((s, i) => ({ normal: s.normal, color: colors[i]! })),
  }
  const built = MODELS[shape]?.entry?.built?.([piece], { ...NO_MARKS, toggles })
  return built?.[0] ?? piece
}

/** The colors a tile shows, as entered: its piece's own and second ones
 *  once told, else what it was seen to show. */
export function tileColors(shape: CubeShape, edit: EditStickers, slot: Slot, ni: number): Color[] {
  const index = slot.stickers.findIndex((s) => s.ni === ni)
  const piece = toldPiece(shape, edit, slot, {})
  if (!piece) return seenOf(edit, stickerId(slot.position, ni))
  const second = MODELS[shape]!.lenses!(piece)[index]?.secondary
  return [piece.stickers[index]!.color, ...(second ? [second] : [])]
}

/** A slot's tiles' lenses once its piece is told (a center's line as the
 *  toggles turn it), to draw their ridges. */
export function slotLenses(
  shape: CubeShape,
  edit: EditStickers,
  slot: Slot,
  toggles: Toggles,
): readonly Lens[] | undefined {
  const piece = toldPiece(shape, edit, slot, toggles)
  return piece && MODELS[shape]!.lenses!(piece)
}
