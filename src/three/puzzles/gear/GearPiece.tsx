import type { RefObject } from 'react'
import type { Cubie, Dims } from '@/lib/core/types'
import type { PieceTone } from '@/three/core/Cubie'
import { PLASTIC } from '@/three/core/colors'
import { visualPosition } from '@/three/core/layout'
import { GearCorner } from './GearCorner'
import { GearEdge } from './GearEdge'

/** A Gear Cube's core block: up to the pieces' bodies, which go 0.45 deep. */
const GEAR_CORE = 2 * (1.5 - 0.47)

/** A Gear Cube's piece, as Cubie draws it on a Gear Cube: its core, a
 *  corner or a center (plates cut to the agreed shape; the Extreme's middle
 *  edges, no gears, drawn the same way), or an edge, its gear turning about
 *  it. */
export function GearPiece({
  cubie,
  dims,
  tone,
  spinning,
  progress,
  colors,
  onSelect,
  onSelectGear,
  gearColors,
  onHover,
  lit,
}: {
  cubie: Cubie
  dims: Dims
  tone: PieceTone
  spinning?: number
  progress?: RefObject<number>
  colors?: readonly string[]
  onSelect?: (sticker: number) => void
  onSelectGear?: (sticker: number) => void
  gearColors?: readonly string[]
  onHover?: (face: string, on: boolean) => void
  lit?: string | null
}) {
  // A black block filling the middle, so the gaps between the pieces'
  // shaped bodies show no hole.
  if (cubie.stickers.length === 0) {
    return (
      <mesh>
        <boxGeometry args={[GEAR_CORE, GEAR_CORE, GEAR_CORE]} />
        <meshStandardMaterial color={PLASTIC} roughness={0.65} metalness={0.1} />
      </mesh>
    )
  }
  return (
    <group position={visualPosition(cubie.position, dims)}>
      {cubie.spin === undefined ? (
        <GearCorner
          cubie={cubie}
          tone={tone}
          colors={colors}
          onSelect={onSelect}
          onHover={onHover}
          lit={lit}
        />
      ) : (
        <GearEdge
          cubie={cubie}
          tone={tone}
          spinning={spinning}
          progress={progress}
          colors={colors}
          onSelect={onSelect}
          onSelectGear={onSelectGear}
          gearColors={gearColors}
          onHover={onHover}
          lit={lit}
        />
      )}
    </group>
  )
}
