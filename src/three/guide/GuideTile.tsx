import { useMemo, useRef, useState } from 'react'
import { createPortal, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { easeInOut } from '@/lib/app/easing'
import { turnSpinOf } from '@/lib/core/moveKind'
import { halfTurnedBy, turnAllowed, turnedBy, turnRotation } from '@/lib/core/turn'
import { cubeShape } from '@/lib/core/cube'
import type { Cube, CubeVariant, Turn } from '@/lib/core/types'
import { CubeModel } from '../core/CubeModel'
import { guideCameraPosition } from './guideCamera'
import { NO_PIECES } from '../core/noPieces'
import { PolyModel } from '../core/PolyModel'
import { isPolyDrawn, polyDrawing } from '../core/polyDrawing'

export interface GuideTileProps {
  /** The DOM box the tile is drawn into. */
  track: () => HTMLElement | null
  cube: Cube
  variant: CubeVariant
  turn: Turn
  /** Whether the turn plays (in a loop), or the tile stands still. */
  playing: boolean
}

/** Pause before the turn, then after it, before starting over (seconds). */
const LEAD = 0.35
const HOLD = 0.9
const QUARTER = 1
const HALF = 1.6
const BACKGROUND = new THREE.Color('#1e293b')
const AXIS = new THREE.Vector3()

/** Narrowest box the framing fits as is; a narrower one (a phone) backs the
 *  camera off so the puzzle keeps its sides. */
const FIT_ASPECT = 1.3

/** Point the tile's camera at the puzzle from `viewpoint`, at the box's aspect. */
function frame(camera: THREE.PerspectiveCamera, viewpoint: readonly number[], aspect: number) {
  const back = Math.max(1, FIT_ASPECT / aspect)
  camera.position.set(viewpoint[0]! * back, viewpoint[1]! * back, viewpoint[2]! * back)
  camera.lookAt(0, 0, 0)
  if (camera.aspect !== aspect) {
    camera.aspect = aspect
    camera.updateProjectionMatrix()
  }
}

/**
 * One tile of the move guide: the puzzle in its current state, in its own
 * scene and camera, drawn into the box `track` gives (scissored out of the
 * guide's single canvas, see GuideCanvas). While playing, the turn runs
 * from the current state, holds, then the puzzle snaps back and it starts
 * over: never played backwards. A turn the state jams stands still.
 */
export function GuideTile({ track, cube, variant, turn, playing }: GuideTileProps) {
  const [scene] = useState(() => new THREE.Scene())
  const [camera] = useState(() => new THREE.PerspectiveCamera(38, 1, 0.1, 100))
  const shape = cubeShape(cube)
  const viewpoint = useMemo(
    () => guideCameraPosition(turn, isPolyDrawn(shape) ? polyDrawing(shape) : undefined),
    [turn, shape],
  )
  const groupRef = useRef<THREE.Group>(null)
  const halfRef = useRef<THREE.Group>(null)
  const progress = useRef(0)
  const clock = useRef(0)
  const blocked = !turnAllowed(cube, turn)
  const isTurning = blocked ? NO_PIECES : turnedBy(cube, turn)
  const isHalfTurning = blocked ? NO_PIECES : halfTurnedBy(cube, turn)
  const { axis, angle } = turnRotation(turn)
  const duration = Math.abs(angle) > Math.PI / 2 + 0.01 ? HALF : QUARTER

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return
    if (!playing || blocked) {
      clock.current = 0
      group.rotation.set(0, 0, 0)
      halfRef.current?.rotation.set(0, 0, 0)
      progress.current = 0
      return
    }
    clock.current = (clock.current + delta) % (LEAD + duration + HOLD)
    const t = Math.min(1, Math.max(0, (clock.current - LEAD) / duration))
    AXIS.set(axis[0], axis[1], axis[2])
    group.setRotationFromAxisAngle(AXIS, angle * easeInOut(t))
    halfRef.current?.setRotationFromAxisAngle(AXIS, (angle / 2) * easeInOut(t))
    progress.current = easeInOut(t)
  })

  useFrame(({ gl }) => {
    const box = track()
    if (!box) return
    const area = gl.domElement.getBoundingClientRect()
    const rect = box.getBoundingClientRect()
    if (rect.bottom < area.top || rect.top > area.bottom || rect.width === 0) return
    const left = rect.left - area.left
    const bottom = area.bottom - rect.bottom
    gl.setViewport(left, bottom, rect.width, rect.height)
    gl.setScissor(left, bottom, rect.width, rect.height)
    gl.setScissorTest(true)
    gl.setClearColor(BACKGROUND, 1)
    gl.clear()
    frame(camera, viewpoint, rect.width / rect.height)
    gl.render(scene, camera)
  }, 2)

  const turnSpin = turnSpinOf(turn)
  const model = { cube, groupRef, isTurning, halfRef, isHalfTurning, turnSpin, progress }
  return createPortal(
    <>
      <ambientLight intensity={1.05} />
      <directionalLight position={[6, 9, 7]} intensity={0.5} />
      <directionalLight position={[-6, -7, -6]} intensity={0.45} />
      {isPolyDrawn(cubeShape(cube)) ? (
        <PolyModel {...model} />
      ) : (
        <CubeModel {...model} variant={variant} />
      )}
    </>,
    scene,
  )
}
