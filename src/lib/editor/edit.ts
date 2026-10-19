import { countColors, cubeOrientations, cubeShape, solvedCube, stickersTotal } from '../core/cube'
import { normalIndex } from '../core/geometry'
import { stickerId, tablesFor, type Slot } from './editorTables'
import { entersByPieces, NO_MARKS, type EditStickers, type EntryMarks } from './entry'
import { piecesCube } from './modes/pieces'
import { MODELS } from '../puzzles/models'
import type { Color, Cube } from '../core/types'
import type { CubeShape } from '../core/shapes'

/**
 * What every entry fills, whatever its mode: a map of stickers, by id, on
 * the slots of the puzzle (in the form it stands in, `form`: a state of
 * it, the box by default). Painted by colors (modes/colors.ts) or put piece
 * by piece (modes/pieces.ts); read here to tell its progress and to build
 * the state it holds.
 */

/** The slots a cube of `shape` exposes to the editor. */
export function slotsFor(shape: CubeShape, form?: Cube): readonly Slot[] {
  return tablesFor(shape, form).slots
}

/** A blank slate: only the fixed pieces are set (see `Slot.paintable`),
 *  and any sticker every piece that fits its slot shows in one color (the
 *  Purple's big cubes, violet all over). */
export function emptyEdit(shape: CubeShape, form?: Cube): EditStickers {
  const tables = tablesFor(shape, form)
  const edit: EditStickers = {}
  for (const slot of tables.slots) {
    if (!slot.paintable) {
      for (const s of slot.stickers) edit[s.id] = s.solvedColor
      continue
    }
    // Put piece by piece: each piece is put whole.
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
  const own = MODELS[cubeShape(cube)]?.entry?.seen
  const seen = own ? own(cube, withFixedHome) : withFixedHome(cube)
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
    // Each piece put brings its own stickers.
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

/** Every sticker slot of the shape (in that form) is filled. */
export function isComplete(edit: EditStickers, shape: CubeShape, form?: Cube): boolean {
  if (entersByPieces(shape)) return piecesCube(edit, shape) !== undefined
  return slotsFor(shape, form).every((slot) => slot.stickers.every((s) => edit[s.id] !== undefined))
}

/** What an entry's marks cannot go with (a gear not its clips' colors). */
export class MarksRefused extends Error {}

/** Build a full Cube from a complete entry (throws if incomplete), as its
 *  model builds it from what was entered besides the colors (`marks`;
 *  `MarksRefused` when they cannot go together). */
export function buildCube(
  edit: EditStickers,
  shape: CubeShape,
  form?: Cube,
  marks: EntryMarks = NO_MARKS,
): Cube {
  const own = MODELS[shape]?.entry?.built
  const built = (cube: Cube) => {
    const out = own ? own(cube, marks) : cube
    if (!out) throw new MarksRefused(`buildCube: ${shape}'s marks do not fit`)
    return out
  }
  if (entersByPieces(shape)) {
    const cube = piecesCube(edit, shape)
    if (!cube) throw new Error('buildCube: a slot holds no piece')
    return built(cube)
  }
  const cube = slotsFor(shape, form).map((slot) => ({
    position: slot.position,
    stickers: slot.stickers.map((s) => {
      const color = edit[s.id]
      if (!color) throw new Error(`Missing sticker ${s.id}`)
      return { normal: s.normal, color }
    }),
  }))
  return built(cube)
}
