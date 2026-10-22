import { stateKey } from '../../core/cube'
import type { Cube } from '../../core/types'
import type { OutlineScan } from '../../editor/scan/outlines'
import { once } from '../../solve/once'
import { applyGhostMove, GHOST_TURNS, solvedGhost } from './ghost'
import { ghostOutline } from './ghostShape'

/** Every state of the Floppy Ghost (30 720), from the solved one. */
const ghostStates = once((): Cube[] => {
  const start = solvedGhost()
  const seen = new Set([stateKey(start)])
  const out = [start]
  for (let i = 0; i < out.length; i++)
    for (const turn of GHOST_TURNS) {
      const next = applyGhostMove(out[i]!, turn)
      const key = stateKey(next)
      if (seen.has(key)) continue
      seen.add(key)
      out.push(next)
    }
  return out
})

/** The Floppy Ghost read by its outlines (outlines.ts): its center, a
 *  regular pentagon, the anchor; each sticker framed by its black body,
 *  about 2.5 mm on a 56 mm plate (3 units). */
export const ghostScan: OutlineScan = {
  states: ghostStates,
  outline: ghostOutline,
  anchor: 0,
  order: 5,
  border: 0.13,
}
