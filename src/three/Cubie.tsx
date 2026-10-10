import { cubieShape, LAYER_THICKNESS } from '@/lib/shape'
import type { CubeVariant, Cubie as CubieType, Dims } from '@/lib/types'
import { COLOR_HEX, HIGHLIGHT, MIRROR_STICKER, PLASTIC } from './colors'
import { CUBIE_GAP, visualPosition } from './layout'
import { Sticker } from './Sticker'

/** One small cube: a dark body plus a sticker on each exterior face. Its box
 *  comes from the variant's thickness table (a mirror cubie is not a cube, see
 *  lib/shape.ts); `dims` maps logical coordinates to visual positions. */
export function Cubie({
  cubie,
  dims,
  variant,
  highlighted = false,
}: {
  cubie: CubieType
  dims: Dims
  variant: CubeVariant
  /** Part of the turn a hovered pad button would make. */
  highlighted?: boolean
}) {
  const { size, center } = cubieShape(cubie.stickers, LAYER_THICKNESS[variant])
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
      {cubie.stickers.map((s, i) => (
        <Sticker
          key={i}
          normal={s.normal}
          color={mirror ? MIRROR_STICKER : COLOR_HEX[s.color]}
          shape={{ size, center }}
          metal={mirror}
          glow={highlighted}
        />
      ))}
    </group>
  )
}
