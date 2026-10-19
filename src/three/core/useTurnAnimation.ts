import { turnSpinOf } from '@/lib/core/moveKind'
import { useEffect, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { halfTurnedBy, turnRotation, turnedBy } from '@/lib/core/turn'
import { easeInOut } from '@/lib/app/easing'
import { pauseBetweenTurns } from '@/lib/app/speed'
import { useCube } from '@/store/cubeStore'
import { NO_PIECES } from './noPieces'

interface TurnAnimation {
  /** Ref for the group that holds the currently turning layer. */
  groupRef: RefObject<THREE.Group | null>
  /** Whether the cubie at `index` belongs to the layer being turned. */
  isTurning: (index: number) => boolean
  /** The pieces turning half as far (a Gear Cube's slice), and their group. */
  halfRef: RefObject<THREE.Group | null>
  isHalfTurning: (index: number) => boolean
  /** The sixths a Gear Cube's turning gears spin, and the turn's progress. */
  turnSpin: number
  progress: RefObject<number>
}

/**
 * Drives the face-turn animation from the store's queue: it pulls the next move
 * when idle, rotates the active layer's group from 0 to the move's angle, then
 * commits the move so the cubies snap to their new logical positions (at the
 * slowest speed, it then waits as long again before the next). Rendering
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
  const halfRef = useRef<THREE.Group>(null)
  const progress = useRef(0)
  const elapsed = useRef(0)
  // Time idle since the last turn ended (long, before any turn).
  const idle = useRef(Infinity)

  useEffect(() => {
    if (!active) idle.current = 0
    elapsed.current = 0
    progress.current = 0
    groupRef.current?.rotation.set(0, 0, 0)
    halfRef.current?.rotation.set(0, 0, 0)
  }, [active])

  useFrame((_, delta) => {
    if (!active) {
      idle.current += delta
      if (queueLength > 0 && idle.current >= pauseBetweenTurns(turnDuration)) startNext()
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
      halfRef.current?.setRotationFromAxisAngle(AXIS, (geo.angle / 2) * easeInOut(t))
      progress.current = easeInOut(t)
    }
    if (t >= 1) commitActive()
  })

  const isTurning = active ? turnedBy(cube, active) : NO_PIECES
  const isHalfTurning = active ? halfTurnedBy(cube, active) : NO_PIECES

  const turnSpin = active ? turnSpinOf(active) : 0

  return { groupRef, isTurning, halfRef, isHalfTurning, turnSpin, progress }
}
