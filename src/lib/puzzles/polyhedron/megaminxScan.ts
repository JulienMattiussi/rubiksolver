import { normalIndex } from '../../core/geometry'
import type { MegaFace } from '../../core/types'
import { stickerId } from '../../editor/editorTables'
import type { RingFace } from '../../editor/scan/plan'
import { megaAround, megaNormal, megaPosition, solvedMegaminx } from './megaminx'

/**
 * How a camera scans a Megaminx (lib/editor/scan/plan.ts): its twelve
 * faces, each told by its center's color and the one on top. The white one
 * first, the green on top; the five around it, the white on top, turning
 * the puzzle left (the face on the right comes next); then the yellow one,
 * and the five around it, the yellow on top.
 */

/** Each face shown, and the one on top. */
const ORDER: readonly (readonly [MegaFace, MegaFace])[] = [
  ['U', 'F'],
  ...(['F', 'R', 'BR', 'BL', 'L'] as const).map((f) => [f, 'U'] as const),
  ['D', 'DR'],
  ...(['DR', 'DBR', 'B', 'DBL', 'DL'] as const).map((f) => [f, 'D'] as const),
]

/** A face's solved color. */
const colorOf = (face: MegaFace) =>
  solvedMegaminx().find(
    (c) => c.stickers.length === 1 && c.position.join() === megaPosition([face]).join(),
  )!.stickers[0]!.color

/** A face held with its side toward `side` flat on top (or, `bottom`, at
 *  the bottom), as a ring: its center's sticker, its edges' clockwise from
 *  that side, then its corners'. */
export function megaRing(
  front: MegaFace,
  side: MegaFace,
  held: Pick<RingFace, 'bottom' | 'move' | 'angle'> = {},
): RingFace {
  const around = megaAround(front)
  const from = around.indexOf(side)
  const ring = [...around.slice(from), ...around.slice(0, from)]
  const id = (faces: readonly MegaFace[]) =>
    stickerId(megaPosition(faces), normalIndex(megaNormal(front)))
  return {
    frontColor: colorOf(front),
    upColor: colorOf(side),
    cells: [
      id([front]),
      ...ring.map((n) => id([front, n])),
      ...ring.map((n, k) => id([front, n, ring[(k + 1) % ring.length]!])),
    ],
    ...held,
  }
}

/** The faces, each told by its center. */
export const megaScan = (): RingFace[] => ORDER.map(([front, up]) => megaRing(front, up))
