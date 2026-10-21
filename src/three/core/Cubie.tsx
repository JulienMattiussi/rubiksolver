import type { ComponentType, RefObject } from 'react'
import { cubieBox, LAYER_THICKNESS } from '@/lib/core/shape'
import type { Cubie as CubieType, Dims } from '@/lib/core/types'
import type { CubeVariant } from '@/lib/core/shapes'
import { COLOR_HEX, HIGHLIGHT, PLACE, PLASTIC, VARIANT_SKIN } from './colors'
import { CUBIE_GAP, visualPosition } from './layout'
import { Sticker } from './Sticker'
import { usePulse } from './usePulse'

/** How a piece is shown: lit by a hovered pad button, or the tutorial's
 *  tones and click (see Cubie's props). */
export interface PieceTone {
  highlighted: boolean
  hatched?: boolean
  marked?: boolean
  pulse?: boolean
  onPick?: () => void
  onPickHover?: (on: boolean) => void
  /** Only this part of the piece lit (see `Term.part`). */
  part?: string
}

/** What a puzzle's own piece is drawn from (three/puzzles/views.ts: a Gear
 *  Cube's), in place of a cubie. */
export interface OwnPieceProps {
  cubie: CubieType
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
}

/** One small cube: a dark body plus a sticker on each exterior face (a
 *  puzzle with its own pieces draws them, `own`). Its box
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
  onPickHover,
  part,
  spinning,
  progress,
  own: Own,
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
  /** The pointer coming onto the piece, clickable, and leaving it. */
  onPickHover?: (on: boolean) => void
  /** Only this part of a puzzle's own piece lit (see `Term.part`). */
  part?: string
  /** A Gear Cube's gear in a turning slice: the sixths it spins, and how far
   *  along the turn is. */
  spinning?: number
  progress?: RefObject<number>
  /** The puzzle's own piece, drawn in its place (a Gear Cube's). */
  own?: ComponentType<OwnPieceProps>
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
  if (Own) {
    return (
      <Own
        cubie={cubie}
        dims={dims}
        tone={{ highlighted, hatched, marked, pulse, onPick, onPickHover, part }}
        spinning={spinning}
        progress={progress}
        colors={colors}
        onSelect={onSelect}
        onSelectGear={onSelectGear}
        gearColors={gearColors}
        onHover={onHover}
        lit={lit}
      />
    )
  }
  const { size, center } = cubieBox(cubie.stickers, LAYER_THICKNESS[variant])
  // One skin for every sticker on a variant whose stickers tell sizes.
  const skin = VARIANT_SKIN[variant]
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
          color={skin ?? COLOR_HEX[s.color]}
          hatched={hatched}
          box={{ size, center }}
          metal={skin !== undefined}
          glow={highlighted || marked}
          pulse={pulse && (highlighted || marked)}
          onSelect={onPick}
          onHover={onPick && onPickHover}
        />
      ))}
    </group>
  )
}
