import { stickerId } from '../../editor/editorTables'
import type { EditStickers, PaintTogether, TogglesSpec } from '../../editor/entry'
import { togglesOfKeys, turnedKeys } from '../../editor/modes/toggles'
import { normalIndex, parseVecKey } from '../../core/geometry'
import { barCells, barsTurned, faceKeyAt, isBarCenter } from './roadblock'
import type { Vec3 } from '../../core/types'

/**
 * How the RoadBlock-I is entered (lib/editor/entry.ts): which way each
 * face's bars lie first, a click on a center turning its face's a quarter
 * (`toggles`, by face), the colors entered following them; then its
 * colors, its centers being bars of three, one piece each, so painting one
 * of them paints its whole bar (`together`).
 */

/** The entry with a face's centers turned a quarter, back (`back`) or
 *  forth: its bars laid the other way keep their colors. */
function turnFace(edit: EditStickers, faceKey: string, back: boolean): EditStickers {
  const normal = faceKey.split(',').map((v) => Math.sign(Number(v)))
  const axis = normal.findIndex((v) => v !== 0)
  const [b, c] = [(axis + 1) % 3, (axis + 2) % 3]
  const ni = normalIndex(normal as unknown as Vec3)
  // The face's centers' stickers on it, each where the quarter takes it:
  // (u, v) -> (-v, u) about the face's axis, or back.
  const moved = Object.keys(edit).flatMap((id) => {
    const [key, at] = id.split(':') as [string, string]
    const p = parseVecKey(key)
    if (Number(at) !== ni || p[axis] !== 2 * normal[axis]!) return []
    if (Math.max(Math.abs(p[b]!), Math.abs(p[c]!)) > 1) return []
    const to = [...p]
    to[b] = back ? p[c]! : -p[c]!
    to[c] = back ? -p[b]! : p[b]!
    return [[id, stickerId(to as unknown as Vec3, ni)] as const]
  })
  const next = { ...edit }
  for (const [id] of moved) delete next[id]
  for (const [id, to] of moved) next[to] = edit[id]!
  return next
}

/** Its faces' bars, a quarter off or not, by face. */
export const BARS: TogglesSpec = {
  name: 'bars',
  keyAt: (slot) => (isBarCenter(slot.position) ? faceKeyAt(slot.position) : null),
  ways: 2,
  of: (cube) => togglesOfKeys(barsTurned(cube)),
  carry: (edit, key, from) => turnFace(edit, key, from === 1),
}

/** A center painted: its whole bar, its face's bars lying as entered.
 *  Refused, as a paint is, when any of the three would be; a bar a center
 *  is taken back from is cleared whole. */
export const paintBar: PaintTogether = (paint, edit, slotKey, ni, color, toggles) => {
  const position = parseVecKey(slotKey)
  if (!isBarCenter(position)) return paint(edit, slotKey)
  const turned = turnedKeys(toggles)
  const bar = barCells(position, turned)
  const keep = new Set(bar.map((cell) => cell.join(',')))
  let next = edit
  for (const cell of bar) {
    const before = next
    next = paint(next, cell.join(','), keep)
    if (next[stickerId(cell, ni)] !== color) return edit
    // A center taken back from another bar (the last click wins): that
    // whole bar is to paint again.
    for (const id of Object.keys(before)) {
      if (next[id] !== undefined) continue
      const [key, at] = id.split(':') as [string, string]
      const taken = parseVecKey(key)
      if (!isBarCenter(taken)) continue
      for (const other of barCells(taken, turned)) delete next[stickerId(other, Number(at))]
    }
  }
  return next
}
