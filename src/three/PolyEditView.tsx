import { Fragment, useState } from 'react'
import { cubeShape } from '@/lib/cube'
import { canPaint, slotsFor } from '@/lib/editor'
import { entersByPieces, piecesIn } from '@/lib/pieceEditor'
import { withBars } from '@/lib/roadblock'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { COLOR_HEX } from './colors'
import { EMPTY_COLOR } from './EditView'
import { Decal } from './Decal'
import { PolyPiece } from './PolyPiece'
import { polyDrawing } from './polyDrawing'

/**
 * A gridless puzzle in edit mode: every slot drawn as its piece, each visible
 * sticker gray until painted and clickable when the slot is paintable (on a
 * star prism, all but the left screw half, which never moves). An inner
 * point of the 4-star shows its two sides only: once both are painted, their
 * order tells which way up it sits, and the editor completes its hidden face.
 * The Floppy Ghost and the Z-Twist are entered piece by piece: each slot
 * shows the piece put there, and a click puts the next one (pieceEditor.ts);
 * a click on a Z-Twist side center turns it a quarter. A RoadBlock-I's
 * centers are drawn as their bars lie.
 */
export function PolyEditView() {
  const shape = useCube((s) => cubeShape(s.cube))
  const edit = useEditor((s) => s.edit)
  const paintAt = useEditor((s) => s.paintAt)
  const cycleAt = useEditor((s) => s.cycleAt)
  const twistAt = useEditor((s) => s.twistAt)
  const twisted = useEditor((s) => s.twisted)
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
          // A Z-Twist side center, a Quarter Cube's: a click turns it a
          // quarter, or back.
          const twistCenter =
            slot.stickers.length === 1 &&
            ((shape === 'twist' && slot.position[1] === 0) || shape === 'quarter')
          const plain = {
            position: slot.position,
            stickers: slot.stickers.map((s) => ({ normal: s.normal, color: s.solvedColor })),
            ...(twistCenter && { spin: twisted.includes(slot.key) ? 1 : 0 }),
          }
          // A RoadBlock-I's centers drawn as their bars lie (`twisted`: its
          // faces turned a quarter).
          const solved = shape === 'roadblock' ? withBars([plain], twisted)[0]! : plain
          if (pieces && slot.paintable) {
            // Entered piece by piece: the piece placed, or the slot's own in
            // gray while empty; a click puts the next one.
            const placed = pieces.get(slot.key)
            return (
              <Fragment key={slot.key}>
                <PolyPiece
                  cubie={placed ?? solved}
                  drawing={drawing}
                  stickerHex={placed ? undefined : () => EMPTY_COLOR}
                  onSelect={() => cycleAt(slot.key)}
                  onHover={hover(slot.key)}
                  lit={litIn(slot.key)}
                />
                {/* Its picture too (the Hockey Puck's numbers tell its pairs apart). */}
                {placed && drawing.decal?.on(0, placed) && (
                  <Decal cubie={placed} decal={drawing.decal} />
                )}
              </Fragment>
            )
          }
          const hex = (ni: number) => {
            // A face with no sticker to enter keeps its own (the Violet's),
            // as does a piece that never moves, entered piece by piece (the
            // Z-Twist's centers).
            if (!byNi.has(ni) || (pieces && !slot.paintable)) return undefined
            const color = edit[byNi.get(ni)!]
            return color ? (drawing.skin ?? COLOR_HEX[color]) : EMPTY_COLOR
          }
          return (
            <PolyPiece
              key={slot.key}
              cubie={solved}
              drawing={drawing}
              stickerHex={hex}
              onSelect={
                twistCenter
                  ? () => twistAt(slot.key)
                  : canPaint(shape, slot.key, form)
                    ? (ni) => paintAt(slot.key, ni)
                    : undefined
              }
              onHover={hover(slot.key)}
              lit={litIn(slot.key)}
            />
          )
        })}
      </group>
    </group>
  )
}
