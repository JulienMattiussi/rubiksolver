import { useState } from 'react'
import { jointsToClick, type Joint } from '@/lib/editor/jointsEditor'
import type { CubeShape } from '@/lib/core/types'
import { useEditor } from '@/store/editorStore'

/** A joint's two places. */
const placesOf = (joint: Joint) =>
  joint.split('|').map((p) => p.split(',').map(Number)) as [number[], number[]]

/** The faces a joint shows on: those both its places lie on, across the
 *  line between them (a corner and its edge share two, a center and its
 *  edge one). */
function facesOf(a: number[], b: number[]): number[][] {
  const along = a.findIndex((v, i) => v !== b[i])
  return [0, 1, 2]
    .filter((axis) => axis !== along)
    .flatMap((axis) =>
      [1, -1]
        .filter((side) => a[axis] === side && b[axis] === side)
        .map((side) => [0, 1, 2].map((d) => (d === axis ? side : 0))),
    )
}

const LENGTH = 0.78
const WIDTH = 0.14
const DEPTH = 0.03

/**
 * The joints of a bandaged puzzle being entered (jointsEditor.ts): a bar on
 * each face where two pieces could be fused, across the line between them,
 * lit when fused; a click fuses them, or parts them. Only the joints some
 * form has and some does not are offered.
 */
export function JointHandles({ shape }: { shape: CubeShape }) {
  const joints = useEditor((s) => s.joints)
  const toggleJoint = useEditor((s) => s.toggleJoint)
  const [hovered, setHovered] = useState<string | null>(null)
  return (
    <>
      {jointsToClick(shape).flatMap((joint) => {
        const [a, b] = placesOf(joint)
        const along = a.findIndex((v, i) => v !== b[i])
        const fused = joints.includes(joint)
        return facesOf(a, b).map((n) => {
          const key = `${joint}#${n.join()}`
          const normal = n.findIndex((v) => v !== 0)
          const size = [0, 1, 2].map((d) => (d === along ? WIDTH : d === normal ? DEPTH : LENGTH))
          const center = [0, 1, 2].map((d) => (a[d]! + b[d]!) / 2 + n[d]! * (0.5 + DEPTH / 2))
          const lit = hovered === key
          return (
            <mesh
              key={key}
              position={center as [number, number, number]}
              onClick={(e) => {
                e.stopPropagation()
                toggleJoint(joint)
              }}
              onPointerOver={(e) => {
                e.stopPropagation()
                setHovered(key)
              }}
              onPointerOut={() => setHovered((h) => (h === key ? null : h))}
            >
              <boxGeometry args={size as [number, number, number]} />
              <meshStandardMaterial
                color={fused ? (lit ? '#7dd3fc' : '#0ea5e9') : lit ? '#94a3b8' : '#475569'}
              />
            </mesh>
          )
        })
      })}
    </>
  )
}
