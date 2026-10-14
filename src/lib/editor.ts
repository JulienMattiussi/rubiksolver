import {
  countColors,
  cubeOrientations,
  cubeShape,
  shapeColors,
  solvedCube,
  stickersTotal,
} from './cube'
import { normalIndex } from './geometry'
import {
  stickerId,
  tablesFor,
  type Placement,
  type PlacementOption,
  type Slot,
  type SlotTables,
} from './editorTables'
import { entersByPieces, piecesCube } from './pieceEditor'
import { withGears, withTurnedGears } from './gear'
import { asSeenMorphinx, withRealCorners } from './mmorph'
import { withBars, withoutBars } from './roadblock'
import { asSeenTwist, withRealThinEdges, withTurnedCenters } from './twist'
import { withTurnedFaces } from './quarter'
import { hasColoredClips, isGear, type Color, type Cube, type CubeShape } from './types'

/**
 * Constraint-guided cube editor logic (pure, no React / three.js).
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
 * here takes that `form` (a state of it, see forms.ts), the box by default.
 * The Floppy Ghost and the Z-Twist are entered piece by piece instead
 * (`entersByPieces`, pieceEditor.ts), into
 * the same map of stickers.
 */

/** The slots a cube of `shape` exposes to the editor. */
export function slotsFor(shape: CubeShape, form?: Cube): readonly Slot[] {
  return tablesFor(shape, form).slots
}

/** The colors to pick from: the shape's, but one its pre-filled stickers
 *  all take (the Violet's violet). */
export function paletteColors(shape: CubeShape, form?: Cube): Color[] {
  const { remaining } = progress(emptyEdit(shape, form), shape, form)
  return shapeColors(shape).filter((c) => remaining[c] > 0)
}

/** Whether the user can paint this slot on a cube of `shape`. */
export function canPaint(shape: CubeShape, slotKey: string, form?: Cube): boolean {
  const slot = tablesFor(shape, form).byKey.get(slotKey)
  return slot?.paintable ?? false
}

/** Painted stickers, keyed by sticker id. Absent id = not yet painted. */
export type EditStickers = Record<string, Color>

/** A blank slate: only the fixed pieces are set (see `Slot.paintable`),
 *  and any sticker every piece that fits its slot shows in one color (the
 *  Violet's big cubes, violet all over). */
export function emptyEdit(shape: CubeShape, form?: Cube): EditStickers {
  const tables = tablesFor(shape, form)
  const edit: EditStickers = {}
  for (const slot of tables.slots) {
    if (!slot.paintable) {
      for (const s of slot.stickers) edit[s.id] = s.solvedColor
      continue
    }
    // Entered piece by piece (Floppy Ghost, Z-Twist): each piece is put whole.
    if (entersByPieces(shape)) continue
    const options = tables.placements.get(slot.key) ?? []
    for (const s of slot.stickers) {
      const colors = new Set(options.map((option) => option.colors[s.ni]))
      const [only] = colors
      if (colors.size === 1 && only) edit[s.id] = only
    }
  }
  return edit
}

/** Extract a paintable state from an existing cube (e.g. the current one). */
export function cubeToEdit(cube: Cube): EditStickers {
  const edit: EditStickers = {}
  // A Z-Twist's thin edges (a Barrel's middle ones) entered the way round
  // the editor offers.
  // A RoadBlock-I's bars' marks are not entered (it is, at START), and no
  // center of it is fixed: it is not held otherwise.
  const shape = cubeShape(cube)
  const held = shape === 'roadblock' ? withoutBars(cube) : withFixedHome(cube)
  const thin = shape === 'twist' || shape === 'barrel' || shape === 'fisher'
  const seen = thin ? asSeenTwist(held) : shape === 'mmorph' ? asSeenMorphinx(held) : held
  for (const cubie of seen) {
    for (const s of cubie.stickers) edit[stickerId(cubie.position, normalIndex(s.normal))] = s.color
  }
  return edit
}

