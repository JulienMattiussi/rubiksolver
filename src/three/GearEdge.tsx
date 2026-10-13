import { useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Cubie } from '@/lib/types'
import { COLOR_HEX, HIGHLIGHT, PLASTIC } from './colors'
import { pieceBody } from './gearFace'
import { GearPlate } from './GearPlate'

/**
 * A Gear Cube's edge (see lib/gear.ts): its gear, a plate on each of its two
 * faces cut to the agreed shape (gearFace.ts), which spins about the edge's
 * axis (from the cube's center through the edge) a third of a turn per step,
 * so away from home it leaves the cube askew, its black body (its outline
 * pushed into the cube) with it; and
 * its two clips (fan2cube's
 * "agrafes"), a U by the center of each of its faces in its base's color,
 * which turn with the piece, not with the gear.
 */
export function GearEdge({
  cubie,
  highlighted,
  spinning = 0,
  progress,
}: {
  cubie: Cubie
  highlighted: boolean
  spinning?: number
  progress?: RefObject<number>
}) {
  const gear = useRef<THREE.Group>(null)
  const axis = new THREE.Vector3(...cubie.position).normalize()

  useFrame(() => {
    const t = spinning ? (progress?.current ?? 0) : 0
    gear.current?.setRotationFromAxisAngle(axis, ((cubie.spin! + spinning * t) * 2 * Math.PI) / 3)
  })

  return (
    <>
      {cubie.stickers.map((s, i) => (
        <mesh key={`clipBody${i}`} geometry={pieceBody('clip', cubie.position, s.normal)}>
          <meshStandardMaterial color={PLASTIC} roughness={0.65} side={THREE.DoubleSide} />
        </mesh>
      ))}
      {cubie.stickers.map((s, i) => (
        <GearPlate
          key={i}
          kind="clip"
          position={cubie.position}
          normal={s.normal}
          color={COLOR_HEX[s.color]}
        />
      ))}
      <group ref={gear}>
        {/* Its black body: its outline pushed into the cube under each of
            its faces, so it follows the teeth whatever its spin. */}
        {cubie.stickers.map((s, i) => (
          <mesh key={`body${i}`} geometry={pieceBody('gear', cubie.position, s.normal)}>
            <meshStandardMaterial
              color={PLASTIC}
              roughness={0.65}
              metalness={0.1}
              side={THREE.DoubleSide}
              emissive={HIGHLIGHT}
              emissiveIntensity={highlighted ? 0.7 : 0}
            />
          </mesh>
        ))}
        {cubie.stickers.map((s, i) => (
          <GearPlate
            key={i}
            kind="gear"
            position={cubie.position}
            normal={s.normal}
            color={COLOR_HEX[s.color]}
            lift={0.006}
          />
        ))}
      </group>
    </>
  )
}
