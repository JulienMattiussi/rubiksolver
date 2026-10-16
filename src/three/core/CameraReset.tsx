import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { easeInOut } from '@/lib/app/easing'
import { useView } from '@/store/viewStore'
import { useEditor } from '@/store/editorStore'
import { FACE_ON_POSITION, HOME_POSITION, HOME_TARGET } from './camera'

const RECENTER_SECONDS = 0.5

interface OrbitLike {
  target: THREE.Vector3
  update: () => void
}

/** Smoothly flies the camera back to its home framing when asked to recenter
 *  (via the view store's reset token), straight in front of the face being
 *  copied while the Camouflage's faces are entered, and home again after.
 *  Lives inside the R3F <Canvas>. */
export function CameraReset() {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as OrbitLike | null
  const token = useView((s) => s.resetToken)
  const facing = useEditor((s) => s.mode === 'edit' && s.phase === 'faces')
  const anim = useRef<{ from: THREE.Vector3; fromTarget: THREE.Vector3; t: number } | null>(null)
  const was = useRef(facing)
  const from = useMemo(() => new THREE.Vector3(), [])
  const fromTarget = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    // Back home once the faces are copied (while they are, see below).
    const left = was.current && !facing
    was.current = facing
    if ((token <= 0 && !left) || facing || !controls) return
    anim.current = {
      from: from.copy(camera.position),
      fromTarget: fromTarget.copy(controls.target),
      t: 0,
    }
  }, [token, facing, controls, camera, from, fromTarget])

  useFrame((_, delta) => {
    // Copying a face: eased straight in front, frame after frame, whatever
    // the camera was doing (orbiting is off meanwhile).
    if (facing) {
      anim.current = null
      const k = 1 - Math.exp(-delta * 8)
      camera.position.lerp(FACE_ON_POSITION, k)
      if (controls) {
        controls.target.lerp(HOME_TARGET, k)
        controls.update()
      } else camera.lookAt(HOME_TARGET)
      return
    }
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
