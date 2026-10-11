import { useEffect, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { turnRotation, turnedBy } from '@/lib/turn'
import { easeInOut } from '@/lib/easing'
import { useCube } from '@/store/cubeStore'
import { NO_PIECES } from './noPieces'

interface TurnAnimation {
  /** Ref for the group that holds the currently turning layer. */
  groupRef: RefObject<THREE.Group | null>
  /** Whether the cubie at `index` belongs to the layer being turned. */
  isTurning: (index: number) => boolean
}

/**
 * Drives the face-turn animation from the store's queue: it pulls the next move
 * when idle, rotates the active layer's group from 0 to the move's angle, then
 * commits the move so the cubies snap to their new logical positions. Rendering
 * stays a pure function of the (integer, drift-free) engine state.
 */
/** Scratch axis of the running turn (reused every frame). */
const AXIS = new THREE.Vector3()

export function useTurnAnimation(): TurnAnimation {
  const cube = useCube((s) => s.cube)
  const active = useCube((s) => s.active)
  const queueLength = useCube((s) => s.queue.length)
  const turnDuration = useCube((s) => s.turnDuration)
  const startNext = useCube((s) => s.startNext)
  const commitActive = useCube((s) => s.commitActive)

  const groupRef = useRef<THREE.Group>(null)
  const elapsed = useRef(0)

  useEffect(() => {
    elapsed.current = 0
    groupRef.current?.rotation.set(0, 0, 0)
  }, [active])

  useFrame((_, delta) => {
    if (!active) {
      if (queueLength > 0) startNext()
      return
    }
    const geo = turnRotation(active)
    // Half turns travel twice as far; give them a little more time.
    const isHalf = Math.abs(geo.angle) > Math.PI / 2 + 0.01
    const duration = turnDuration * (isHalf ? 1.7 : 1)
    elapsed.current += delta
    const t = Math.min(1, elapsed.current / duration)
    if (groupRef.current) {
      AXIS.set(geo.axis[0], geo.axis[1], geo.axis[2])
      groupRef.current.setRotationFromAxisAngle(AXIS, geo.angle * easeInOut(t))
    }
    if (t >= 1) commitActive()
  })

  const isTurning = active ? turnedBy(cube, active) : NO_PIECES

  return { groupRef, isTurning }
}
