import { useMemo } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { Cubie } from '@/lib/types'
import { COLOR_HEX, HIGHLIGHT, PLASTIC } from './colors'
import type { PolyDrawing } from './polyDrawing'
import type { PiecePolygon } from './polygons'

/** Convex polygons as one geometry, each a triangle fan with its own normal
 *  (or one per point, on a curved surface). */
function polygonsGeometry(polygons: readonly PiecePolygon[]): THREE.BufferGeometry {
  const positions: number[] = []
  const normals: number[] = []
  for (const { points, normal, normals: smooth } of polygons) {
    const normalAt = (i: number) => smooth?.[i] ?? normal
    for (let i = 1; i < points.length - 1; i++) {
      positions.push(...points[0]!, ...points[i]!, ...points[i + 1]!)
      normals.push(...normalAt(0), ...normalAt(i), ...normalAt(i + 1))
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  return geometry
}

/** A piece's polygons merged by what they show (the body, or one sticker):
 *  one mesh each, however finely the piece is cut (the Jing's curves). */
function merged(polygons: readonly PiecePolygon[]) {
  const groups = new Map<string, PiecePolygon[]>()
  for (const p of polygons) {
    const key = `${p.paint}:${p.ni ?? ''}`
    const group = groups.get(key)
    if (group) group.push(p)
    else groups.set(key, [p])
  }
  return [...groups.values()].map((group) => ({
    paint: group[0]!.paint,
    ni: group[0]!.ni,
    geometry: polygonsGeometry(group),
  }))
}

interface PolyPieceProps {
  cubie: Cubie
  /** How the puzzle draws its pieces. */
  drawing: PolyDrawing
  highlighted?: boolean
  /** Edit mode: the hex shown by the sticker of normal index `ni` (gray
   *  while unpainted), and what a click on it does. */
  stickerHex?: (ni: number) => string
  onSelect?: (ni: number) => void
}

const setCursor = (value: string) => (e: ThreeEvent<PointerEvent>) => {
  e.stopPropagation()
  document.body.style.cursor = value
}

/** One piece of a gridless puzzle (a star point, a screw half, a Pyraminx
 *  tip...): its body faces in plastic, its stickers in their colors. In edit
 *  mode its stickers show what is painted and take clicks. */
export function PolyPiece({
  cubie,
  drawing,
  highlighted = false,
  stickerHex,
  onSelect,
}: PolyPieceProps) {
  const polygons = useMemo(() => merged(drawing.polygons(cubie)), [cubie, drawing])
  return (
    <group>
      {polygons.map(({ paint, ni, geometry }, i) => {
        const hex =
          paint === 'body'
            ? PLASTIC
            : stickerHex && ni !== undefined
              ? stickerHex(ni)
              : COLOR_HEX[paint]
        const clickable = onSelect && ni !== undefined
        return (
          <mesh
            key={i}
            geometry={geometry}
            onClick={
              clickable
                ? (e: ThreeEvent<MouseEvent>) => {
                    e.stopPropagation()
                    onSelect(ni)
                  }
                : undefined
            }
            onPointerOver={clickable ? setCursor('pointer') : undefined}
            onPointerOut={clickable ? setCursor('default') : undefined}
          >
            <meshStandardMaterial
              color={hex}
              roughness={paint === 'body' ? 0.65 : 0.4}
              metalness={paint === 'body' ? 0.1 : 0.05}
              side={THREE.DoubleSide}
              emissive={paint === 'body' ? HIGHLIGHT : hex}
              emissiveIntensity={highlighted ? (paint === 'body' ? 0.7 : 0.25) : 0}
              polygonOffset={paint !== 'body'}
              polygonOffsetFactor={-1}
            />
          </mesh>
        )
      })}
    </group>
  )
}
