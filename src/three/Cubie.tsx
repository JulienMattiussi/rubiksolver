import type { Cubie as CubieType } from '@/lib/types'
import { COLOR_HEX, PLASTIC } from './colors'
import { Sticker } from './Sticker'

/** One small cube: a dark body plus a colored sticker on each exterior face. */
export function Cubie({ cubie }: { cubie: CubieType }) {
  const [x, y, z] = cubie.position
  return (
    <group position={[x, y, z]}>
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
