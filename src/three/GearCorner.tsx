import * as THREE from 'three'
import type { Cubie } from '@/lib/types'
import { COLOR_HEX, HIGHLIGHT, PLASTIC } from './colors'
import { pieceBody } from './gearFace'
import { GearPlate } from './GearPlate'

/** A Gear Cube's corner or center: under each of its faces, a plate cut to
 *  the agreed shape on a black body of that shape (gearFace.ts), so nothing
 *  of it hides the gears swinging out beside it. */
export function GearCorner({ cubie, highlighted }: { cubie: Cubie; highlighted: boolean }) {
  const kind = cubie.stickers.length === 3 ? 'corner' : 'center'
  return (
    <>
      {cubie.stickers.map((s, i) => (
        <mesh key={`body${i}`} geometry={pieceBody(kind, cubie.position, s.normal)}>
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
          kind={kind}
          position={cubie.position}
          normal={s.normal}
          color={COLOR_HEX[s.color]}
        />
      ))}
    </>
  )
}
