import { cubeDims, faceColorsOf, solvedCube } from '@/lib/cube'
import { normalIndex } from '@/lib/geometry'
import { cubieBox, LAYER_THICKNESS } from '@/lib/shape'
import { lookOf } from '@/lib/forms'
import {
  hasColoredClips,
  isGear,
  isPolyDrawn,
  isStar,
  type Color,
  type Cube,
  type CubeShape,
  type CubeVariant,
} from '@/lib/types'
import { visualPosition } from './layout'
import OUTLINES from '@/assets/gear/outlines.json'
import { inScene, polyDrawing } from './polyDrawing'

/**
 * Flat isometric drawing of a solved puzzle, for its picker thumbnail: the
 * puzzle seen from its up-front-right corner, so its U, F and R faces show.
 * Derived from the same layout and cubie boxes as the 3D view, so a new shape
 * (or the mirror skin) gets its thumbnail for free.
 */

type Point = readonly [number, number, number]

/** The three visible faces, with how much darker each is drawn (a lit top). */
const VISIBLE = [
  { axis: 1, shade: 0 }, // U
  { axis: 2, shade: 0.12 }, // F
  { axis: 0, shade: 0.28 }, // R
] as const

/** Share of a face its sticker covers (the rest shows the plastic body). */
const STICKER_SCALE = 0.8

const COS30 = Math.cos(Math.PI / 6)

function project([x, y, z]: Point): [number, number] {
  return [(x - z) * COS30, (x + z) / 2 - y]
}

interface IsoPolygon {
  /** SVG `points` attribute. */
  readonly points: string
  /** The plastic body, or a sticker of this color. */
  readonly paint: 'body' | Color
  /** Darkening of the face (0 = full light). */
  readonly shade: number
}

export interface IsoDrawing {
  readonly polygons: readonly IsoPolygon[]
  readonly viewBox: string
}

/** Corners of a box face, `axis` being the face normal (+1 side). */
function faceCorners(min: Point, max: Point, axis: 0 | 1 | 2): Point[] {
  const [u, v] = [(axis + 1) % 3, (axis + 2) % 3]
  const corner = (a: number, b: number): Point => {
    const p = [0, 0, 0]
    p[axis] = max[axis]
    p[u] = a ? max[u]! : min[u]!
    p[v] = b ? max[v]! : min[v]!
    return p as unknown as Point
  }
  return [corner(0, 0), corner(1, 0), corner(1, 1), corner(0, 1)]
}

/** The same polygon shrunk towards its center. */
function shrink(points: Point[], scale: number): Point[] {
  const c = [0, 1, 2].map((a) => points.reduce((s, p) => s + p[a]!, 0) / points.length)
  return points.map((p) => p.map((v, a) => c[a]! + (v - c[a]!) * scale) as unknown as Point)
}

const toSvg = (points: Point[]): string =>
  points
    .map((p) =>
      project(p)
        .map((v) => v.toFixed(3))
        .join(','),
    )
    .join(' ')

const DRAWINGS = new Map<string, IsoDrawing>()

/** The drawing of a solved puzzle, computed once per session (every picker
 *  tile and the picker button share it). */
export function isometricDrawing(shape: CubeShape, variant: CubeVariant): IsoDrawing {
  const key = `${shape}:${variant}`
  let drawing = DRAWINGS.get(key)
  if (!drawing) {
    drawing = drawPuzzle(shape, variant)
    DRAWINGS.set(key, drawing)
  }
  return drawing
}

function drawPuzzle(shape: CubeShape, variant: CubeVariant): IsoDrawing {
  if (isPolyDrawn(shape)) return drawPoly(shape)
  if (isGear(shape)) return drawGear(shape)
  return drawCubies(solvedCube(shape), variant)
}

const FORM_DRAWINGS = new Map<string, IsoDrawing>()

/** The drawing of a form of a shape-shifting puzzle (forms.ts): its pieces
 *  as they stand, every sticker in one neutral color (only the form shows). */
export function formDrawing(shape: CubeShape, form: Cube): IsoDrawing {
  const key = `${shape}|${lookOf(form)}`
  let drawing = FORM_DRAWINGS.get(key)
  if (!drawing) {
    drawing = isPolyDrawn(shape) ? drawPoly(shape, form, 'W') : drawCubies(form, 'classic', 'W')
    FORM_DRAWINGS.set(key, drawing)
  }
  return drawing
}

/** A grid puzzle's cubies as they stand (`neutral`: every sticker that color). */
function drawCubies(cube: Cube, variant: CubeVariant, neutral?: Color): IsoDrawing {
  const dims = cubeDims(cube)
  const cells = new Set(cube.map((c) => visualPosition(c.position, dims).join()))
  const faces: IsoFace[] = []
  for (const cubie of cube) {
    const { size, center } = cubieBox(cubie.stickers, LAYER_THICKNESS[variant])
    const cell = visualPosition(cubie.position, dims)
    const mid = cell.map((v, a) => v + center[a]!)
    const min = mid.map((v, a) => v - size[a]! / 2) as unknown as Point
    const max = mid.map((v, a) => v + size[a]! / 2) as unknown as Point
    for (const { axis, shade } of VISIBLE) {
      const sticker = cubie.stickers.find((s) => normalIndex(s.normal) === 2 * axis)
      // A face without sticker shows its plastic, unless a neighbor hides it
      // (out of its box, a tower bares some).
      const beside = cell.map((v, a) => (a === axis ? v + 1 : v)).join()
      if (!sticker && cells.has(beside)) continue
      const corners = faceCorners(min, max, axis)
      faces.push({
        depth: mid[0]! + mid[1]! + mid[2]! + max[axis]! - mid[axis]!,
        polygons: [
          { points: toSvg(corners), paint: 'body', shade },
          ...(sticker
            ? [
                {
                  points: toSvg(shrink(corners, STICKER_SCALE)),
                  paint: neutral ?? sticker.color,
                  shade,
                },
              ]
            : []),
        ],
      })
    }
  }
  return finish(faces)
}

