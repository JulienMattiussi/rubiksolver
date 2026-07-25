import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useEditor } from '@/store/editorStore'
import { useView } from '@/store/viewStore'
import { CubeView } from './CubeView'
import { EditView } from './EditView'

const HOME_POSITION = new THREE.Vector3(4.5, 4.5, 6)
const HOME_TARGET = new THREE.Vector3(0, 0, 0)
const RECENTER_SECONDS = 0.5

interface OrbitLike {
  target: THREE.Vector3
  update: () => void
}

/** Smoothly flies the camera back to its home framing when asked to recenter. */
function CameraReset() {
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
    const e = a.t < 0.5 ? 2 * a.t * a.t : 1 - Math.pow(-2 * a.t + 2, 2) / 2 // easeInOutQuad
    camera.position.lerpVectors(a.from, HOME_POSITION, e)
    controls.target.lerpVectors(a.fromTarget, HOME_TARGET, e)
    controls.update()
    if (a.t >= 1) anim.current = null
  })
  return null
}

/** The 3D canvas: camera, lighting, the cube (play or edit), orbit controls. */
export function Scene() {
  const editing = useEditor((s) => s.mode === 'edit')
  return (
    <Canvas camera={{ position: [4.5, 4.5, 6], fov: 42 }} dpr={[1, 2]}>
      <color attach="background" args={['#0f172a']} />
      {/* Even base light so every face reads its true color at any angle,
          plus soft directionals from opposite sides for a little relief. */}
      <ambientLight intensity={1.05} />
      <directionalLight position={[6, 9, 7]} intensity={0.5} />
      <directionalLight position={[-6, -7, -6]} intensity={0.45} />
      {editing ? <EditView /> : <CubeView />}
      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={5.5}
        maxDistance={15}
        enableDamping
      />
      <CameraReset />
    </Canvas>
  )
}
