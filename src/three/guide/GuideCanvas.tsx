import { Canvas, useFrame } from '@react-three/fiber'
import { GuideTile, type GuideTileProps } from './GuideTile'

/** Wipes the canvas before the tiles draw (they render at a later priority,
 *  which also turns off the canvas's own render). */
function ClearPass() {
  useFrame(({ gl }) => {
    gl.setScissorTest(false)
    gl.setClearColor(0x000000, 0)
    gl.clear()
  }, 1)
  return null
}

/**
 * The move guide's single WebGL canvas, laid over its scrolling list: each
 * tile draws its own scene into its DOM box, so a long guide costs one
 * context, and tiles scrolled away are skipped.
 */
export function GuideCanvas({ tiles }: { tiles: readonly (GuideTileProps & { key: string })[] }) {
  return (
    <Canvas
      dpr={[1, 2]}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      aria-hidden
    >
      <ClearPass />
      {tiles.map(({ key, ...tile }) => (
        <GuideTile key={key} {...tile} />
      ))}
    </Canvas>
  )
}
