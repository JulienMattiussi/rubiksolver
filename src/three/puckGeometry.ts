import * as THREE from 'three'
import { puckNumber, puckPlace } from '@/lib/puck'
import type { Cubie } from '@/lib/types'
import type { DecalPlace, P3, PiecePolygon } from './polygons'

/**
 * Geometry of the Hockey Puck's pieces (lib/puck.ts): each a sector of a
 * ring, its twelfth of its layer, colored all round in its pair's color but
 * where it touches the other layer, its cuts and the side against the
 * center (dark); a top piece's number in gold on its numbered face only
 * (`puckNumberPicture`, laid as a decal). The center is two black half
 * discs, the puck's whole height.
 */

/** The ring's radii, a layer's thickness, and the seams. */
const OUTER = 1.6
const INNER = 0.72
const LAYER = 0.36
const SEAM = 0.012
const ARC = 8

/** The puzzle lying flat, its top up: the model's plane turned onto the
 *  scene's floor (a quarter turn about x, its z going up). */
export const PUCK_ORIENT: readonly [number, number, number, number] = [
  -Math.SQRT1_2,
  0,
  0,
  Math.SQRT1_2,
]

const rad = (deg: number) => (deg * Math.PI) / 180
const at = (r: number, deg: number, z: number): P3 => [
  r * Math.cos(rad(deg)),
  r * Math.sin(rad(deg)),
  z,
]

type Paint = PiecePolygon['paint']

/** The polygons of a ring sector between two angles (degrees, `from` the
 *  greater), two radii and two heights: its top and bottom painted as
 *  told, its outer side as its top or bottom if colored, the rest dark. */
function sector(
  [from, to]: readonly [number, number],
  [inner, outer]: readonly [number, number],
  [low, high]: readonly [number, number],
  [top, bottom]: readonly [Paint, Paint],
  arc = ARC,
): PiecePolygon[] {
  const angles = Array.from({ length: arc + 1 }, (_, i) => from + ((to - from) * i) / arc)
  const side: Paint = top !== 'body' ? top : bottom
  const out: PiecePolygon[] = []
  // Top and bottom, counter-clockwise seen from each.
  const face = (z: number) => [
    ...angles.map((a) => at(outer, a, z)),
    ...[...angles].reverse().map((a) => at(inner, a, z)),
  ]
  out.push({ points: face(high).reverse(), paint: top, normal: [0, 0, 1] })
  out.push({ points: face(low), paint: bottom, normal: [0, 0, -1] })
  // The outer side, curved, and the inner one.
  for (let i = 0; i < arc; i++) {
    const [a, b] = [angles[i]!, angles[i + 1]!]
    const mid = rad((a + b) / 2)
    const n: P3 = [Math.cos(mid), Math.sin(mid), 0]
    const wall = (r: number) => [at(r, a, low), at(r, b, low), at(r, b, high), at(r, a, high)]
    out.push({ points: wall(outer).reverse(), paint: side, normal: n })
    out.push({ points: wall(inner), paint: 'body', normal: [-n[0], -n[1], 0] })
  }
  // The two cuts.
  for (const [a, sign] of [
    [from, 1],
    [to, -1],
  ] as const) {
    const n: P3 = [sign * -Math.sin(rad(a)), sign * Math.cos(rad(a)), 0]
    const quad = [at(inner, a, low), at(outer, a, low), at(outer, a, high), at(inner, a, high)]
    out.push({ points: sign > 0 ? quad : quad.reverse(), paint: 'body', normal: n })
  }
  return out
}

const SHAPES = new Map<string, PiecePolygon[]>()

/** Every polygon of a piece, as it stands (or a half of the center). */
export function puckPolygons(cubie: Cubie): PiecePolygon[] {
  const place = puckPlace(cubie.position)
  const color = cubie.stickers[0]?.color
  const outward = cubie.stickers[0]?.normal[2]
  const id = place ? `${place.m}:${place.z}:${color}:${outward}` : cubie.position.join()
  const known = SHAPES.get(id)
  if (known) return known
  let polygons: PiecePolygon[]
  if (!place) {
    // A half of the center, right (x > 0) or left of the slash's line, the
    // whole puck's height, round; its faces graphite, kept off the line (a
    // dark seam there shows the pivot, as on the star prisms' screw).
    const right = cubie.position[0] > 0
    const half: [number, number] = right ? [90, -90] : [270, 90]
    const plate = (z: number): PiecePolygon => {
      const shift = right ? 0.035 : -0.035
      const points = Array.from({ length: 49 }, (_, i) =>
        at(INNER - 0.06, half[0] + (half[1] - half[0]) * (i / 48), z),
      ).map(([x, y]): P3 => [x + shift, y, z])
      const up = z > 0
      return { points: up ? points.reverse() : points, paint: 'H', normal: [0, 0, up ? 1 : -1] }
    }
    polygons = [
      ...sector(half, [0.001, INNER - SEAM], [-LAYER, LAYER], ['body', 'body'], 48),
      plate(LAYER + 0.004),
      plate(-LAYER - 0.004),
    ]
  } else {
    const span: [number, number] = [90 - 30 * place.m - 0.5, 60 - 30 * place.m + 0.5]
    const heights: [number, number] = place.z > 0 ? [SEAM, LAYER] : [-LAYER, -SEAM]
    // Its colored face out of the puck, its hidden one against the other layer.
    const paints: [Paint, Paint] = outward! > 0 ? [color!, 'body'] : ['body', color!]
    polygons = sector(span, [INNER, OUTER], heights, paints)
  }
  SHAPES.set(id, polygons)
  return polygons
}

/** The thumbnail's: no cuts nor inner sides (drawn flat in depth order,
 *  they would show as dark teeth), the center's top only. */
export const puckThumbnail = (cubie: Cubie): PiecePolygon[] =>
  puckPolygons(cubie).filter(
    (p, i) => p.paint !== 'body' || (!puckPlace(cubie.position) && i === 0),
  )

/** Whether a piece has a number to show: a top piece. */
export const numbered = (cubie: Cubie): boolean =>
  puckPlace(cubie.position) !== undefined && puckNumber(cubie) !== undefined

/** Where a piece's number lies: in the middle of its numbered face,
 *  upright from the rim. */
export function puckNumberPlace(cubie: Cubie): DecalPlace {
  const place = puckPlace(cubie.position)!
  const up = cubie.stickers[0]!.normal[2]
  const mid = 75 - 30 * place.m
  const r = (OUTER + INNER) / 2
  const z = place.z > 0 ? (up > 0 ? LAYER : SEAM) : up > 0 ? -SEAM : -LAYER
  return {
    center: at(r, mid, z + up * 0.005),
    normal: [0, 0, up],
    up: [Math.cos(rad(mid)), Math.sin(rad(mid)), 0],
    size: 0.62,
  }
}

const PICTURES = new Map<number, THREE.Texture>()

/** A piece's number, in gold on a clear ground, drawn once. */
export function puckNumberPicture(cubie: Cubie): THREE.Texture {
  const n = puckNumber(cubie)!
  let picture = PICTURES.get(n)
  if (picture) return picture
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const g = canvas.getContext('2d')!
  g.fillStyle = '#d9b45a'
  g.font = `bold ${n > 9 ? 64 : 80}px sans-serif`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText(String(n), size / 2, size / 2 + 4)
  picture = new THREE.CanvasTexture(canvas)
  picture.colorSpace = THREE.SRGBColorSpace
  PICTURES.set(n, picture)
  return picture
}
