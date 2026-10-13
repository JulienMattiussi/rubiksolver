import { useMemo } from 'react'
import * as THREE from 'three'
import type { Cubie } from '@/lib/types'
import type { PolyDrawing } from './polyDrawing'

/** A picture laid on a piece's face (the Violet's logo), turning with it:
 *  a square facing out of the face, upright the way the piece says. */
export function Decal({
  cubie,
  decal,
}: {
  cubie: Cubie
  decal: NonNullable<PolyDrawing['decal']>
}) {
  const { center, normal, up, size } = decal.place(cubie)
  const texture = useMemo(() => decal.picture(), [decal])
  const n = new THREE.Vector3(...normal)
  const u = new THREE.Vector3(...up)
  // Seen from outside: right is up turned a quarter about the normal.
  const right = new THREE.Vector3().crossVectors(u, n)
  const quaternion = new THREE.Quaternion().setFromRotationMatrix(
    new THREE.Matrix4().makeBasis(right, u, n),
  )
  return (
    <mesh position={center} quaternion={quaternion}>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial
        map={texture}
        transparent
        roughness={0.4}
        polygonOffset
        polygonOffsetFactor={-2}
      />
    </mesh>
  )
}
