import { cubeDims, cubeShape } from '@/lib/cube'
import { canPaint, slotsFor } from '@/lib/editor'
import { centeringOffset, cubieBox, LAYER_THICKNESS } from '@/lib/shape'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { COLOR_HEX, MIRROR_STICKER, PLASTIC } from './colors'
import { CUBIE_GAP, cubeScale, visualPosition } from './layout'
import { Sticker } from './Sticker'

/** Gray shown on a not-yet-painted sticker slot. */
export const EMPTY_COLOR = '#64748b'

/**
 * The cube in edit mode: every sticker is shown (gray when empty) and every
 * paintable one (any piece a turn moves or flips: `Slot.paintable`, read by
 * `canPaint`) is clickable to paint the selected value.
 *
 * On a mirror cube the value painted is a thickness, so a piece takes its
 * shape as it is painted: each axis grows to the thickness of the sticker
 * facing it, and an axis with nothing painted yet keeps a plain 1. Pieces only
 * ever grow outward (see lib/shape.ts), so a half-painted cube never overlaps.
 */
export function EditView() {
  const shape = useCube((s) => cubeShape(s.cube))
  const dims = useCube((s) => cubeDims(s.cube))
  const mirror = useCube((s) => s.variant === 'mirror')
  const edit = useEditor((s) => s.edit)
  // While a form is being chosen, the one hovered (the box otherwise).
  const form = useEditor((s) => (s.phase === 'form' ? s.preview : s.form))
  const paintAt = useEditor((s) => s.paintAt)
  const thickness = LAYER_THICKNESS[mirror ? 'mirror' : 'classic']
  const [ox, oy, oz] = centeringOffset(thickness)
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
                    color={color ? (mirror ? MIRROR_STICKER : COLOR_HEX[color]) : EMPTY_COLOR}
                    box={{ size: box, center }}
                    metal={mirror && color !== undefined}
                    onSelect={paintable ? () => paintAt(slot.key, s.ni) : undefined}
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
