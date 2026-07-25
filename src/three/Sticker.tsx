import { useMemo } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { Vec3 } from '@/lib/types'

const PLANE_Z = new THREE.Vector3(0, 0, 1)

export interface StickerProps {
  /** Outward normal of the cubie face this sticker sits on. */
  normal: Vec3
  /** Fill color as a hex string. */
  color: string
  /** When provided, the sticker is clickable (paint) with a pointer cursor. */
  onSelect?: () => void
}

/** A flat colored sticker plane, oriented to face its cubie's outward normal.
 *  Shared by the play view and the (clickable) edit view. */
export function Sticker({ normal, color, onSelect }: StickerProps) {
  const { quaternion, position } = useMemo(() => {
    const n = new THREE.Vector3(normal[0], normal[1], normal[2])
    return {
      quaternion: new THREE.Quaternion().setFromUnitVectors(PLANE_Z, n),
      position: n.clone().multiplyScalar(0.5),
    }
  }, [normal])

  const interactive = onSelect != null
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onSelect?.()
  }
  const setCursor = (value: string) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    document.body.style.cursor = value
  }

  return (
    <mesh
      quaternion={quaternion}
      position={position}
      onClick={interactive ? handleClick : undefined}
      onPointerOver={interactive ? setCursor('pointer') : undefined}
      onPointerOut={interactive ? () => (document.body.style.cursor = 'default') : undefined}
    >
      <planeGeometry args={[0.86, 0.86]} />
      <meshStandardMaterial color={color} roughness={0.4} metalness={0.05} />
    </mesh>
  )
}
