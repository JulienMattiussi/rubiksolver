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
}: {
  kind: GearPiece
  position: Vec3
  normal: Vec3
  color: string
  lift?: number
}) {
  return (
    <mesh geometry={gearPlate(kind, position, normal, lift)}>
      <meshStandardMaterial
        color={color}
        alphaMap={gearMask(kind)}
        alphaTest={0.5}
        roughness={0.4}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
