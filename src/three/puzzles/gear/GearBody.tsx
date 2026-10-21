import type * as THREE from 'three'
import { DoubleSide } from 'three'
import type { PieceTone } from '@/three/core/Cubie'
import { HIGHLIGHT, PLACE, PLASTIC } from '@/three/core/colors'
import type { paintable } from '@/three/core/paintable'
import { usePulse } from '@/three/core/usePulse'
import { glows } from './pieceTone'

/** The black body under a face of a Gear Cube piece (gearFace.ts), glowing
 *  as its piece's tone says (amber where the tutorial takes a piece). */
export function GearBody({
  geometry,
  tone,
  select,
}: {
  geometry: THREE.BufferGeometry
  tone: PieceTone
  select: ReturnType<typeof paintable>
}) {
  const lit = glows(tone)
  const ref = usePulse(tone.pulse === true && lit, lit ? 0.7 : 0)
  return (
    <mesh geometry={geometry} {...select}>
      <meshStandardMaterial
        ref={ref}
        color={PLASTIC}
        roughness={0.65}
        metalness={0.1}
        side={DoubleSide}
        emissive={tone.marked ? PLACE : HIGHLIGHT}
        emissiveIntensity={lit ? 0.7 : 0}
      />
    </mesh>
  )
}
