import { useState } from 'react'
import { cubeDims, cubeShape } from '@/lib/core/cube'
import { slotsFor } from '@/lib/editor/edit'
import { canPaint } from '@/lib/editor/modes/colors'
import { centeringOffset, cubieBox, LAYER_THICKNESS } from '@/lib/core/shape'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { COLOR_HEX, EMPTY_COLOR, PLASTIC, VARIANT_SKIN } from './colors'
import { CUBIE_GAP, cubeScale, visualPosition } from './layout'
import { Sticker } from './Sticker'

/**
 * The cube in edit mode, painted by colors (a puzzle with its own pieces
 * has its own view: three/puzzles/views.ts): every sticker is shown (gray when empty) and every
 * paintable one (any piece a turn moves or flips: `Slot.paintable`, read by
 * `canPaint`) is clickable to paint the selected value.
 *
 * On a variant whose stickers tell sizes (a mirror cube) the value painted
 * is a thickness, so a piece takes its
 * shape as it is painted: each axis grows to the thickness of the sticker
 * facing it, and an axis with nothing painted yet keeps a plain 1. Pieces only
 * ever grow outward (see lib/core/shape.ts), so a half-painted cube never overlaps.
 */
export function EditView() {
  const shape = useCube((s) => cubeShape(s.cube))
  const dims = useCube((s) => cubeDims(s.cube))
  const variant = useCube((s) => s.variant)
  // One skin on a variant whose stickers tell sizes (painted by thickness).
  const skin = VARIANT_SKIN[variant]
  const edit = useEditor((s) => s.edit)
  // While a form is being chosen, the one hovered (the box otherwise).
  const form = useEditor((s) => (s.phase === 'form' ? s.preview : s.form))
  const paintAt = useEditor((s) => s.paintAt)
  const thickness = LAYER_THICKNESS[variant]
  const [ox, oy, oz] = centeringOffset(thickness)
  // The sticker under the pointer (its slot's key, then its normal index), lit up.
  const [hovered, setHovered] = useState<string | null>(null)
  const hover = (key: string) => (on: boolean) =>
    setHovered((current) => (on ? key : current === key ? null : current))
  return (
    <group scale={cubeScale(dims)}>
      <group position={[ox, oy, oz]}>
        {slotsFor(shape, form).map((slot) => {
          const paintable = canPaint(shape, slot.key, form)
          const painted = slot.stickers.flatMap((s) => {
            const color = edit[s.id]
            return color ? [{ normal: s.normal, color }] : []
          })
          const { size: box, center } = cubieBox(painted, thickness)
          return (
            <group key={slot.key} position={visualPosition(slot.position, dims)}>
              <mesh position={[center[0], center[1], center[2]]}>
                <boxGeometry args={[box[0] - CUBIE_GAP, box[1] - CUBIE_GAP, box[2] - CUBIE_GAP]} />
                <meshStandardMaterial color={PLASTIC} roughness={0.65} metalness={0.1} />
              </mesh>
              {slot.stickers.map((s) => {
                const color = edit[s.id]
                return (
                  <Sticker
                    key={s.id}
                    normal={s.normal}
                    color={color ? (skin ?? COLOR_HEX[color]) : EMPTY_COLOR}
                    box={{ size: box, center }}
                    metal={skin !== undefined && color !== undefined}
                    onSelect={paintable ? () => paintAt(slot.key, s.ni) : undefined}
                    onHover={hover(`${slot.key}|${s.ni}`)}
                    lit={hovered === `${slot.key}|${s.ni}`}
                  />
                )
              })}
            </group>
          )
        })}
      </group>
    </group>
  )
}
