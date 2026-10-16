import type { RefObject } from 'react'
import { cubieBox, LAYER_THICKNESS } from '@/lib/core/shape'
import type { CubeVariant, Cubie as CubieType, Dims } from '@/lib/core/types'
import { COLOR_HEX, HIGHLIGHT, MIRROR_STICKER, PLACE, PLASTIC } from './colors'
import { CUBIE_GAP, visualPosition } from './layout'
import { GearCorner } from '../puzzles/gear/GearCorner'
import { GearEdge } from '../puzzles/gear/GearEdge'
import { Sticker } from './Sticker'
import { usePulse } from './usePulse'

/** A Gear Cube's core block: up to the pieces' bodies, which go 0.45 deep. */
const GEAR_CORE = 2 * (1.5 - 0.47)

/** One small cube: a dark body plus a sticker on each exterior face. Its box
 *  comes from the variant's thickness table (a mirror cubie is not a cube, see
 *  lib/core/shape.ts); `dims` maps logical coordinates to visual positions. */
export function Cubie({
  cubie,
  dims,
  variant,
  highlighted = false,
  hatched = false,
  marked = false,
  pulse = false,
  onPick,
  spinning,
  progress,
  smallCenter = false,
  colors,
  onSelect,
  onSelectGear,
  gearColors,
  onHover,
  lit,
}: {
  cubie: CubieType
  dims: Dims
  variant: CubeVariant
  /** Part of the turn a hovered pad button would make, or the piece a
   *  tutorial formula aims at. */
  highlighted?: boolean
  /** Hatched: moved by a tutorial formula, not placed yet. */
  hatched?: boolean
  /** Marked: where a tutorial formula takes the piece it aims at. */
  marked?: boolean
  /** Its glow (highlighted or marked) pulsing: the tutorial's. */
  pulse?: boolean
  /** A click on it (the tutorial picks pieces so). */
  onPick?: () => void
  /** A Gear Cube's gear in a turning slice: the sixths it spins, and how far
   *  along the turn is. */
  spinning?: number
  progress?: RefObject<number>
  /** On a Gear Cube: a small center square, its clips around it, and
   *  corners notched by the gears. */
  smallCenter?: boolean
  /** In edit mode, a Gear Cube's piece: its colors, and a click painting
   *  one of its stickers (see GearCorner). */
  colors?: readonly string[]
  onSelect?: (sticker: number) => void
  onSelectGear?: (sticker: number) => void
  gearColors?: readonly string[]
  /** In edit mode, told when the pointer comes onto one of its faces and
   *  leaves, and the face to light up (see GearCorner). */
  onHover?: (face: string, on: boolean) => void
  lit?: string | null
}) {
  const glowRef = usePulse(pulse && (highlighted || marked), highlighted || marked ? 0.7 : 0)
  // A Gear Cube's core: a black block filling the middle, so the gaps
  // between the pieces' shaped bodies show no hole.
  if (smallCenter && cubie.stickers.length === 0) {
    return (
      <mesh>
        <boxGeometry args={[GEAR_CORE, GEAR_CORE, GEAR_CORE]} />
        <meshStandardMaterial color={PLASTIC} roughness={0.65} metalness={0.1} />
      </mesh>
    )
  }
  // A Gear Cube's corner or center: plates cut to the agreed shape.
  // (The Extreme's middle edges, no gears, are blocks drawn the same way.)
  if (
    smallCenter &&
    (cubie.stickers.length === 3 ||
      cubie.stickers.length === 1 ||
      (cubie.stickers.length === 2 && cubie.spin === undefined))
  ) {
    return (
      <group position={visualPosition(cubie.position, dims)}>
        <GearCorner
          cubie={cubie}
          highlighted={highlighted}
          colors={colors}
          onSelect={onSelect}
          onHover={onHover}
          lit={lit}
        />
      </group>
    )
  }
  // A Gear Cube's edge: its gear turns about the edge (GearEdge).
  if (cubie.spin !== undefined) {
    return (
      <group position={visualPosition(cubie.position, dims)}>
        <GearEdge
          cubie={cubie}
          highlighted={highlighted}
          spinning={spinning}
          progress={progress}
          colors={colors}
          onSelect={onSelect}
          onSelectGear={onSelectGear}
          gearColors={gearColors}
          onHover={onHover}
          lit={lit}
        />
      </group>
    )
  }
  const { size, center } = cubieBox(cubie.stickers, LAYER_THICKNESS[variant])
  const mirror = variant === 'mirror'
  return (
    <group position={visualPosition(cubie.position, dims)}>
      <mesh castShadow position={[center[0], center[1], center[2]]}>
        <boxGeometry args={[size[0] - CUBIE_GAP, size[1] - CUBIE_GAP, size[2] - CUBIE_GAP]} />
        <meshStandardMaterial
          ref={glowRef}
          color={PLASTIC}
          roughness={0.65}
          metalness={0.1}
          emissive={marked ? PLACE : HIGHLIGHT}
          emissiveIntensity={highlighted || marked ? 0.7 : 0}
        />
      </mesh>
      {cubie.stickers.map((s, i) => (
        <Sticker
          key={i}
          normal={s.normal}
          color={mirror ? MIRROR_STICKER : COLOR_HEX[s.color]}
          hatched={hatched}
          box={{ size, center }}
          metal={mirror}
          glow={highlighted || marked}
          pulse={pulse && (highlighted || marked)}
          onSelect={onPick}
        />
      ))}
    </group>
  )
}
