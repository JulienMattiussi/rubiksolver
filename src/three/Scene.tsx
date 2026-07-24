import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { CubeView } from './CubeView'

/** The 3D canvas: camera, lighting, the cube, and orbit controls. */
export function Scene() {
  return (
    <Canvas camera={{ position: [4.5, 4.5, 6], fov: 42 }} dpr={[1, 2]}>
      <color attach="background" args={['#0f172a']} />
      <hemisphereLight args={['#dbeafe', '#0b1220', 0.6]} />
      <directionalLight position={[6, 9, 7]} intensity={1.2} />
      <directionalLight position={[-7, -4, -6]} intensity={0.35} />
      <CubeView />
      <OrbitControls enablePan={false} minDistance={5.5} maxDistance={15} enableDamping />
    </Canvas>
  )
}
