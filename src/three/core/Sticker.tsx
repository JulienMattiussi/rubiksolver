import { useMemo } from 'react'
import * as THREE from 'three'
import { UNIT_BOX, type CubieBox } from '@/lib/core/shape'
import type { Vec3 } from '@/lib/core/types'
import { hatchTexture } from './hatchTexture'
import { paintable } from './paintable'
import { usePulse } from './usePulse'
import { useStickerFrame } from './useStickerFrame'
import { useLenticular, type StickerLens } from './useLenticular'
import { ridgesTexture } from './ridgesTexture'

/** Margin left around a sticker, so the dark body shows as a border. */
const INSET = 0.14

/** How far a lenticular sticker's ridges are drawn above it. */
const RIDGES_ABOVE = 0.002

interface StickerProps {
  /** Outward normal of the cubie face this sticker sits on. */
  normal: Vec3
  /** Fill color as a hex string. */
  color: string
  /** Box of the cubie: a mirror cubie is not a cube, so the sticker's size and
   *  distance to the center follow it. Defaults to the plain unit cubie. */
  box?: CubieBox
  /** Brushed metal finish (mirror cube). */
  metal?: boolean
  /** Lit up a little: its piece is part of a previewed turn. */
  glow?: boolean
  /** Hatched: its piece moves under a tutorial's formula, placed later. */
  hatched?: boolean
  /** Its glow pulsing: the tutorial points at its piece. */
  pulse?: boolean
  /** When provided, the sticker is clickable (paint) with a pointer cursor. */
  onSelect?: () => void
  /** Told when the pointer comes onto it and leaves (edit mode). */
  onHover?: (on: boolean) => void
  /** Lit up: the face under the pointer, in edit mode. */
  lit?: boolean
  /** Lenticular: its color turns to a second one as the eye leans across
   *  its ridges, drawn over it. */
  lens?: StickerLens
  /** A second color, on its lower right half (a lenticular tile's, as
   *  entered: both its colors at once). */
  split?: string
}

/** A flat colored sticker plane, oriented to face its cubie's outward normal
 *  and sized to that face. Shared by the play view and the (clickable) edit view. */
export function Sticker({
  normal,
  color,
  box = UNIT_BOX,
  metal = false,
  glow = false,
  hatched = false,
  pulse = false,
  onSelect,
  onHover,
  lit = false,
  lens,
  split,
}: StickerProps) {
  const glowRef = usePulse(pulse, lit ? 0.5 : glow ? 0.25 : 0)
  const { quaternion, position, width, height } = useStickerFrame(normal, box)
  const { ref, upright } = useLenticular(lens, color, quaternion)

  return (
    <mesh ref={ref} quaternion={quaternion} position={position} {...paintable(onSelect, onHover)}>
      <planeGeometry args={[width - INSET, height - INSET]} />
      <meshStandardMaterial
        // Its own material hatched or not: a map added later is not drawn.
        key={hatched ? 'hatched' : 'plain'}
        ref={glowRef}
        color={color}
        map={hatched ? hatchTexture() : null}
        roughness={metal ? 0.28 : 0.4}
        metalness={metal ? 0.4 : 0.05}
        // Lit up in its own color: a gray face stays told from a painted one.
        emissive={color}
        emissiveIntensity={lit ? 0.5 : glow ? 0.25 : 0}
      />
      {split && (
        <mesh position={[0, 0, RIDGES_ABOVE / 2]}>
          <HalfPlane width={width - INSET} height={height - INSET} />
          <meshStandardMaterial color={split} roughness={0.4} metalness={0.05} />
        </mesh>
      )}
      {lens && (
        <mesh position={[0, 0, RIDGES_ABOVE]}>
          <planeGeometry args={[width - INSET, height - INSET]} />
          <meshBasicMaterial
            map={ridgesTexture(upright, lens.bold)}
            transparent
            depthWrite={false}
          />
        </mesh>
      )}
    </mesh>
  )
}

/** The lower right half of a plane, cut along its diagonal. */
function HalfPlane({ width, height }: { width: number; height: number }) {
  const geometry = useMemo(() => {
    const [w, h] = [width / 2, height / 2]
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute([-w, -h, 0, w, -h, 0, w, h, 0], 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3))
    return g
  }, [width, height])
  return <primitive object={geometry} attach="geometry" />
}
