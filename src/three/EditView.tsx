import { cubeSize } from '@/lib/cube'
import { slotsFor } from '@/lib/editor'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { COLOR_HEX, PLASTIC } from './colors'
import { cubeLayout, scalePosition } from './layout'
import { Sticker } from './Sticker'

/** Gray shown on a not-yet-painted sticker slot. */
const EMPTY_COLOR = '#64748b'

/** The cube in edit mode: every sticker is shown (gray when empty) and the
 *  corner/edge stickers are clickable to paint the selected color. */
export function EditView() {
  const size = useCube((s) => cubeSize(s.cube))
  const edit = useEditor((s) => s.edit)
  const paintAt = useEditor((s) => s.paintAt)
  const { scale, positionFactor } = cubeLayout(size)
  return (
    <group scale={scale}>
      {slotsFor(size).map((slot) => (
        <group key={slot.key} position={scalePosition(slot.position, positionFactor)}>
          <mesh>
            <boxGeometry args={[0.96, 0.96, 0.96]} />
            <meshStandardMaterial color={PLASTIC} roughness={0.65} metalness={0.1} />
          </mesh>
          {slot.stickers.map((s) => {
            const paintable = slot.kind === 'corner' || slot.kind === 'edge'
            const color = edit[s.id]
            return (
              <Sticker
                key={s.id}
                normal={s.normal}
                color={color ? COLOR_HEX[color] : EMPTY_COLOR}
                onSelect={paintable ? () => paintAt(slot.key, s.ni) : undefined}
              />
            )
          })}
        </group>
      ))}
    </group>
  )
}
