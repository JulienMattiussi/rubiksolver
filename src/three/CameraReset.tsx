import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { easeInOut } from '@/lib/easing'
import { useView } from '@/store/viewStore'

// Home camera framing (matches the <Canvas camera> position and origin target).
const HOME_POSITION = new THREE.Vector3(4.5, 4.5, 6)
const HOME_TARGET = new THREE.Vector3(0, 0, 0)
const RECENTER_SECONDS = 0.5

interface OrbitLike {
  target: THREE.Vector3
  update: () => void
}

/** Smoothly flies the camera back to its home framing when asked to recenter
 *  (via the view store's reset token). Lives inside the R3F <Canvas>. */
export function CameraReset() {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as OrbitLike | null
  const token = useView((s) => s.resetToken)
  const anim = useRef<{ from: THREE.Vector3; fromTarget: THREE.Vector3; t: number } | null>(null)
  const from = useMemo(() => new THREE.Vector3(), [])
  const fromTarget = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    if (token <= 0 || !controls) return
    anim.current = {
      from: from.copy(camera.position),
      fromTarget: fromTarget.copy(controls.target),
      t: 0,
    }
  }, [token, controls, camera, from, fromTarget])

  useFrame((_, delta) => {
    const a = anim.current
    if (!a || !controls) return
    a.t = Math.min(1, a.t + delta / RECENTER_SECONDS)
    const e = easeInOut(a.t)
    camera.position.lerpVectors(a.from, HOME_POSITION, e)
    controls.target.lerpVectors(a.fromTarget, HOME_TARGET, e)
    controls.update()
    if (a.t >= 1) anim.current = null
  })
  return null
}
