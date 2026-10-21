import * as THREE from 'three'
import type { Vec3 } from '@/lib/core/types'
import type { PieceTone } from '@/three/core/Cubie'
import { hatchTexture } from '@/three/core/hatchTexture'
import { usePulse } from '@/three/core/usePulse'
import { gearMask, gearPlate, type GearPiece } from './gearFace'
import { glows } from './pieceTone'

/** One plate of a Gear Cube piece (see gearFace.ts): its face's mask, in
 *  its color, hatched and glowing as its piece's tone says (as a sticker). */
export function GearPlate({
  kind,
  position,
  normal,
  color,
  tone,
  lift = 0.004,
  lit = false,
}: {
  kind: GearPiece
  position: Vec3
  normal: Vec3
  color: string
  tone?: PieceTone
  lift?: number
  /** Lit up: the face under the pointer, in edit mode. */
  lit?: boolean
}) {
  const glow = tone !== undefined && glows(tone)
  const steady = lit ? 0.5 : glow ? 0.25 : 0
  const ref = usePulse(tone?.pulse === true && glow, steady)
  const hatched = tone?.hatched === true
  return (
    <mesh geometry={gearPlate(kind, position, normal, lift)}>
      <meshStandardMaterial
        // Its own material hatched or not: a map added later is not drawn.
        key={hatched ? 'hatched' : 'plain'}
        ref={ref}
        color={color}
        // Its texture spans the whole face: three stickers wide.
        map={hatched ? hatchTexture(3) : null}
        alphaMap={gearMask(kind)}
        alphaTest={0.5}
        roughness={0.4}
        // Lit up in its own color: a gray face stays told from a painted one.
        emissive={color}
        emissiveIntensity={steady}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
