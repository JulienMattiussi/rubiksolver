import * as THREE from 'three'
import type { Vec3 } from '@/lib/types'
import { gearMask, gearPlate, type GearPiece } from './gearFace'

/** One plate of a Gear Cube piece (see gearFace.ts): its face's mask, in
 *  its color. */
export function GearPlate({
  kind,
  position,
  normal,
  color,
  lift = 0.004,
  lit = false,
}: {
  kind: GearPiece
  position: Vec3
  normal: Vec3
  color: string
  lift?: number
  /** Lit up: the face under the pointer, in edit mode. */
  lit?: boolean
}) {
  return (
    <mesh geometry={gearPlate(kind, position, normal, lift)}>
      <meshStandardMaterial
        color={color}
        alphaMap={gearMask(kind)}
        alphaTest={0.5}
        roughness={0.4}
        // Lit up in its own color: a gray face stays told from a painted one.
        emissive={color}
        emissiveIntensity={lit ? 0.5 : 0}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
