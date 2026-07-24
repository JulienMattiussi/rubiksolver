import { useMemo } from 'react'
import * as THREE from 'three'
import type { Color, Cubie as CubieType, Vec3 } from '@/lib/types'
import { COLOR_HEX, PLASTIC } from './colors'

const PLANE_Z = new THREE.Vector3(0, 0, 1)

/** A single colored sticker on a cubie face, oriented to face its normal. */
function Sticker({ normal, color }: { normal: Vec3; color: Color }) {
  const { quaternion, position } = useMemo(() => {
    const n = new THREE.Vector3(normal[0], normal[1], normal[2])
    const quaternion = new THREE.Quaternion().setFromUnitVectors(PLANE_Z, n)
    return { quaternion, position: n.clone().multiplyScalar(0.5) }
  }, [normal])
  return (
    <mesh quaternion={quaternion} position={position}>
      <planeGeometry args={[0.86, 0.86]} />
      <meshStandardMaterial color={COLOR_HEX[color]} roughness={0.4} metalness={0.05} />
    </mesh>
  )
}

/** One small cube: a dark body plus a colored sticker on each exterior face. */
export function Cubie({ cubie }: { cubie: CubieType }) {
  const [x, y, z] = cubie.position
  return (
    <group position={[x, y, z]}>
      <mesh castShadow>
        <boxGeometry args={[0.96, 0.96, 0.96]} />
        <meshStandardMaterial color={PLASTIC} roughness={0.65} metalness={0.1} />
      </mesh>
      {cubie.stickers.map((s, i) => (
        <Sticker key={i} normal={s.normal} color={s.color} />
      ))}
    </group>
  )
}
