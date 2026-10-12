import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { cubeShape } from '@/lib/cube'
import { isGridless } from '@/lib/types'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { HOME_POSITION } from './camera'
import { CameraReset } from './CameraReset'
import { CubeView } from './CubeView'
import { EditView } from './EditView'
import { PolyEditView } from './PolyEditView'
import { PolyView } from './PolyView'

/** The 3D canvas: camera, lighting, the cube (play or edit), orbit controls. */
export function Scene() {
  const editing = useEditor((s) => s.mode === 'edit')
  const gridless = useCube((s) => isGridless(cubeShape(s.cube)))
  return (
    <Canvas camera={{ position: HOME_POSITION.toArray(), fov: 42 }} dpr={[1, 2]}>
      <color attach="background" args={['#0f172a']} />
      {/* Even base light so every face reads its true color at any angle,
          plus soft directionals from opposite sides for a little relief. */}
      <ambientLight intensity={1.05} />
      <directionalLight position={[6, 9, 7]} intensity={0.5} />
      <directionalLight position={[-6, -7, -6]} intensity={0.45} />
      {editing ? (
        gridless ? (
          <PolyEditView />
        ) : (
          <EditView />
        )
      ) : gridless ? (
        <PolyView />
      ) : (
        <CubeView />
      )}
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
