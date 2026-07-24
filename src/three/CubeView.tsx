import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { moveGeometry } from '@/lib/cube'
import { useCube } from '@/store/cubeStore'
import { Cubie } from './Cubie'

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

/**
 * Renders the 27 cubies from the logical cube state and animates the active
 * move: the turning layer is parented to a group that rotates from 0 to the
 * move's angle, then the store commits the move and the cubies snap to their
 * new logical positions with the group reset. This keeps the rendered geometry
 * a pure function of the (integer, drift-free) engine state.
 */
export function CubeView() {
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
    const geo = moveGeometry(active)
    // Half turns travel twice as far; give them a little more time.
    const isHalf = Math.abs(geo.angle) > Math.PI / 2 + 0.01
    const duration = turnDuration * (isHalf ? 1.7 : 1)
    elapsed.current += delta
    const t = Math.min(1, elapsed.current / duration)
    if (groupRef.current) groupRef.current.rotation[geo.axis] = geo.angle * easeInOut(t)
    if (t >= 1) commitActive()
  })

  const geo = active ? moveGeometry(active) : null
  const isTurning = (index: number): boolean =>
    geo != null && cube[index]!.position[geo.coordIndex] === geo.layer

  return (
    <group>
      {cube.map((c, i) => (isTurning(i) ? null : <Cubie key={i} cubie={c} />))}
      <group ref={groupRef}>
        {cube.map((c, i) => (isTurning(i) ? <Cubie key={i} cubie={c} /> : null))}
      </group>
    </group>
  )
}