/**
 * The cube turned as a whole so its fixed pieces show their solved colors
 * (the editor keeps them still): only the 3x3's middle slices (M, E, S)
 * move its centers, and the centers they leave always match a whole-cube
 * rotation. Turning the cube that way is the same position, seen otherwise.
 */
export function withFixedHome(cube: Cube): Cube {
  const fixed = tablesFor(cubeShape(cube)).slots.filter((s) => !s.paintable && s.stickers.length)
  const home = (c: Cube) =>
    fixed.every((slot) => {
      const cubie = c.find((p) => p.position.join() === slot.position.join())
      return slot.stickers.every(
        (st) =>
          cubie?.stickers.find((x) => normalIndex(x.normal) === st.ni)?.color === st.solvedColor,
      )
    })
  if (!fixed.length || home(cube)) return cube
  return cubeOrientations(cube).find(home) ?? cube
}

/** Number of painted stickers, hidden ones included (see `progress`). */
export function filledCount(edit: EditStickers): number {
  return Object.keys(edit).length
}

/** Painted stickers out of those one can see (a 4-star's hidden faces left
 *  out: they fill in by themselves), and what each color has left. */
export function progress(
  edit: EditStickers,
  shape: CubeShape,
  form?: Cube,
): { filled: number; total: number; remaining: Record<Color, number> } {
  if (entersByPieces(shape)) {
    // Each piece placed brings its own stickers.
    const remaining = countColors(solvedCube(shape).flatMap((c) => c.stickers.map((s) => s.color)))
    for (const color of Object.values(edit)) remaining[color]--
    return { filled: Object.keys(edit).length, total: stickersTotal(shape), remaining }
  }
  const shown = slotsFor(shape, form).flatMap((slot) => slot.stickers.filter((s) => !s.hidden))
  const remaining = countColors(shown.map((s) => s.solvedColor))
  let filled = 0
  for (const s of shown) {
    const color = edit[s.id]
    if (!color) continue
    filled++
    remaining[color]--
  }
  return { filled, total: shown.length, remaining }
}

/** Every sticker slot of the shape (in that form) is painted. */
export function isComplete(edit: EditStickers, shape: CubeShape, form?: Cube): boolean {
  if (entersByPieces(shape)) return piecesCube(edit, shape) !== undefined
  return slotsFor(shape, form).every((slot) => slot.stickers.every((s) => edit[s.id] !== undefined))
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

/** Build a full Cube from a complete edit state (throws if incomplete). */
export function buildCube(
  edit: EditStickers,
  shape: CubeShape,
  form?: Cube,
  /** A Gear Cube's edges whose gear is turned over on its clips; a
   *  Z-Twist's side centers a quarter turn off, a Quarter Cube's faces a
   *  quarter on, a RoadBlock-I's faces whose bars lie a quarter off (by
   *  slot). */
  turned: readonly string[] = [],
): Cube {
  if (entersByPieces(shape)) {
    const cube = piecesCube(edit, shape)
    if (!cube) throw new Error('buildCube: a slot holds no piece')
    if (shape === 'barrel' || shape === 'fisher') return withRealThinEdges(cube)
    if (shape === 'mmorph') return withRealCorners(cube)
    return shape === 'twist' ? withTurnedCenters(cube, turned) : cube
  }
  const cube = slotsFor(shape, form).map((slot) => ({
    position: slot.position,
    stickers: slot.stickers.map((s) => {
      const color = edit[s.id]
      if (!color) throw new Error(`Missing sticker ${s.id}`)
      return { normal: s.normal, color }
    }),
  }))
  // A Quarter Cube's faces stand where their marks say.
  if (shape === 'quarter') return withTurnedFaces(cube, turned)
  // A RoadBlock-I's bars lie as solved but on the faces turned.
  if (shape === 'roadblock') return withBars(cube, turned)
  // A Gear Cube is entered in the cube's shape: its gears at rest, some
  // maybe turned over on their clips.
  if (!isGear(shape)) return cube
  return hasColoredClips(shape)
    ? withTurnedGears(cube, turned, shape)
    : withGears(cube, true, shape)
}
