import { cubeDims, solvedCube } from '@/lib/core/cube'
import { normalIndex } from '@/lib/core/geometry'
import { cubieBox, LAYER_THICKNESS } from '@/lib/core/shape'
import { lookOf } from '@/lib/editor/modes/form'
import { type Color, type Cube, type CubeShape, type CubeVariant } from '@/lib/core/types'
import { drawnIn, visualPosition } from './layout'
import { inScene, isPolyDrawn, polyDrawing } from './polyDrawing'
import type { PiecePolygon } from './polygons'
import {
  faceCorners,
  finish,
  shrink,
  STICKER_SCALE,
  toSvg,
  VISIBLE,
  type IsoDrawing,
  type IsoFace,
  type Point,
} from './isoKit'
import { ownViewsOf } from '@/three/puzzles/views'

/**
 * Flat isometric drawing of a solved puzzle, for its picker thumbnail: the
 * puzzle seen from its up-front-right corner, so its U, F and R faces show.
 * Derived from the same layout and cubie boxes as the 3D view, so a new shape
 * (or the mirror skin) gets its thumbnail for free.
 */

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
  const own = ownViewsOf(shape)?.thumbnail
  if (own) return own(shape)
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
  for (const cubie of cube.filter(drawnIn(cube))) {
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

/** Painter's depth bonus of the pieces drawn over their neighbours (the
 *  star's screw half discs), over every point. */
const DRAWN_OVER = 100

/** A gridless puzzle (a star prism, the Pyraminx), from the same polygons
 *  as its 3D view, turned by its yaw; faces turned away from the viewer are
 *  left out. */
function drawPoly(shape: CubeShape, cube = solvedCube(shape), neutral?: Color): IsoDrawing {
  const drawing = polyDrawing(shape)
  const yaw = (v: readonly number[]): Point => inScene(drawing, v)
  const faces: IsoFace[] = []
  for (const cubie of cube.filter(drawnIn(cube))) {
    const polygons = (drawing.thumbnail ?? drawing.polygons)(cubie)
    for (let i = 0; i < polygons.length; i++) {
      const first = polygons[i]!
      // A face: its body then its sticker (a star point), or a polygon alone
      // (the Jing's surface, cut fine: plastic seams and stickers apart).
      const sticker =
        first.paint === 'body' && polygons[i + 1]?.paint !== 'body' && !polygons[i + 1]?.on
          ? polygons[i + 1]
          : undefined
      if (sticker) i++
      // What is printed on it, drawn right after it.
      const prints: PiecePolygon[] = []
      while (polygons[i + 1]?.on) prints.push(polygons[++i]!)
      const normal = yaw(first.normal)
      if (normal[0] + normal[1] + normal[2] <= 0) continue // facing away
      // Continuous in the normal: a curved face (the Jing's) shades smoothly.
      const shade = Math.max(0, 0.12 * (1 - normal[1]) + 0.16 * Math.max(0, normal[0]))
      const points = first.points.map(yaw)
      // A piece on top of those around it (the star's screw disc): drawn last.
      const onTop = drawing.drawnOver?.(cubie) ? DRAWN_OVER : 0
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
          ...prints.map((p) => ({ points: toSvg(p.points.map(yaw)), paint: p.paint, shade })),
        ],
      })
    }
  }
  return finish(faces)
}
