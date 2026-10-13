import * as THREE from 'three'
import type { Cubie } from '@/lib/types'
import { COLOR_HEX, HIGHLIGHT, PLASTIC } from './colors'
import { pieceBody } from './gearFace'
import { GearPlate } from './GearPlate'
import { paintable } from './paintable'

/** A Gear Cube's corner or center: under each of its faces, a plate cut to
 *  the agreed shape on a black body of that shape (gearFace.ts), so nothing
 *  of it hides the gears swinging out beside it. In edit mode, `colors`
 *  replaces its stickers' (gray when empty) and a click on a face's body
 *  paints it (`onSelect`, the sticker's index). */
export function GearCorner({
  cubie,
  highlighted,
  colors,
  onSelect,
  onHover,
  lit,
}: {
  cubie: Cubie
  highlighted: boolean
  colors?: readonly string[]
  onSelect?: (sticker: number) => void
  /** In edit mode: told when the pointer comes onto one of its faces
   *  (its sticker's index) and leaves, and the face to light up. */
  onHover?: (face: string, on: boolean) => void
  lit?: string | null
}) {
  const kind = cubie.stickers.length === 3 ? 'corner' : 'center'
  return (
    <>
      {cubie.stickers.map((s, i) => (
        <mesh
          key={`body${i}`}
          geometry={pieceBody(kind, cubie.position, s.normal)}
          {...paintable(onSelect && (() => onSelect(i)), onHover && ((on) => onHover(`${i}`, on)))}
        >
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
          color={colors?.[i] ?? COLOR_HEX[s.color]}
          lit={lit === `${i}`}
        />
      ))}
    </>
  )
}
