import type { CubeShape } from '../../core/shapes'
import type { Color } from '../../core/types'
import { tablesFor } from '../editorTables'
import type { Parts } from '../entry'
import { anchorsOf } from './anchors'
import { readFaces, type ScanReading } from './classify'
import { distance, type Lab } from './color'
import { orientFaces } from './orient'
import { scanPlan } from './plan'
import { GEAR } from './planFaces'
import type { CellSample } from './sample'

/**
 * A Gear Cube scanned with its gears lined up (its card's `scanBefore`),
 * when its clips bear colors of their own (the Ultimate, the Extreme):
 * each edge read twice, on its clip (its sticker) and on its gear (its
 * part, lib/puzzles/gear/gearEntry.ts), where its face's drawing shows them
 * (three/puzzles/gear/gearFace.ts, its outlines); its gears' pivots at rest.
 * A gear shows its clips' two colors, their way or turned over: the way its
 * two faces read nearer (pure).
 */

/** A Gear Cube read (see above): its stickers as any 3x3's, its gears'
 *  colors besides. */
export function readGears(
  shape: CubeShape,
  taken: readonly (readonly CellSample[])[],
  behind = false,
): ScanReading {
  const plan = scanPlan(shape, 'classic', behind)
  const scanned = { shape, plan, tables: tablesFor(shape) }
  const { reading } = readFaces(scanned, taken)
  if (!reading.ok) return reading
  const anchor = anchorsOf(scanned, taken)
  const oriented = orientFaces(scanned, taken, anchor)
  const seen = new Map<string, Lab>()
  plan.forEach((face, f) =>
    face.cells.forEach((id, i) => {
      const lab = oriented[f]?.[i]?.lab
      if (lab && id.startsWith(GEAR)) seen.set(id.slice(GEAR.length), lab)
    }),
  )
  const off = (id: string, color: Color) => distance(seen.get(id)!, anchor.get(color)!)
  const parts: Record<string, Color> = {}
  for (const slot of scanned.tables.slots) {
    const [a, b] = slot.stickers.map((s) => s.id)
    if (!a || !b || !seen.has(a) || !seen.has(b)) continue
    const [ca, cb] = [reading.edit[a]!, reading.edit[b]!]
    // The gear on its clips their way, or turned over.
    const over = off(a, cb) + off(b, ca) < off(a, ca) + off(b, cb)
    parts[a] = over ? cb : ca
    parts[b] = over ? ca : cb
  }
  return { ...reading, parts: parts as Parts }
}
