import { useMemo } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { SLOTS } from '@/lib/editor'
import type { Color, Vec3 } from '@/lib/types'
import { useEditor } from '@/store/editorStore'
import { COLOR_HEX, PLASTIC } from './colors'

const PLANE_Z = new THREE.Vector3(0, 0, 1)
const EMPTY_COLOR = '#64748b'

function EditSticker({
  normal,
  color,
  clickable,
  onPaint,
}: {
  normal: Vec3
  color: Color | null
  clickable: boolean
  onPaint: () => void
}) {
  const { quaternion, position } = useMemo(() => {
    const n = new THREE.Vector3(normal[0], normal[1], normal[2])
    return {
      quaternion: new THREE.Quaternion().setFromUnitVectors(PLANE_Z, n),
      position: n.clone().multiplyScalar(0.5),
    }
  }, [normal])

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onPaint()
  }
  const setCursor = (value: string) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    document.body.style.cursor = value
  }

  return (
    <mesh
      quaternion={quaternion}
      position={position}
      onClick={clickable ? handleClick : undefined}
      onPointerOver={clickable ? setCursor('pointer') : undefined}
      onPointerOut={clickable ? () => (document.body.style.cursor = 'default') : undefined}
    >
      <planeGeometry args={[0.86, 0.86]} />
      <meshStandardMaterial
        color={color ? COLOR_HEX[color] : EMPTY_COLOR}
        roughness={0.4}
        metalness={0.05}
      />
    </mesh>
  )
}

/** The cube in edit mode: every sticker is shown (gray when empty) and the
 *  corner/edge stickers are clickable to paint the selected color. */
export function EditView() {
  const edit = useEditor((s) => s.edit)
  const paintAt = useEditor((s) => s.paintAt)
  return (
    <group>
      {SLOTS.map((slot) => (
        <group key={slot.key} position={[slot.position[0], slot.position[1], slot.position[2]]}>
          <mesh>
            <boxGeometry args={[0.96, 0.96, 0.96]} />
            <meshStandardMaterial color={PLASTIC} roughness={0.65} metalness={0.1} />
          </mesh>
          {slot.stickers.map((s) => (
            <EditSticker
              key={s.id}
              normal={s.normal}
              color={edit[s.id] ?? null}
              clickable={slot.kind === 'corner' || slot.kind === 'edge'}
              onPaint={() => paintAt(slot.key, s.ni)}
            />
          ))}
        </group>
      ))}
    </group>
  )
}
