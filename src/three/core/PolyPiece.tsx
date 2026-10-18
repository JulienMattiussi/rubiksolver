import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { Cubie } from '@/lib/core/types'
import { COLOR_HEX, HIGHLIGHT, PLACE, PLASTIC } from './colors'
import { hatchTexture } from './hatchTexture'
import { paintable } from './paintable'
import type { PolyDrawing } from './polyDrawing'
import type { PiecePolygon } from './polygons'
import { usePulse } from './usePulse'

/** How many hatching tiles a unit of the drawing spans. */
const UV_SCALE = 1.5

/** Convex polygons as one geometry, each a triangle fan with its own normal
 *  (or one per point, on a curved surface), its texture laid flat on its
 *  plane (the tutorial's hatching). */
function polygonsGeometry(polygons: readonly PiecePolygon[]): THREE.BufferGeometry {
  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  for (const { points, normal, normals: smooth } of polygons) {
    const normalAt = (i: number) => smooth?.[i] ?? normal
    const origin = new THREE.Vector3(...points[0]!)
    const u = new THREE.Vector3(...points[1]!).sub(origin).normalize()
    const v = new THREE.Vector3(...normal).cross(u)
    const uvAt = (i: number) => {
      const p = new THREE.Vector3(...points[i]!).sub(origin)
      return [p.dot(u) * UV_SCALE, p.dot(v) * UV_SCALE]
    }
    for (let i = 1; i < points.length - 1; i++) {
      positions.push(...points[0]!, ...points[i]!, ...points[i + 1]!)
      normals.push(...normalAt(0), ...normalAt(i), ...normalAt(i + 1))
      uvs.push(...uvAt(0), ...uvAt(i), ...uvAt(i + 1))
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
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
  /** The tutorial's: hatched (a formula moves it, not placed yet), marked
   *  (it stands where a formula takes its piece), its glow pulsing, and a
   *  click on it. */
  hatched?: boolean
  marked?: boolean
  pulse?: boolean
  onPick?: () => void
  onPickHover?: (on: boolean) => void
  /** Edit mode: the hex shown by the sticker of normal index `ni` (gray
   *  while unpainted; none: its own color), and what a click on it does. */
  stickerHex?: (ni: number) => string | undefined
  onSelect?: (ni: number, at: readonly [number, number, number]) => void
  /** Edit mode: told when the pointer comes onto a sticker and leaves, and
   *  the sticker to light up (its normal index). */
  onHover?: (ni: number, on: boolean) => void
  lit?: number | null
}

/** One mesh of a piece: the body in plastic, or a sticker in its color,
 *  lit as its piece is (its glow pulsing in the tutorial). */
function PolyMesh({
  geometry,
  body,
  hex,
  level,
  marked,
  hatched,
  pulse,
  pointer,
}: {
  geometry: THREE.BufferGeometry
  body: boolean
  hex: string
  /** Its glow, steady. */
  level: number
  marked: boolean
  hatched: boolean
  pulse: boolean
  pointer: ReturnType<typeof paintable>
}) {
  const materialRef = usePulse(pulse, level)
  const striped = hatched && !body
  return (
    <mesh geometry={geometry} {...pointer}>
      <meshStandardMaterial
        ref={materialRef}
        // Its own material hatched or not: a map added later is not drawn.
        key={striped ? 'hatched' : 'plain'}
        color={hex}
        map={striped ? hatchTexture() : null}
        roughness={body ? 0.65 : 0.4}
        metalness={body ? 0.1 : 0.05}
        side={THREE.DoubleSide}
        emissive={body ? (marked ? PLACE : HIGHLIGHT) : hex}
        emissiveIntensity={level}
        polygonOffset={!body}
        polygonOffsetFactor={-1}
      />
    </mesh>
  )
}

/** One piece of a gridless puzzle (a star point, a screw half, a Pyraminx
 *  tip...): its body faces in plastic, its stickers in their colors. In edit
 *  mode its stickers show what is painted and take clicks. */
export function PolyPiece({
  cubie,
  drawing,
  highlighted = false,
  hatched = false,
  marked = false,
  pulse = false,
  onPick,
  onPickHover,
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
        const glow = highlighted || marked
        return (
          <PolyMesh
            key={i}
            geometry={geometry}
            body={paint === 'body'}
            hex={hex}
            level={on ? 0.5 : glow ? (paint === 'body' ? 0.7 : 0.25) : 0}
            marked={marked}
            hatched={hatched}
            pulse={pulse && glow}
            pointer={
              clickable
                ? paintable(
                    (at) => onSelect(ni, at),
                    onHover ? (over: boolean) => onHover(ni, over) : undefined,
                  )
                : paintable(onPick && (() => onPick()), onPick && onPickHover)
            }
          />
        )
      })}
    </group>
  )
}
