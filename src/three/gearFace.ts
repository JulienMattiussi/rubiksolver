import * as THREE from 'three'
import type { Vec3 } from '@/lib/types'
import centerUrl from '@/assets/gear/center.png'
import clipUrl from '@/assets/gear/clip.png'
import cornerUrl from '@/assets/gear/corner.png'
import gearUrl from '@/assets/gear/gear.png'

/**
 * The Gear Cube's face, as agreed on a flat drawing: 13 pieces, each a mask
 * over the whole face (white where the piece is), drawn once for one piece
 * of each kind at a set place (a corner top right, a gear and a clip at the
 * top, the center), the others turned a quarter at a time. In 3D a piece is
 * a plate over its face, cut out by its mask (alpha test), in its color.
 */

export type GearPiece = 'corner' | 'gear' | 'clip' | 'center'

const URLS: Record<GearPiece, string> = {
  corner: cornerUrl,
  gear: gearUrl,
  clip: clipUrl,
  center: centerUrl,
}

/** Where each kind's mask sits on the face, in cells (x right, y down). */
const HOME: Record<GearPiece, readonly [number, number]> = {
  corner: [1, -1],
  gear: [0, -1],
  clip: [0, -1],
  center: [0, 0],
}

const loader = new THREE.TextureLoader()
const textures = new Map<GearPiece, THREE.Texture>()

/** A kind's mask, loaded once. */
export function gearMask(kind: GearPiece): THREE.Texture {
  let texture = textures.get(kind)
  if (!texture) {
    texture = loader.load(URLS[kind])
    texture.anisotropy = 4
    textures.set(kind, texture)
  }
  return texture
}

/** Two directions across a face, for its drawing's x (right) and y (down). */
function faceAxes(normal: Vec3): [Vec3, Vec3] {
  const a = normal.findIndex((v) => v !== 0)
  const unit = (i: number) => [0, 1, 2].map((k) => (k === i ? 1 : 0)) as unknown as Vec3
  return [unit((a + 1) % 3), unit((a + 2) % 3)]
}

const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
/** A quarter turn clockwise on the drawing (y down): top goes right. */
const turn = ([x, y]: readonly [number, number]): [number, number] => [-y, x]

const GEOMETRIES = new Map<string, THREE.BufferGeometry>()

/**
 * The plate of a piece of `kind` on the face of normal `normal`, for the
 * cubie at `position` (in its frame, a 3x3x3's cell 1 wide), `lift` above
 * the face: the whole face as a quad, its mask turned to the piece's cell.
 */
export function gearPlate(
  kind: GearPiece,
  position: Vec3,
  normal: Vec3,
  lift: number,
): THREE.BufferGeometry {
  const id = [kind, position.join(), normal.join(), lift].join('|')
  let geometry = GEOMETRIES.get(id)
  if (geometry) return geometry
  const [ux, uy] = faceAxes(normal)
  const cell: [number, number] = [dot(position, ux), dot(position, uy)]
  // The quarter turns bringing the mask's own cell to this one.
  let k = 0
  let at: [number, number] = [...HOME[kind]]
  while (at[0] !== cell[0] || at[1] !== cell[1]) {
    at = turn(at)
    if (++k > 3) throw new Error(`gearPlate: no ${kind} at ${cell.join()}`)
  }
  // Each corner of the quad, and where it reads the mask: its spot turned
  // back k quarters.
  const positions: number[] = []
  const uvs: number[] = []
  const corner = (x: number, y: number) => {
    const p = [0, 1, 2].map(
      (i) => normal[i]! * (1.5 + lift) + x * ux[i]! + y * uy[i]! - position[i]!,
    )
    positions.push(...p)
    let back: [number, number] = [x, y]
    for (let i = 0; i < (4 - k) % 4; i++) back = turn(back)
    uvs.push(back[0] / 3 + 0.5, 0.5 - back[1] / 3)
  }
  for (const [x, y] of [
    [-1.5, -1.5],
    [1.5, -1.5],
    [1.5, 1.5],
    [-1.5, -1.5],
    [1.5, 1.5],
    [-1.5, 1.5],
  ] as const)
    corner(x, y)
  geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.computeVertexNormals()
  GEOMETRIES.set(id, geometry)
  return geometry
}
