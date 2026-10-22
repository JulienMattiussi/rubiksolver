import * as THREE from 'three'
import type { Vec3 } from '@/lib/core/types'
import blockUrl from '@/assets/gear/block.png'
import centerUrl from '@/assets/gear/center.png'
import clipUrl from '@/assets/gear/clip.png'
import cornerUrl from '@/assets/gear/corner.png'
import gearUrl from '@/assets/gear/gear.png'
import OUTLINES from '@/assets/gear/outlines.json'
import { dot, mapVec } from '@/lib/core/geometry'

/**
 * The Gear Cube's face, as agreed on a flat drawing: 13 pieces, each a mask
 * over the whole face (white where the piece is), drawn once for one piece
 * of each kind at a set place (a corner top right, a gear and a clip at the
 * top, the center), the others turned a quarter at a time. In 3D a piece is
 * a plate over its face, cut out by its mask (alpha test), in its color.
 */

/** The Gear Cubes' piece kinds; a block is the Extreme's middle-layer edge
 *  (no gear: its clip part of it). */
export type GearPiece = 'corner' | 'gear' | 'clip' | 'center' | 'block'

const URLS: Record<GearPiece, string> = {
  corner: cornerUrl,
  gear: gearUrl,
  clip: clipUrl,
  center: centerUrl,
  block: blockUrl,
}

/** Where each kind's mask sits on the face, in cells (x right, y down). */
const HOME: Record<GearPiece, readonly [number, number]> = {
  corner: [1, -1],
  gear: [0, -1],
  clip: [0, -1],
  center: [0, 0],
  block: [0, -1],
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
  const unit = (i: number) => mapVec([0, 1, 2], (k) => (k === i ? 1 : 0))
  return [unit((a + 1) % 3), unit((a + 2) % 3)]
}

/** A quarter turn clockwise on the drawing (y down): top goes right. */
const turn = ([x, y]: readonly [number, number]): [number, number] => [-y, x]

/**
 * Where a point of a kind's drawing (centered, in a 3x3x3's units: -1.5 to
 * 1.5, x right, y down) lands for the piece at `position` on the face of
 * normal `normal`, `height` above the face (in the cubie's frame): the
 * drawing turned the quarters that bring its own cell to the piece's.
 */
function placer(kind: GearPiece, position: Vec3, normal: Vec3) {
  const [ux, uy] = faceAxes(normal)
  const cell: [number, number] = [dot(position, ux), dot(position, uy)]
  let k = 0
  let at: [number, number] = [...HOME[kind]]
  while (at[0] !== cell[0] || at[1] !== cell[1]) {
    at = turn(at)
    if (++k > 3) throw new Error(`gearFace: no ${kind} at ${cell.join()}`)
  }
  return (x: number, y: number, height: number): number[] => {
    let p: [number, number] = [x, y]
    for (let i = 0; i < k; i++) p = turn(p)
    return [0, 1, 2].map(
      (i) => normal[i]! * (1.5 + height) + p[0] * ux[i]! + p[1] * uy[i]! - position[i]!,
    )
  }
}

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
  const place = placer(kind, position, normal)
  const positions: number[] = []
  const uvs: number[] = []
  for (const [x, y] of [
    [-1.5, -1.5],
    [1.5, -1.5],
    [1.5, 1.5],
    [-1.5, -1.5],
    [1.5, 1.5],
    [-1.5, 1.5],
  ] as const) {
    positions.push(...place(x, y, lift))
    uvs.push(x / 3 + 0.5, 0.5 - y / 3)
  }
  geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.computeVertexNormals()
  GEOMETRIES.set(id, geometry)
  return geometry
}

/** How deep each kind's body goes under its face. */
const DEPTH: Record<GearPiece, number> = {
  corner: 0.45,
  gear: 0.42,
  center: 0.45,
  clip: 0.2,
  block: 0.45,
}
/** How much an outline is drawn in: its plate's corners are rounded, the
 *  body's are not. */
const SHRINK = 0.015

/**
 * A piece's body under one of its faces: its kind's outline
 * (outlines.json: its polygons, as drawn) drawn in a hair and pushed down
 * into the cube, so its black sides follow its shape (a box would hide the
 * gears' teeth as they swing out).
 */
export function pieceBody(kind: GearPiece, position: Vec3, normal: Vec3): THREE.BufferGeometry {
  const id = ['body', kind, position.join(), normal.join()].join('|')
  let geometry = GEOMETRIES.get(id)
  if (geometry) return geometry
  const place = placer(kind, position, normal)
  const positions: number[] = []
  const triangle = (a: number[], b: number[], c: number[]) => positions.push(...a, ...b, ...c)
  for (const outline of OUTLINES[kind] as [number, number][][]) {
    const points = outline.map(([x, y]) => [x / 100 - 1.5, y / 100 - 1.5] as const)
    const cx = points.reduce((s, p) => s + p[0], 0) / points.length
    const cy = points.reduce((s, p) => s + p[1], 0) / points.length
    const inward = points.map(([x, y]) => {
      const d = Math.hypot(x - cx, y - cy) || 1
      return [x - ((x - cx) / d) * SHRINK, y - ((y - cy) / d) * SHRINK] as const
    })
    const top = inward.map(([x, y]) => place(x, y, -0.002))
    const bottom = inward.map(([x, y]) => place(x, y, -DEPTH[kind]))
    for (let i = 0; i < inward.length; i++) {
      const j = (i + 1) % inward.length
      triangle(top[i]!, top[j]!, bottom[j]!)
      triangle(top[i]!, bottom[j]!, bottom[i]!)
    }
    // Its two caps (the outline need not be convex: a corner's is not).
    const flat = inward.map(([x, y]) => new THREE.Vector2(x, y))
    for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(flat, [])) {
      triangle(top[a!]!, top[b!]!, top[c!]!)
      triangle(bottom[a!]!, bottom[c!]!, bottom[b!]!)
    }
  }
  geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  GEOMETRIES.set(id, geometry)
  return geometry
}
