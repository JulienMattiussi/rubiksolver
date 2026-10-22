import { emptyEdit } from '../edit'
import type { EditStickers } from '../entry'
import { anchorsOf } from './anchors'
import { cheapestAssignment } from './assign'
import { distance, type Lab } from './color'
import { orientFaces } from './orient'
import type { Scanned } from './plan'
import type { CellSample } from './sample'
import type { Color, Cube } from '../../core/types'

/**
 * A scanned puzzle's colors (pure), read against its colors as this light
 * shows them (anchors.ts): no fixed threshold tells red from orange. Faces
 * held turned are found back first (orient.ts). Each sticker alone could
 * still be misread, so the pieces are
 * read whole: every real piece goes to one place, in one of the ways it
 * can sit there, the cheapest way for all of them at once (the editor's
 * placements and budgets, editorTables.ts: a corner red and orange at once
 * is no piece). A sticker this forces far from what it looked like tells a
 * face to take again.
 */

/** What a slot costs where no piece can sit (finite: the assignment adds). */
const NEVER = 1e6
/** A sticker read this much farther from its color than from another is
 *  doubtful: a misread, not a nuance of the light. */
const FORCED = 25

export type ScanReading =
  | { readonly ok: true; readonly edit: EditStickers; readonly form?: Cube }
  | { readonly ok: false; readonly face: number }

/** A scan read against its plan and tables (one form of a puzzle that
 *  changes shape, forms.ts), and what the reading cost: how far its
 *  stickers stand from their colors. */
export function readFaces(
  scanned: Scanned,
  taken: readonly (readonly CellSample[])[],
): { reading: ScanReading; cost: number } {
  const { shape, plan, tables, form } = scanned
  const anchor = anchorsOf(scanned, taken)
  const faces = orientFaces(scanned, taken, anchor)

  const seen = new Map<string, Lab>()
  const faceOf = new Map<string, number>()
  plan.forEach((face, f) =>
    face.cells.forEach((id, cell) => {
      const sample = faces[f]?.[cell]
      if (sample) seen.set(id, sample.lab)
      faceOf.set(id, f)
    }),
  )
  // A sticker out of sight (a tower out of shape hides some) costs nothing
  // in any color: its piece's other stickers tell it.
  const costOf = (id: string, color: Color) => {
    const lab = seen.get(id)
    const ref = anchor.get(color)
    return !lab ? 0 : ref ? distance(lab, ref) : NEVER
  }

  // Every physical piece, as many times as it has copies (centers).
  const pieces = [...tables.budgets].flatMap(([key, n]) => Array<string>(n).fill(key))
  const slots = tables.paintableSlots
  const best = slots.map((slot) => {
    const byPiece = new Map<string, { cost: number; colors: Record<number, Color> }>()
    for (const option of tables.placements.get(slot.key) ?? []) {
      const cost = slot.stickers.reduce((sum, s) => sum + costOf(s.id, option.colors[s.ni]!), 0)
      const was = byPiece.get(option.pieceKey)
      if (!was || cost < was.cost) byPiece.set(option.pieceKey, { cost, colors: option.colors })
    }
    return byPiece
  })
  const matrix = best.map((byPiece) => pieces.map((key) => byPiece.get(key)?.cost ?? NEVER))
  const chosen = cheapestAssignment(matrix)

  const edit = emptyEdit(shape, form)
  const doubts = new Array<number>(plan.length).fill(0)
  const colors = [...anchor.keys()]
  let cost = 0
  slots.forEach((slot, i) => {
    const pick = best[i]!.get(pieces[chosen[i]!]!)
    cost += pick?.cost ?? NEVER
    for (const s of slot.stickers) {
      const color = pick?.colors[s.ni]
      if (color) edit[s.id] = color
      const nearest = Math.min(...colors.map((c) => costOf(s.id, c)))
      const face = faceOf.get(s.id)
      if ((!color || costOf(s.id, color) - nearest > FORCED) && face !== undefined) doubts[face]!++
    }
  })
  const worst = doubts.indexOf(Math.max(...doubts))
  const reading: ScanReading = doubts[worst]
    ? { ok: false, face: worst }
    : { ok: true, edit, ...(form && { form }) }
  return { reading, cost }
}
