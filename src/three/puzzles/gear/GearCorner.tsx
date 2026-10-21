import type { Cubie } from '@/lib/core/types'
import type { PieceTone } from '@/three/core/Cubie'
import { COLOR_HEX } from '../../core/colors'
import { pieceBody } from './gearFace'
import { GearBody } from './GearBody'
import { selectable } from './pieceTone'
import { GearPlate } from './GearPlate'

/** A Gear Cube's corner or center (or the Extreme's middle edge, a block): under each of its faces, a plate cut to
 *  the agreed shape on a black body of that shape (gearFace.ts), so nothing
 *  of it hides the gears swinging out beside it. In edit mode, `colors`
 *  replaces its stickers' (gray when empty) and a click on a face's body
 *  paints it (`onSelect`, the sticker's index); in the tutorial, it picks
 *  the piece. */
export function GearCorner({
  cubie,
  tone,
  colors,
  onSelect,
  onHover,
  lit,
}: {
  cubie: Cubie
  tone: PieceTone
  colors?: readonly string[]
  onSelect?: (sticker: number) => void
  /** In edit mode: told when the pointer comes onto one of its faces
   *  (its sticker's index) and leaves, and the face to light up. */
  onHover?: (face: string, on: boolean) => void
  lit?: string | null
}) {
  // Two stickers and no gear: the Extreme's middle-layer edge, a block.
  const kind =
    cubie.stickers.length === 3 ? 'corner' : cubie.stickers.length === 2 ? 'block' : 'center'
  return (
    <>
      {cubie.stickers.map((s, i) => (
        <GearBody
          key={`body${i}`}
          geometry={pieceBody(kind, cubie.position, s.normal)}
          tone={tone}
          select={selectable(
            tone,
            onSelect && (() => onSelect(i)),
            onHover && ((on) => onHover(`${i}`, on)),
          )}
        />
      ))}
      {cubie.stickers.map((s, i) => (
        <GearPlate
          key={i}
          kind={kind}
          position={cubie.position}
          normal={s.normal}
          color={colors?.[i] ?? COLOR_HEX[s.color]}
          tone={tone}
          lit={lit === `${i}`}
        />
      ))}
    </>
  )
}
