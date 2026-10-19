import { useState } from 'react'
import { handlesOf, type Handle } from '@/lib/editor/modes/joints'
import type { CubeShape } from '@/lib/core/types'
import { useEditor } from '@/store/editorStore'

const WIDTH = 0.14
const DEPTH = 0.03
/** Short of each end of the line, so two bars side by side stay apart. */
const MARGIN = 0.11

/** Where a joint shows: on each face all its cells lie on, a bar along
 *  the line between its two sides, as long as that line. */
function barsOf({ sides }: Handle) {
  const cells = sides.flat()
  const [a, b] = [sides[0][0]!, sides[1][0]!]
  const across = a.findIndex((v, i) => v !== b[i])
  const along = [0, 1, 2].find((d) => d !== across && cells.some((c) => c[d] !== cells[0]![d]))
  return [0, 1, 2]
    .filter((axis) => axis !== across && axis !== along)
    .flatMap((axis) =>
      [1, -1]
        .filter((side) => cells.every((c) => c[axis] === side))
        .map((side) => {
          const n = [0, 1, 2].map((d) => (d === axis ? side : 0))
          const mean = (d: number) => cells.reduce((s, c) => s + c[d]!, 0) / cells.length
          const length = sides[0].length - 2 * MARGIN
          const size = [0, 1, 2].map((d) => (d === across ? WIDTH : d === axis ? DEPTH : length))
          const center = [0, 1, 2].map((d) => mean(d) + n[d]! * (0.5 + DEPTH / 2))
          return {
            key: n.join(),
            size: size as [number, number, number],
            center: center as [number, number, number],
          }
        }),
    )
}

/**
 * The joints offered while entering a bandaged puzzle's blocks
 * (jointsEditor.ts): a bar on each face along the line between two pieces
 * that can be fused, as long as that line (a 2x1's whole length); a click
 * fuses them, into a 2x1 or a 2x2. Clicking a piece takes it apart
 * (PolyEditView).
 */
export function JointHandles({ shape }: { shape: CubeShape }) {
  const joints = useEditor((s) => s.joints)
  const join = useEditor((s) => s.join)
  const [hovered, setHovered] = useState<string | null>(null)
  return (
    <>
      {handlesOf(shape, joints).flatMap((handle) =>
        barsOf(handle).map(({ key: face, size, center }) => {
          const key = `${handle.add.join(' ')}#${face}`
          return (
            <mesh
              key={key}
              position={center}
              onClick={(e) => {
                e.stopPropagation()
                join(handle.add)
              }}
              onPointerOver={(e) => {
                e.stopPropagation()
                document.body.style.cursor = 'pointer'
                setHovered(key)
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'default'
                setHovered((h) => (h === key ? null : h))
              }}
            >
              <boxGeometry args={size} />
              <meshStandardMaterial color={hovered === key ? '#7dd3fc' : '#0284c7'} />
            </mesh>
          )
        }),
      )}
    </>
  )
}
