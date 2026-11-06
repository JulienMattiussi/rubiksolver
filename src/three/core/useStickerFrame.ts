import { useMemo } from 'react'
import * as THREE from 'three'
import type { CubieBox } from '@/lib/core/shape'
import type { Vec3 } from '@/lib/core/types'

const PLANE_Z = new THREE.Vector3(0, 0, 1)

/** Where a sticker lies on its cubie's box: turned to face its normal, on
 *  the box face (the body is drawn slightly smaller, so it floats just
 *  above the surface whatever the cubie's size), sized to it. Its plane's
 *  own axes are those the quaternion takes x and y to. */
export function useStickerFrame(normal: Vec3, box: CubieBox) {
  const [sx, sy, sz] = box.size
  const [cx, cy, cz] = box.center
  return useMemo(() => {
    const n = new THREE.Vector3(normal[0], normal[1], normal[2])
    const q = new THREE.Quaternion().setFromUnitVectors(PLANE_Z, n)
    // Extent of the box along an axis-aligned direction.
    const extent = (v: THREE.Vector3) =>
      Math.abs(v.x) * sx + Math.abs(v.y) * sy + Math.abs(v.z) * sz
    const rotated = (x: number, y: number, z: number) =>
      new THREE.Vector3(x, y, z).applyQuaternion(q)
    return {
      quaternion: q,
      position: new THREE.Vector3(cx, cy, cz).addScaledVector(n, extent(n) / 2),
      // The plane's own axes, mapped to the box extents they end up along.
      width: extent(rotated(1, 0, 0)),
      height: extent(rotated(0, 1, 0)),
    }
  }, [normal, sx, sy, sz, cx, cy, cz])
}
