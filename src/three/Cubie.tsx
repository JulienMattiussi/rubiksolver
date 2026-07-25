import type { Cubie as CubieType } from '@/lib/types'
import { COLOR_HEX, PLASTIC } from './colors'
import { scalePosition } from './layout'
import { Sticker } from './Sticker'

/** One small cube: a dark body plus a colored sticker on each exterior face.
 *  `positionFactor` maps logical coordinates to visual positions (see layout.ts). */
export function Cubie({ cubie, positionFactor }: { cubie: CubieType; positionFactor: number }) {
  return (
    <group position={scalePosition(cubie.position, positionFactor)}>
      <mesh castShadow>
        <boxGeometry args={[0.96, 0.96, 0.96]} />
        <meshStandardMaterial color={PLASTIC} roughness={0.65} metalness={0.1} />
      </mesh>
      {cubie.stickers.map((s, i) => (
        <Sticker key={i} normal={s.normal} color={COLOR_HEX[s.color]} />
      ))}
    </group>
  )
}
