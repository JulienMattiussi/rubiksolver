import { useState } from 'react'
import { cubeShape } from '@/lib/cube'
import { canPaint, slotsFor } from '@/lib/editor'
import { entersByPieces, piecesIn } from '@/lib/pieceEditor'
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
 * The Floppy Ghost is entered piece by piece: each slot shows the piece put
 * there, and a click puts the next one (pieceEditor.ts).
 */
export function PolyEditView() {
  const shape = useCube((s) => cubeShape(s.cube))
  const edit = useEditor((s) => s.edit)
  const paintAt = useEditor((s) => s.paintAt)
  const cycleAt = useEditor((s) => s.cycleAt)
  // While a form is being chosen, the one hovered (the original otherwise).
  const form = useEditor((s) => (s.phase === 'form' ? s.preview : s.form))
  const drawing = polyDrawing(shape)
  const pieces = entersByPieces(shape) ? piecesIn(edit, shape) : undefined
  // The sticker under the pointer (its slot's key, then its normal index).
  const [hovered, setHovered] = useState<string | null>(null)
  const hover = (slotKey: string) => (ni: number, on: boolean) => {
    const key = `${slotKey}|${ni}`
    setHovered((current) => (on ? key : current === key ? null : current))
  }
  const litIn = (slotKey: string) =>
    hovered?.startsWith(`${slotKey}|`) ? Number(hovered.slice(slotKey.length + 1)) : null
  return (
    <group rotation={[0, drawing.yaw, 0]}>
      <group quaternion={drawing.orient ?? [0, 0, 0, 1]} position={drawing.offset ?? [0, 0, 0]}>
        {slotsFor(shape, form).map((slot) => {
          const byNi = new Map(slot.stickers.map((s) => [s.ni, s.id]))
          // The slot's piece as solved: its geometry lists every sticker.
          const solved = {
            position: slot.position,
            stickers: slot.stickers.map((s) => ({ normal: s.normal, color: s.solvedColor })),
          }
          if (pieces && slot.paintable) {
            // Entered piece by piece: the piece placed, or the slot's own in
            // gray while empty; a click puts the next one.
            const placed = pieces.get(slot.key)
            return (
              <PolyPiece
                key={slot.key}
                cubie={placed ?? solved}
                drawing={drawing}
                stickerHex={placed ? undefined : () => EMPTY_COLOR}
                onSelect={() => cycleAt(slot.key)}
                onHover={hover(slot.key)}
                lit={litIn(slot.key)}
              />
            )
          }
          const hex = (ni: number) => {
            // A face with no sticker to enter keeps its own (the Violet's).
            if (!byNi.has(ni)) return undefined
            const color = edit[byNi.get(ni)!]
            return color ? (drawing.skin ?? COLOR_HEX[color]) : EMPTY_COLOR
          }
          return (
            <PolyPiece
              key={slot.key}
              cubie={solved}
              drawing={drawing}
              stickerHex={hex}
              onSelect={canPaint(shape, slot.key, form) ? (ni) => paintAt(slot.key, ni) : undefined}
              onHover={hover(slot.key)}
              lit={litIn(slot.key)}
            />
          )
        })}
      </group>
    </group>
  )
}
