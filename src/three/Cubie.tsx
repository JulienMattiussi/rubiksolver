import type { RefObject } from 'react'
import { cubieBox, LAYER_THICKNESS } from '@/lib/shape'
import type { CubeVariant, Cubie as CubieType, Dims } from '@/lib/types'
import { COLOR_HEX, HIGHLIGHT, MIRROR_STICKER, PLASTIC } from './colors'
import { CUBIE_GAP, visualPosition } from './layout'
import { GearFace } from './GearFace'
import { Sticker } from './Sticker'

/** One small cube: a dark body plus a sticker on each exterior face. Its box
 *  comes from the variant's thickness table (a mirror cubie is not a cube, see
 *  lib/shape.ts); `dims` maps logical coordinates to visual positions. */
export function Cubie({
  cubie,
  dims,
  variant,
  highlighted = false,
  spinning,
  progress,
}: {
  cubie: CubieType
  dims: Dims
  variant: CubeVariant
  /** Part of the turn a hovered pad button would make. */
  highlighted?: boolean
  /** A Gear Cube's gear in a turning slice: the sixths it spins, and how far
   *  along the turn is. */
  spinning?: number
  progress?: RefObject<number>
}) {
  const { size, center } = cubieBox(cubie.stickers, LAYER_THICKNESS[variant])
  const mirror = variant === 'mirror'
  return (
    <group position={visualPosition(cubie.position, dims)}>
      <mesh castShadow position={[center[0], center[1], center[2]]}>
        <boxGeometry args={[size[0] - CUBIE_GAP, size[1] - CUBIE_GAP, size[2] - CUBIE_GAP]} />
        <meshStandardMaterial
          color={PLASTIC}
          roughness={0.65}
          metalness={0.1}
          emissive={HIGHLIGHT}
          emissiveIntensity={highlighted ? 0.7 : 0}
        />
      </mesh>
      {cubie.spin !== undefined
        ? cubie.stickers.map((s, i) => {
            const other = cubie.stickers[1 - i]!
            return (
              <GearFace
                key={i}
                normal={s.normal}
                other={other.normal}
                color={COLOR_HEX[s.color]}
                otherColor={COLOR_HEX[other.color]}
                clipColor={COLOR_HEX[s.color]}
                spin={cubie.spin!}
                spinning={spinning}
                progress={progress}
              />
            )
          })
        : cubie.stickers.map((s, i) => (
            <Sticker
              key={i}
              normal={s.normal}
              color={mirror ? MIRROR_STICKER : COLOR_HEX[s.color]}
              box={{ size, center }}
              metal={mirror}
              glow={highlighted}
            />
          ))}
    </group>
  )
}
