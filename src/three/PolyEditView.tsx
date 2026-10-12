import { cubeShape } from '@/lib/cube'
import { canPaint, slotsFor } from '@/lib/editor'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { COLOR_HEX } from './colors'
import { EMPTY_COLOR } from './EditView'
import { PolyPiece } from './PolyPiece'
import { polyDrawing } from './polyDrawing'

/**
 * A gridless puzzle in edit mode: every slot drawn as its piece, each visible
 * sticker gray until painted and clickable when the slot is paintable (on a
 * star prism, all but the left screw half, which never moves). An inner
 * point of the 4-star shows its two sides only: once both are painted, their
 * order tells which way up it sits, and the editor completes its hidden face.
 */
export function PolyEditView() {
  const shape = useCube((s) => cubeShape(s.cube))
  const edit = useEditor((s) => s.edit)
  const paintAt = useEditor((s) => s.paintAt)
  const drawing = polyDrawing(shape)
  return (
    <group rotation={[0, drawing.yaw, 0]}>
      {slotsFor(shape).map((slot) => {
        const byNi = new Map(slot.stickers.map((s) => [s.ni, s.id]))
        // The slot's piece as solved: its geometry lists every sticker.
        const cubie = {
          position: slot.position,
          stickers: slot.stickers.map((s) => ({ normal: s.normal, color: s.solvedColor })),
        }
        const hex = (ni: number) => {
          const color = edit[byNi.get(ni) ?? '']
          return color ? COLOR_HEX[color] : EMPTY_COLOR
        }
        return (
          <PolyPiece
            key={slot.key}
            cubie={cubie}
            drawing={drawing}
            stickerHex={hex}
            onSelect={canPaint(shape, slot.key) ? (ni) => paintAt(slot.key, ni) : undefined}
          />
        )
      })}
    </group>
  )
}
