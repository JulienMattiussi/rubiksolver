import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { easeInOut } from '@/lib/app/easing'
import { useView, type Lift } from '@/store/viewStore'
import { useEditor } from '@/store/editorStore'
import { useCube } from '@/store/cubeStore'
import { cubeShape } from '@/lib/core/cube'
import { sceneDirection } from './polyDrawing'
import { FACE_ON_POSITION, HOME_POSITION, HOME_TARGET } from './camera'

const RECENTER_SECONDS = 0.5

interface OrbitLike {
  target: THREE.Vector3
  update: () => void
}

/** Where the camera looks at a face from: in front of it, a little above
 *  (the top still in sight; for the top or bottom, a little in front), or
 *  raised as `lift` says. */
function facingFrom(normal: readonly number[], lift?: Lift): THREE.Vector3 {
  const n = new THREE.Vector3(...normal)
  const above = lift
    ? new THREE.Vector3(...lift.toward)
    : Math.abs(n.y) > 0.5
      ? new THREE.Vector3(0, 0, 1)
      : new THREE.Vector3(0, 1, 0)
  return n
    .addScaledVector(above, lift?.amount ?? 0.45)
    .normalize()
    .multiplyScalar(HOME_POSITION.length())
}

/** Smoothly flies the camera back to its home framing when asked to recenter
 *  (via the view store's reset token), toward a face when asked (the
 *  tutorial's "hold this center facing you"), straight in front of the face
 *  being copied while a puzzle's faces are entered, and home again after.
 *  It swings round the puzzle, never through it. Lives inside the R3F
 *  <Canvas>. */
export function CameraReset() {
  const camera = useThree((s) => s.camera)
  const controls = useThree((s) => s.controls) as OrbitLike | null
  const token = useView((s) => s.resetToken)
  const toward = useView((s) => s.toward)
  const facing = useEditor((s) => s.mode === 'edit' && s.phase === 'canvas')
  const anim = useRef<{
    from: THREE.Vector3
    fromTarget: THREE.Vector3
    to: THREE.Vector3
    t: number
  } | null>(null)
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
      to: HOME_POSITION,
      t: 0,
    }
  }, [token, facing, controls, camera, from, fromTarget])

  useEffect(() => {
    if (!toward || facing || !controls) return
    // Read when asked: another puzzle chosen does not ask again.
    const shape = cubeShape(useCube.getState().cube)
    anim.current = {
      from: from.copy(camera.position),
      fromTarget: fromTarget.copy(controls.target),
      // The model's directions as the puzzle stands in the scene.
      to: facingFrom(
        sceneDirection(shape, toward.normal),
        toward.lift && { ...toward.lift, toward: sceneDirection(shape, toward.lift.toward) },
      ),
      t: 0,
    }
  }, [toward, facing, controls, camera, from, fromTarget])

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
    // Round the puzzle: the direction turns, the distance eases.
    const dir = new THREE.Vector3()
      .copy(a.from)
      .normalize()
      .applyQuaternion(
        new THREE.Quaternion().slerp(
          new THREE.Quaternion().setFromUnitVectors(
            a.from.clone().normalize(),
            a.to.clone().normalize(),
          ),
          e,
        ),
      )
    camera.position.copy(dir.multiplyScalar(a.from.length() * (1 - e) + a.to.length() * e))
    controls.target.lerpVectors(a.fromTarget, HOME_TARGET, e)
    controls.update()
    if (a.t >= 1) anim.current = null
  })
  return null
}
