import { cubieShape, LAYER_THICKNESS } from '@/lib/shape'
import type { CubeVariant, Cubie as CubieType } from '@/lib/types'
import { COLOR_HEX, MIRROR_STICKER, PLASTIC } from './colors'
import { CUBIE_GAP, scalePosition } from './layout'
import { Sticker } from './Sticker'

/** One small cube: a dark body plus a sticker on each exterior face. Its box
 *  comes from the variant's thickness table (a mirror cubie is not a cube, see
 *  lib/shape.ts); `positionFactor` maps logical coordinates to visual positions. */
export function Cubie({
  cubie,
  positionFactor,
  variant,
}: {
  cubie: CubieType
  positionFactor: number
  variant: CubeVariant
}) {
  const { size, center } = cubieShape(cubie.stickers, LAYER_THICKNESS[variant])
  const mirror = variant === 'mirror'
  return (
    <group position={scalePosition(cubie.position, positionFactor)}>
      <mesh castShadow position={[center[0], center[1], center[2]]}>
        <boxGeometry args={[size[0] - CUBIE_GAP, size[1] - CUBIE_GAP, size[2] - CUBIE_GAP]} />
        <meshStandardMaterial color={PLASTIC} roughness={0.65} metalness={0.1} />
      </mesh>
      {cubie.stickers.map((s, i) => (
        <Sticker
          key={i}
          normal={s.normal}
          color={mirror ? MIRROR_STICKER : COLOR_HEX[s.color]}
          shape={{ size, center }}
          metal={mirror}
        />
      ))}
    </group>
  )
}
