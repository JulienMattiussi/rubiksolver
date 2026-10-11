import { useMemo } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { Cubie } from '@/lib/types'
import { COLOR_HEX, HIGHLIGHT, PLASTIC } from './colors'
import { starPolygons, type StarPolygon } from './starGeometry'

/** A convex polygon as a triangle fan. */
function polygonGeometry(polygon: StarPolygon): THREE.BufferGeometry {
  const positions: number[] = []
  const [first, ...rest] = polygon.points
  for (let i = 0; i < rest.length - 1; i++) positions.push(...first!, ...rest[i]!, ...rest[i + 1]!)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute(
    'normal',
    new THREE.Float32BufferAttribute(
      positions.map((_, i) => polygon.normal[i % 3]!),
      3,
    ),
  )
  return geometry
}

interface StarPieceProps {
  cubie: Cubie
  /** The 4-star (four layers). */
  tall: boolean
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

/** One piece of a star prism (a point or a screw half): its body faces in
 *  plastic, its stickers in their colors. In edit mode its stickers show
 *  what is painted and take clicks. */
export function StarPiece({
  cubie,
  tall,
  highlighted = false,
  stickerHex,
  onSelect,
}: StarPieceProps) {
  const polygons = useMemo(
    () =>
      starPolygons(cubie, tall).map((p) => ({
        paint: p.paint,
        ni: p.ni,
        geometry: polygonGeometry(p),
      })),
    [cubie, tall],
  )
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
