import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { Cubie } from '@/lib/types'
import { COLOR_HEX, HIGHLIGHT, PLASTIC } from './colors'
import { paintable } from './paintable'
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
   *  while unpainted; none: its own color), and what a click on it does. */
  stickerHex?: (ni: number) => string | undefined
  onSelect?: (ni: number) => void
  /** Edit mode: told when the pointer comes onto a sticker and leaves, and
   *  the sticker to light up (its normal index). */
  onHover?: (ni: number, on: boolean) => void
  lit?: number | null
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
  onHover,
  lit = null,
}: PolyPieceProps) {
  const polygons = useMemo(() => merged(drawing.polygons(cubie)), [cubie, drawing])
  // Each turn hands a moved piece new geometries: the old ones freed (their
  // GPU buffers too), else every turn would leave some behind.
  useEffect(() => () => polygons.forEach((p) => p.geometry.dispose()), [polygons])
  return (
    <group>
      {polygons.map(({ paint, ni, geometry }, i) => {
        const hex =
          paint === 'body'
            ? PLASTIC
            : ((ni !== undefined ? stickerHex?.(ni) : undefined) ??
              drawing.skin ??
              COLOR_HEX[paint])
        const clickable = onSelect && ni !== undefined
        // The sticker under the pointer, lit up in its own color.
        const on = paint !== 'body' && ni !== undefined && ni === lit
        return (
          <mesh
            key={i}
            geometry={geometry}
            {...paintable(
              clickable ? () => onSelect(ni) : undefined,
              onHover && ni !== undefined ? (over: boolean) => onHover(ni, over) : undefined,
            )}
          >
            <meshStandardMaterial
              color={hex}
              roughness={paint === 'body' ? 0.65 : 0.4}
              metalness={paint === 'body' ? 0.1 : 0.05}
              side={THREE.DoubleSide}
              emissive={paint === 'body' ? HIGHLIGHT : hex}
              emissiveIntensity={on ? 0.5 : highlighted ? (paint === 'body' ? 0.7 : 0.25) : 0}
              polygonOffset={paint !== 'body'}
              polygonOffsetFactor={-1}
            />
          </mesh>
        )
      })}
    </group>
  )
}
