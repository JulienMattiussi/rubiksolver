import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Vec3 } from '@/lib/core/types'

/** A lenticular sticker as drawn (see `Lens`, lib/core/types.ts): its
 *  second color (none: one color, its ridges only drawn), the direction
 *  across its ridges in its cubie's frame, and how far the eye must lean
 *  that way (the sine of the angle from the sticker's normal) for it to
 *  turn to that color. */
export interface StickerLens {
  readonly second?: string
  readonly across: Vec3
  readonly turn: number
  /** Its ridges drawn bold: their way is entered (a center's). */
  readonly bold?: boolean
}

/** The lean over which a tile's colors blend into each other, rather than
 *  flip at once. */
const BLEND = 0.06

const toEye = new THREE.Vector3()
const worldAcross = new THREE.Vector3()
const worldQuaternion = new THREE.Quaternion()
const seen = new THREE.Color()
const first = new THREE.Color()
const second = new THREE.Color()

/**
 * A sticker showing one of two colors by where the eye stands, as a
 * lenticular tile does: every frame, how far the eye leans across its
 * ridges (from its place, its direction across them as the scene turns
 * it) picks its color, the turn of the puzzle and the camera's both
 * playing. Returns the ref its mesh takes (its material's color, and glow
 * in its own color, follow) and whether its ridges run up its plane.
 */
export function useLenticular(
  lens: StickerLens | undefined,
  color: string,
  quaternion: THREE.Quaternion,
) {
  const ref = useRef<THREE.Mesh>(null)
  // Across, in the plane's own frame (its mesh turned by `quaternion`).
  const local = useMemo(
    () =>
      lens &&
      new THREE.Vector3(...lens.across).applyQuaternion(quaternion.clone().invert()).normalize(),
    [lens, quaternion],
  )
  useFrame(({ camera }) => {
    const mesh = ref.current
    if (!lens?.second || !local || !mesh) return
    mesh.getWorldPosition(toEye)
    toEye.subVectors(camera.position, toEye).normalize()
    worldAcross.copy(local).applyQuaternion(mesh.getWorldQuaternion(worldQuaternion))
    const lean = toEye.dot(worldAcross)
    const k = THREE.MathUtils.clamp((lean - lens.turn) / BLEND + 0.5, 0, 1)
    seen.lerpColors(first.set(color), second.set(lens.second), k)
    const material = mesh.material as THREE.MeshStandardMaterial
    material.color.copy(seen)
    material.emissive.copy(seen)
  })
  // Its ridges up its plane (along its own y axis) when across them is
  // along x.
  return { ref, upright: local !== undefined && Math.abs(local.x) > 0.5 }
}
