import { useMemo } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { UNIT_SHAPE, type CubieShape } from '@/lib/shape'
import type { Vec3 } from '@/lib/types'

const PLANE_Z = new THREE.Vector3(0, 0, 1)

/** Margin left around a sticker, so the dark body shows as a border. */
const INSET = 0.14

export interface StickerProps {
  /** Outward normal of the cubie face this sticker sits on. */
  normal: Vec3
  /** Fill color as a hex string. */
  color: string
  /** Box of the cubie: a mirror cubie is not a cube, so the sticker's size and
   *  distance to the center follow it. Defaults to the plain unit cubie. */
  shape?: CubieShape
  /** Brushed metal finish (mirror cube). */
  metal?: boolean
  /** Lit up a little: its piece is part of a previewed turn. */
  glow?: boolean
  /** When provided, the sticker is clickable (paint) with a pointer cursor. */
  onSelect?: () => void
}

/** A flat colored sticker plane, oriented to face its cubie's outward normal
 *  and sized to that face. Shared by the play view and the (clickable) edit view. */
export function Sticker({
  normal,
  color,
  shape = UNIT_SHAPE,
  metal = false,
  glow = false,
  onSelect,
}: StickerProps) {
  const [sx, sy, sz] = shape.size
  const [cx, cy, cz] = shape.center
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

  const interactive = onSelect != null
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onSelect?.()
  }
  const setCursor = (value: string) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    document.body.style.cursor = value
  }

  return (
    <mesh
      quaternion={quaternion}
      position={position}
      onClick={interactive ? handleClick : undefined}
      onPointerOver={interactive ? setCursor('pointer') : undefined}
      onPointerOut={interactive ? () => (document.body.style.cursor = 'default') : undefined}
    >
      <planeGeometry args={[width - INSET, height - INSET]} />
      <meshStandardMaterial
        color={color}
        roughness={metal ? 0.28 : 0.4}
        metalness={metal ? 0.4 : 0.05}
        emissive={color}
        emissiveIntensity={glow ? 0.25 : 0}
      />
    </mesh>
  )
}
