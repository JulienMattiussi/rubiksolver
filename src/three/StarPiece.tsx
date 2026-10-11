import { useMemo } from 'react'
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

/** One piece of the star prism (a point or a screw half): its body faces in
 *  plastic, its stickers in their colors. */
export function StarPiece({ cubie, highlighted = false }: { cubie: Cubie; highlighted?: boolean }) {
  const polygons = useMemo(
    () => starPolygons(cubie).map((p) => ({ paint: p.paint, geometry: polygonGeometry(p) })),
    [cubie],
  )
  return (
    <group>
      {polygons.map(({ paint, geometry }, i) => (
        <mesh key={i} geometry={geometry}>
          <meshStandardMaterial
            color={paint === 'body' ? PLASTIC : COLOR_HEX[paint]}
            roughness={paint === 'body' ? 0.65 : 0.4}
            metalness={paint === 'body' ? 0.1 : 0.05}
            side={THREE.DoubleSide}
            emissive={paint === 'body' ? HIGHLIGHT : COLOR_HEX[paint]}
            emissiveIntensity={highlighted ? (paint === 'body' ? 0.7 : 0.25) : 0}
            polygonOffset={paint !== 'body'}
            polygonOffsetFactor={-1}
          />
        </mesh>
      ))}
    </group>
  )
}
