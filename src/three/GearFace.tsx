import { useMemo, useRef, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Vec3 } from '@/lib/types'

/**
 * One face of a Gear Cube's edge (see lib/gear.ts): half a toothed gear,
 * its center on the edge it shares with the edge's other face, two colors
 * (this face's and the other's, split along a diameter) that the gear's
 * spin carries over the edge, a sixth of a turn per step; and the piece's
 * two clips (fan2cube's "agrafes"), small squares in its base's color that
 * turn with the piece, not with the gear. A gear away from home juts out of
 * the face (the Ultimate's gears only fit the cube every full turn).
 */

const RADIUS = 0.36
const TOOTH = 0.07
const TEETH = 12
/** Points along the half gear's rim. */
const STEPS = 48
const LIFT = 0.006
/** How far a gear away from home juts out. */
const JUT = 0.08

interface GearFaceProps {
  /** This face's normal and the other face's (toward the shared edge). */
  normal: Vec3
  other: Vec3
  /** Colors: this face's side of the gear, the other side's, and the clips. */
  color: string
  otherColor: string
  clipColor: string
  /** The gear's spin, in sixths of a turn. */
  spin: number
  /** While its slice turns: the sixths it spins over the move (+-1), and how
   *  far along the move is (0 to 1). */
  spinning?: number
  progress?: RefObject<number>
}

/** The half gear's two colored sectors, in the face's plane (u along the
 *  edge, v toward it), the gear turned `turn` radians. */
function sectors(turn: number): [Float32Array, Float32Array] {
  const mine: number[] = []
  const theirs: number[] = []
  const at = (phi: number) => {
    const body = phi - turn
    // A tooth every 30 degrees, fixed to the gear's body.
    const tooth = Math.cos(body * TEETH) > 0 ? TOOTH : 0
    const r = RADIUS + tooth
    return [Math.cos(phi) * r, 0.5 + Math.sin(phi) * r] as const
  }
  for (let k = 0; k < STEPS; k++) {
    const a = Math.PI + (k / STEPS) * Math.PI
    const b = Math.PI + ((k + 1) / STEPS) * Math.PI
    // The body half [pi, 2pi) is this face's color at rest.
    const body = (((a + b) / 2 - turn) % (2 * Math.PI)) + 2 * Math.PI
    const target = body % (2 * Math.PI) >= Math.PI ? mine : theirs
    const [ax, ay] = at(a)
    const [bx, by] = at(b)
    target.push(0, 0.5, 0, ax, ay, 0, bx, by, 0)
  }
  return [new Float32Array(mine), new Float32Array(theirs)]
}

export function GearFace({
  normal,
  other,
  color,
  otherColor,
  clipColor,
  spin,
  spinning = 0,
  progress,
}: GearFaceProps) {
  const mine = useRef<THREE.BufferGeometry>(null)
  const theirs = useRef<THREE.BufferGeometry>(null)
  const group = useRef<THREE.Group>(null)
  // The face's frame: w out of it, v toward the shared edge, u along it.
  const frame = useMemo(() => {
    const w = new THREE.Vector3(...normal)
    const v = new THREE.Vector3(...other)
    const u = new THREE.Vector3().crossVectors(v, w)
    return new THREE.Matrix4().makeBasis(u, v, w).setPosition(w.clone().multiplyScalar(0.5))
  }, [normal, other])

  const draw = (turnSixths: number) => {
    const [a, b] = sectors((turnSixths * Math.PI) / 3)
    for (const [ref, data] of [
      [mine, a],
      [theirs, b],
    ] as const) {
      const geometry = ref.current
      if (!geometry) continue
      geometry.setAttribute('position', new THREE.BufferAttribute(data, 3))
      geometry.computeVertexNormals()
    }
    // Away from home, the gear juts out of the face.
    const d = ((turnSixths % 6) + 6) % 6
    const off = Math.min(1, d, 6 - d)
    group.current?.position.set(0, 0, LIFT + JUT * off)
  }

  // Drawn once at rest, and every frame while it spins.
  const last = useRef<number | null>(null)
  useFrame(() => {
    const t = spinning ? (progress?.current ?? 0) : 0
    const turn = spin + spinning * t
    if (last.current === turn) return
    last.current = turn
    draw(turn)
  })

  const clip = (x: number) => (
    <mesh position={[x, -0.3, LIFT]}>
      <planeGeometry args={[0.24, 0.24]} />
      <meshStandardMaterial color={clipColor} roughness={0.4} side={THREE.DoubleSide} />
    </mesh>
  )
  return (
    <group matrixAutoUpdate={false} matrix={frame}>
      {clip(-0.3)}
      {clip(0.3)}
      <group ref={group}>
        <mesh>
          <bufferGeometry ref={mine} />
          <meshStandardMaterial color={color} roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <bufferGeometry ref={theirs} />
          <meshStandardMaterial color={otherColor} roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  )
}
