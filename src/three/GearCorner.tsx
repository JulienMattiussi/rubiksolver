import type { Cubie } from '@/lib/types'
import { COLOR_HEX, HIGHLIGHT, PLASTIC } from './colors'
import { GearPlate } from './GearPlate'
import { CUBIE_GAP } from './layout'

/** A Gear Cube's corner or center: its body, and a plate on each of its
 *  faces cut to the agreed shape (gearFace.ts). */
export function GearCorner({ cubie, highlighted }: { cubie: Cubie; highlighted: boolean }) {
  const kind = cubie.stickers.length === 3 ? 'corner' : 'center'
  return (
    <>
      <mesh>
        <boxGeometry args={[1 - CUBIE_GAP, 1 - CUBIE_GAP, 1 - CUBIE_GAP]} />
        <meshStandardMaterial
          color={PLASTIC}
          roughness={0.65}
          metalness={0.1}
          emissive={HIGHLIGHT}
          emissiveIntensity={highlighted ? 0.7 : 0}
        />
      </mesh>
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