interface IsoFace {
  readonly depth: number
  readonly polygons: IsoPolygon[]
}

/** Painter's order (farthest from the viewer first), then a viewBox fitted
 *  around everything drawn. */
function finish(faces: IsoFace[]): IsoDrawing {
  const polygons = [...faces].sort((a, b) => a.depth - b.depth).flatMap((f) => f.polygons)
  const xs: number[] = []
  const ys: number[] = []
  for (const { points } of polygons) {
    for (const pair of points.split(' ')) {
      const [x, y] = pair.split(',').map(Number)
      xs.push(x!)
      ys.push(y!)
    }
  }
  const pad = 0.15
  const [x0, y0] = [Math.min(...xs) - pad, Math.min(...ys) - pad]
  const [w, h] = [Math.max(...xs) - x0 + pad, Math.max(...ys) - y0 + pad]
  return { polygons, viewBox: `${x0.toFixed(3)} ${y0.toFixed(3)} ${w.toFixed(3)} ${h.toFixed(3)}` }
}

/** A drawing's quarter turn about its center (face units, 0 to 300). */
const quarter = ([x, y]: readonly number[]): [number, number] => [300 - y!, x!]

/** The Gear Cube: each visible face as agreed (gearFace.ts's shapes, from
 *  outlines.json), every piece turned to its four places, on the black. */
function drawGear(shape: CubeShape): IsoDrawing {
  const faces: IsoFace[] = VISIBLE.map(({ axis, shade }) => {
    const face = (['R', 'U', 'F'] as const)[axis]
    const [u, v] = [(axis + 1) % 3, (axis + 2) % 3]
    const at = ([x, y]: readonly number[]): Point => {
      const p = [0, 0, 0]
      p[axis] = 1.5
      p[u] = x! / 100 - 1.5
      p[v] = y! / 100 - 1.5
      return p as unknown as Point
    }
    const square = faceCorners([-1.5, -1.5, -1.5], [1.5, 1.5, 1.5], axis as 0 | 1 | 2)
    // Plain clips (the plain Gear Cube) bear no color: left black.
    const kinds = Object.entries(OUTLINES).filter(
      ([kind]) => kind !== 'clip' || hasColoredClips(shape),
    )
    const pieces = kinds.flatMap(([kind, polygons]) =>
      (kind === 'center' ? [0] : [0, 1, 2, 3]).flatMap((k) =>
        (polygons as number[][][]).map((poly) =>
          poly.map((point) => {
            let p = point as readonly number[]
            for (let i = 0; i < k; i++) p = quarter(p)
            return at(p)
          }),
        ),
      ),
    )
    return {
      depth: 0,
      polygons: [
        { points: toSvg(square), paint: 'body' as const, shade },
        ...pieces.map((poly) => ({
          points: toSvg(poly),
          paint: faceColorsOf(shape)[face],
          shade,
        })),
      ],
    }
  })
  return finish(faces)
}

/** Painter's depth bonus of the star's screw half discs, over every point. */
const SCREW_FIRST = 100

/** A gridless puzzle (a star prism, the Pyraminx), from the same polygons
 *  as its 3D view, turned by its yaw; faces turned away from the viewer are
 *  left out. */
function drawPoly(shape: CubeShape, cube = solvedCube(shape), neutral?: Color): IsoDrawing {
  const drawing = polyDrawing(shape)
  const yaw = (v: readonly number[]): Point => inScene(drawing, v)
  const faces: IsoFace[] = []
  for (const cubie of cube) {
    const polygons = (drawing.thumbnail ?? drawing.polygons)(cubie)
    for (let i = 0; i < polygons.length; i++) {
      const first = polygons[i]!
      // A face: its body then its sticker (a star point), or a polygon alone
      // (the Jing's surface, cut fine: plastic seams and stickers apart).
      const sticker =
        first.paint === 'body' && polygons[i + 1]?.paint !== 'body' ? polygons[i + 1] : undefined
      if (sticker) i++
      const normal = yaw(first.normal)
      if (normal[0] + normal[1] + normal[2] <= 0) continue // facing away
      // Continuous in the normal: a curved face (the Jing's) shades smoothly.
      const shade = Math.max(0, 0.12 * (1 - normal[1]) + 0.16 * Math.max(0, normal[0]))
      const points = first.points.map(yaw)
      // The screw's disc sits on top of the points around it: drawn last.
      const onTop = isStar(shape) && cubie.position[1] === 0 ? SCREW_FIRST : 0
      faces.push({
        depth: onTop + points.reduce((d, p) => d + p[0] + p[1] + p[2], 0) / points.length,
        polygons: [
          {
            points: toSvg(points),
            paint: first.paint === 'body' ? first.paint : (neutral ?? first.paint),
            shade,
          },
          ...(sticker
            ? [{ points: toSvg(sticker.points.map(yaw)), paint: neutral ?? sticker.paint, shade }]
            : []),
        ],
      })
    }
  }
  return finish(faces)
}
