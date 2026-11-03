import * as THREE from 'three'
import { normalIndex } from '@/lib/core/geometry'
import { sectorFaced, sectorPlace } from '@/lib/puzzles/shared/sectors'
import type { Cubie } from '@/lib/core/types'
import type { P3, PiecePolygon } from '../../core/polygons'

/**
 * Geometry of the Square-1's pieces (lib/puzzles/twisted/square1.ts), in
 * the model's frame (z up out of its top): each piece a prism of its
 * outline, its layer's height. An edge is the triangle from the axis to its
 * twelfth of a side, a corner the kite from the axis to the cube's corner,
 * a middle half the square cut along the slash's line (mirrored, flipped).
 * Each outer face takes the color of the sticker facing its way; the cuts
 * are the plastic body. As the pieces move, the shape follows.
 */

/** Half the cube's side, the middle layer's half height, and the seams. */
const S = 1.5
const MID = 0.5
const SEAM = 0.015

const rad = (deg: number) => (deg * Math.PI) / 180

/** The direction a sector faces, in degrees (shared/sectors.ts). */
const facing = (m: number) => 75 - 30 * m

const polar = (r: number, deg: number): [number, number] => [
  r * Math.cos(rad(deg)),
  r * Math.sin(rad(deg)),
]

/** How far a side's twelfth reaches from the axis, along its edge. */
const SIDE = S / Math.cos(rad(15))
/** How far the cube's corner is. */
const CORNER = S * Math.SQRT2

/** A layer piece's outline, where it stands: an edge's triangle round its
 *  sector's direction, a corner's kite round its boundary's. */
function layerOutline(m: number, wide: boolean): [number, number][] {
  if (!wide) {
    const a = facing(m)
    return [[0, 0], polar(SIDE, a - 15), polar(SIDE, a + 15)]
  }
  const b = 90 - 30 * m
  return [[0, 0], polar(SIDE, b - 30), polar(CORNER, b), polar(SIDE, b + 30)]
}

/** The right middle half's outline, the square right of the slash's line;
 *  the left one its half turn, a flipped one its mirror. */
const RIGHT_HALF: [number, number][] = [
  [0, -SIDE],
  polar(CORNER, -30),
  polar(CORNER, 60),
  [0, SIDE],
]

function middleOutline(cubie: Cubie): [number, number][] {
  const right = cubie.position[0] > 0
  // Flipped: its sides face sectors 0, 3, 6 rather than 2, 5, 11.
  const flipped = cubie.stickers.some((s) => sectorFaced(s.normal) === 3)
  const half = flipped
    ? RIGHT_HALF.map(([x, y]): [number, number] => [x, -y]).reverse()
    : RIGHT_HALF
  return right ? half : half.map(([x, y]): [number, number] => [-x, -y])
}

/** A piece's outline seen from above, where it stands, counterclockwise:
 *  its drawing's prisms (and through them, its entry's pictures). */
function square1Outline(cubie: Cubie): [number, number][] {
  const place = sectorPlace(cubie.position)
  return place ? layerOutline(place.m, place.wide) : middleOutline(cubie)
}

/** A prism: its outline (counterclockwise seen from above), its heights,
 *  its outer faces colored by the stickers facing their ways, its top or
 *  bottom by the one along z. */
function prism(
  outline: readonly (readonly [number, number])[],
  [low, high]: readonly [number, number],
  cubie: Cubie,
): PiecePolygon[] {
  const cap = (up: boolean) => cubie.stickers.find((s) => s.normal[2] === (up ? 1 : -1))
  const out: PiecePolygon[] = []
  for (const up of [true, false]) {
    const z = up ? high : low
    const points = outline.map(([x, y]): P3 => [x, y, z])
    const sticker = cap(up)
    out.push({
      points: up ? points : [...points].reverse(),
      paint: sticker?.color ?? 'body',
      normal: [0, 0, up ? 1 : -1],
      ...(sticker && { ni: normalIndex(sticker.normal) }),
    })
  }
  outline.forEach(([x1, y1], i) => {
    const [x2, y2] = outline[(i + 1) % outline.length]!
    const length = Math.hypot(x2 - x1, y2 - y1)
    if (length < 1e-9) return
    // Outward: to the right of the way round, counterclockwise.
    const normal: P3 = [(y2 - y1) / length, -(x2 - x1) / length, 0]
    const angle = (Math.atan2(normal[1], normal[0]) * 180) / Math.PI
    const sticker = cubie.stickers.find((s) => {
      const m = sectorFaced(s.normal)
      return m !== undefined && Math.abs(((facing(m) - angle + 540) % 360) - 180) < 1
    })
    out.push({
      points: [
        [x1, y1, low],
        [x2, y2, low],
        [x2, y2, high],
        [x1, y1, high],
      ],
      paint: sticker?.color ?? 'body',
      normal,
      ...(sticker && { ni: normalIndex(sticker.normal) }),
    })
  })
  return out
}

/** A little inward, so that pieces side by side show their seams. */
const shrunk = (outline: [number, number][]): [number, number][] => {
  const [cx, cy] = outline.reduce(
    ([a, b], [x, y]) => [a + x / outline.length, b + y / outline.length],
    [0, 0],
  )
  return outline.map(([x, y]) => {
    const d = Math.hypot(x - cx, y - cy) || 1
    return [x - ((x - cx) / d) * SEAM, y - ((y - cy) / d) * SEAM]
  })
}

const SHAPES = new Map<string, PiecePolygon[]>()

/** Every polygon of a piece, as it stands. */
export function square1Polygons(cubie: Cubie): PiecePolygon[] {
  const id = `${cubie.position.join()}|${cubie.stickers.map((s) => s.normal.join() + s.color).join()}`
  const known = SHAPES.get(id)
  if (known) return known
  const place = sectorPlace(cubie.position)
  const heights: [number, number] = !place
    ? [-MID + SEAM, MID - SEAM]
    : place.z > 0
      ? [MID + SEAM, S]
      : [-S, -MID - SEAM]
  const polygons = prism(shrunk(square1Outline(cubie)), heights, cubie)
  SHAPES.set(id, polygons)
  return polygons
}

/** The thumbnail's: its colored faces only (drawn flat in depth order, the
 *  cuts would show as dark teeth). */
export const square1Thumbnail = (cubie: Cubie): PiecePolygon[] =>
  square1Polygons(cubie).filter((p) => p.paint !== 'body')

/** Standing as a cube, its top up, a side squarely in front: the model's
 *  plane turned onto the scene's floor, its sides turned a 24th back (they
 *  face 15 degrees off the slash's line). */
export const SQUARE1_ORIENT: readonly [number, number, number, number] = (() => {
  const q = new THREE.Quaternion()
    .setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2)
    .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rad(-15)))
  return [q.x, q.y, q.z, q.w]
})()
