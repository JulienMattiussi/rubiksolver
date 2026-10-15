import { paint, type EditStickers } from './editor'
import { stickerId, tablesFor } from './editorTables'
import { normalIndex } from '../core/geometry'
import { barCells } from '../puzzles/bandaged/roadblock'
import type { Color, Vec3 } from '../core/types'

/**
 * A RoadBlock-I entered (editor.ts): its centers are bars of three, one
 * piece each, so painting one of them paints its whole bar, its face's bars
 * lying as `turned` says (roadblock.ts). Refused, as `paint` is, when any of
 * the three would be; a bar a center is taken back from is cleared whole.
 */
export function paintBar(
  edit: EditStickers,
  slotKey: string,
  ni: number,
  color: Color,
  turned: readonly string[],
): EditStickers {
  const slot = tablesFor('roadblock').byKey.get(slotKey)
  const center = slot?.position.filter((v) => Math.abs(v) === 2).length === 1
  if (!slot || !center) return paint(edit, 'roadblock', slotKey, ni, color)
  const bar = barCells(slot.position, turned)
  const keep = new Set(bar.map((cell) => cell.join(',')))
  let next = edit
  for (const cell of bar) {
    const before = next
    next = paint(next, 'roadblock', cell.join(','), ni, color, undefined, keep)
    if (next[stickerId(cell, ni)] !== color) return edit
    // A center taken back from another bar (the last click wins): that
    // whole bar is to paint again.
    for (const id of Object.keys(before)) {
      if (next[id] !== undefined) continue
      const [key, at] = id.split(':') as [string, string]
      const position = key.split(',').map(Number) as unknown as Vec3
      if (position.filter((v) => Math.abs(v) === 2).length !== 1) continue
      for (const other of barCells(position, turned)) delete next[stickerId(other, Number(at))]
    }
  }
  return next
}

/** The entry with a face's centers turned a quarter, back (`back`) or
 *  forth: its bars laid the other way keep their colors. */
export function turnFace(edit: EditStickers, faceKey: string, back: boolean): EditStickers {
  const normal = faceKey.split(',').map((v) => Math.sign(Number(v)))
  const axis = normal.findIndex((v) => v !== 0)
  const [b, c] = [(axis + 1) % 3, (axis + 2) % 3]
  const ni = normalIndex(normal as unknown as Vec3)
  const next = { ...edit }
  for (const slot of tablesFor('roadblock').slots) {
    const p = slot.position
    if (p[axis] !== 2 * normal[axis]! || Math.max(Math.abs(p[b]!), Math.abs(p[c]!)) > 1) continue
    // (u, v) -> (-v, u) about the face's axis, or back.
    const to = [...p]
    to[b] = back ? p[c]! : -p[c]!
    to[c] = back ? -p[b]! : p[b]!
    const color = edit[stickerId(p, ni)]
    const id = stickerId(to as unknown as Vec3, ni)
    if (color) next[id] = color
    else delete next[id]
  }
  return next
}
