import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { cubeShape } from '@/lib/core/cube'
import { isPolyDrawn } from './polyDrawing'
import { ownViewsOf } from '@/three/puzzles/views'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { HOME_POSITION } from './camera'
import { CameraReset } from './CameraReset'
import { CubeView } from './CubeView'
import { EditView } from './EditView'
import { PolyEditView } from './PolyEditView'
import { PolyView } from './PolyView'
import { ViewRegion } from './ViewRegion'

/** The 3D canvas: camera, lighting, the cube (play or edit), orbit controls;
 *  the puzzle framed above what a phone's panel covers (`covered`, px from
 *  the bottom). */
export function Scene({ covered = 0 }: { covered?: number }) {
  const editing = useEditor((s) => s.mode === 'edit')
  const shape = useCube((s) => cubeShape(s.cube))
  const gridless = isPolyDrawn(shape)
  // A puzzle drawn from its own pieces is entered on its own view.
  const OwnEdit = ownViewsOf(shape)?.edit
  // A face being copied stays straight in front: no orbiting meanwhile.
  const facing = useEditor((s) => s.mode === 'edit' && s.phase === 'canvas')
  return (
    <Canvas camera={{ position: HOME_POSITION.toArray(), fov: 42 }} dpr={[1, 2]}>
      <color attach="background" args={['#0f172a']} />
      {/* Even base light so every face reads its true color at any angle,
          plus soft directionals from opposite sides for a little relief. */}
      <ambientLight intensity={1.05} />
      <directionalLight position={[6, 9, 7]} intensity={0.5} />
      <directionalLight position={[-6, -7, -6]} intensity={0.45} />
      {editing ? (
        OwnEdit ? (
          <OwnEdit />
        ) : gridless ? (
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
        enabled={!facing}
        enablePan={false}
        minDistance={5.5}
        maxDistance={15}
        enableDamping
      />
      <CameraReset />
      <ViewRegion bottom={covered} />
    </Canvas>
  )
}
