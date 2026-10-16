import { useMemo } from 'react'
import * as THREE from 'three'
import { UNIT_BOX, type CubieBox } from '@/lib/core/shape'
import type { Vec3 } from '@/lib/core/types'
import { hatchTexture } from './hatchTexture'
import { paintable } from './paintable'
import { usePulse } from './usePulse'

const PLANE_Z = new THREE.Vector3(0, 0, 1)

/** Margin left around a sticker, so the dark body shows as a border. */
const INSET = 0.14

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
}: StickerProps) {
  const glowRef = usePulse(pulse, lit ? 0.5 : glow ? 0.25 : 0)
  const [sx, sy, sz] = box.size
  const [cx, cy, cz] = box.center
  const { quaternion, position, width, height } = useMemo(() => {
    const n = new THREE.Vector3(normal[0], normal[1], normal[2])
    const q = new THREE.Quaternion().setFromUnitVectors(PLANE_Z, n)
    // Extent of the box along an axis-aligned direction.
    const extent = (v: THREE.Vector3) =>
      Math.abs(v.x) * sx + Math.abs(v.y) * sy + Math.abs(v.z) * sz
    const rotated = (x: number, y: number, z: number) =>
      new THREE.Vector3(x, y, z).applyQuaternion(q)
    return {
      quaternion: q,
      // On the box face: the body is drawn slightly smaller, so it floats just
      // above the surface whatever the cubie's size.
      position: new THREE.Vector3(cx, cy, cz).addScaledVector(n, extent(n) / 2),
      // The plane's own axes, mapped to the box extents they end up along.
      width: extent(rotated(1, 0, 0)),
      height: extent(rotated(0, 1, 0)),
    }
  }, [normal, sx, sy, sz, cx, cy, cz])

  return (
    <mesh quaternion={quaternion} position={position} {...paintable(onSelect, onHover)}>
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
    </mesh>
  )
}
