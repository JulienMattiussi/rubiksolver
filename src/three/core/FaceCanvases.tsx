import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import type { Group } from 'three'
import { joinKey, type Canvas } from '@/lib/editor/modes/canvas'
import { useEditor } from '@/store/editorStore'
import { ABSENT_HEX, COLOR_HEX, EMPTY_COLOR, HIGHLIGHT, PLASTIC } from './colors'
import { paintable } from './paintable'

/** Half the puzzle's side, and the gap between two cells. */
const HALF = 1.5
const GAP = 0.08

/** Each face's canvas on the cube (in `FACES` order: front, top,
 *  back, bottom): where it lies, turned so its rows read from its top once
 *  the cube has tilted it toward us. */
const PLACES: { position: [number, number, number]; rotation: [number, number, number] }[] = [
  { position: [0, 0, HALF], rotation: [0, 0, 0] },
  { position: [0, HALF, 0], rotation: [-Math.PI / 2, 0, 0] },
  { position: [0, 0, -HALF], rotation: [Math.PI, 0, 0] },
  { position: [0, -HALF, 0], rotation: [Math.PI / 2, 0, 0] },
]

const hexOf = (cell: Canvas['cells'][number]) =>
  cell === null ? EMPTY_COLOR : cell === 'absent' ? ABSENT_HEX : COLOR_HEX[cell]

/**
 * A puzzle's faces being copied (faceCanvases.ts): a cube carrying its
 * four canvases, tilting a quarter turn toward us for each next face, as
 * the puzzle in hand. On the face toward us, a click paints a cell, and a
 * click between two cells of one color joins them (one sticker) or parts
 * them; joined cells show as one.
 */
export function FaceCanvases() {
  const faces = useEditor((s) => s.faces)
  const faceAt = useEditor((s) => s.faceAt)
  const faceCellAt = useEditor((s) => s.faceCellAt)
  const faceJoinAt = useEditor((s) => s.faceJoinAt)
  // Its canvases' cells a side (the Camouflage's 6, the Purple's 5).
  const n = Math.round(Math.sqrt(faces[0]?.cells.length ?? 36))
  const step = (2 * HALF) / n
  /** A cell's center on its canvas (row from the top, column). */
  const at = (i: number): [number, number] => [
    -HALF + step / 2 + (i % n) * step,
    HALF - step / 2 - Math.floor(i / n) * step,
  ]
  const cube = useRef<Group>(null)
  const [hovered, setHovered] = useState<string | null>(null)
  const hover = (key: string) => (on: boolean) =>
    setHovered((h) => (on ? key : h === key ? null : h))

  // Tilts toward the face being entered, easing there.
  useFrame((_, delta) => {
    const g = cube.current
    if (!g) return
    const target = (faceAt * Math.PI) / 2
    g.rotation.x += (target - g.rotation.x) * Math.min(1, delta * 8)
  })

  return (
    <group ref={cube}>
      <mesh>
        <boxGeometry args={[2 * HALF - 0.02, 2 * HALF - 0.02, 2 * HALF - 0.02]} />
        <meshStandardMaterial color={PLASTIC} roughness={0.7} />
      </mesh>
      {faces.map((canvas, f) => {
        const current = f === faceAt
        return (
          <group key={f} position={PLACES[f]!.position} rotation={PLACES[f]!.rotation}>
            {canvas.cells.map((cell, i) => {
              const key = `c${i}`
              const [u, v] = at(i)
              return (
                <mesh
                  key={key}
                  position={[u, v, 0.005]}
                  {...(current ? paintable(() => faceCellAt(i), hover(key)) : {})}
                >
                  <planeGeometry args={[step - GAP, step - GAP]} />
                  <meshBasicMaterial color={current && hovered === key ? HIGHLIGHT : hexOf(cell)} />
                </mesh>
              )
            })}
            {/* The joints, between a cell and its right and lower neighbors:
                filled when joined, clickable between two cells of one color. */}
            {canvas.cells.flatMap((cell, i) =>
              [i % n < n - 1 ? i + 1 : -1, i + n < canvas.cells.length ? i + n : -1]
                .filter((j) => j >= 0)
                .map((j) => {
                  const key = joinKey(i, j)
                  const joined = canvas.joins.includes(key)
                  const joinable = cell !== null && cell !== 'absent' && cell === canvas.cells[j]
                  if (!joined && !(current && joinable)) return null
                  const [u, v] = at(i)
                  const across = j === i + 1
                  const lit = current && hovered === key
                  return (
                    <mesh
                      key={key}
                      position={across ? [u + step / 2, v, 0.006] : [u, v - step / 2, 0.006]}
                      {...(current ? paintable(() => faceJoinAt(i, j), hover(key)) : {})}
                    >
                      <planeGeometry
                        args={across ? [GAP * 1.5, step - GAP] : [step - GAP, GAP * 1.5]}
                      />
                      <meshBasicMaterial
                        color={lit ? HIGHLIGHT : joined ? hexOf(cell) : PLASTIC}
                        transparent={!joined && !lit}
                        opacity={joined || lit ? 1 : 0.01}
                      />
                    </mesh>
                  )
                }),
            )}
            {/* Where four joined cells meet: the corner between them filled. */}
            {canvas.cells.map((cell, i) => {
              const joined = (a: number, b: number) => canvas.joins.includes(joinKey(a, b))
              const [r, d] = [i + 1, i + n]
              if (i % n === n - 1 || d + 1 >= canvas.cells.length) return null
              if (!joined(i, r) || !joined(i, d) || !joined(r, d + 1) || !joined(d, d + 1))
                return null
              const [u, v] = at(i)
              return (
                <mesh key={`k${i}`} position={[u + step / 2, v - step / 2, 0.006]}>
                  <planeGeometry args={[GAP * 1.5, GAP * 1.5]} />
                  <meshBasicMaterial color={hexOf(cell)} />
                </mesh>
              )
            })}
          </group>
        )
      })}
    </group>
  )
}
