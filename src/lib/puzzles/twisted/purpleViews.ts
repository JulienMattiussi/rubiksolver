import { AXIS_ROTATIONS, normalIndex } from '../../core/geometry'
import { layerTurnsOf } from '../../core/moves'
import { applyMove, turnAllowed } from '../../core/turn'
import type { Cube } from '../../core/types'
import {
  drawingKey,
  FACES,
  heldAs,
  sightOf,
  type FaceEntry,
  type FaceGrid,
  type Found,
  type Views,
} from '../shared/faceViews'
import { half, solvedPurple } from './purple'

/**
 * The Purple entered face by face (shared/faceViews.ts): its 1 160 shapes,
 * each held any of 24 ways, show four faces no other shape does (measured),
 * so the faces are simply looked up among them. A cell is a mini cube
 * (2 model units, purple.ts); off its core, the Purple stands anywhere on a
 * 5x5 canvas (its widest face), and a face is compared as drawn, wherever.
 */

/** Model units -9 to 9, in cells of 2 between odd coordinates: room for
 *  every shape held any way about the core. */
const FRAME = 9

/** Its grid: each piece's box in mini cubes; every face shows a color, its
 *  sticker's or violet (the real puzzle is violet all over, but A's three
 *  outer faces). */
const PURPLE_GRID: FaceGrid = {
  size: FRAME,
  cellsOf: (piece) =>
    piece.position.map(
      (v) => [(v - half(piece) + FRAME) / 2, (v + half(piece) + FRAME) / 2] as const,
    ),
  shows: (piece, normal) =>
    piece.stickers.find((s) => normalIndex(s.normal) === normal)?.color ?? 'V',
}

/** Its shapes, one state each: where its pieces stand, colors aside (a
 *  breadth-first search from the solved one, its big cubes alike). */
let SHAPES: Cube[] | undefined
function purpleShapes(): Cube[] {
  if (SHAPES) return SHAPES
  const key = (cube: Cube) =>
    cube
      .map((c) => `${c.position.join()}:${half(c)}`)
      .sort()
      .join(' ')
  const turns = layerTurnsOf('purple')
  const start = solvedPurple()
  const seen = new Set([key(start)])
  const shapes = [start]
  for (let k = 0; k < shapes.length; k++) {
    for (const turn of turns) {
      if (!turnAllowed(shapes[k]!, turn)) continue
      const next = applyMove(shapes[k]!, turn)
      const look = key(next)
      if (seen.has(look)) continue
      seen.add(look)
      shapes.push(next)
    }
  }
  return (SHAPES = shapes)
}

/** Every shape held every way, by the drawings of its four faces. */
let BY_FACES: Map<string, Found[]> | undefined
function byFaces(): Map<string, Found[]> {
  if (BY_FACES) return BY_FACES
  const index = new Map<string, Found[]>()
  for (const cube of purpleShapes()) {
    AXIS_ROTATIONS.forEach((_, turn) => {
      const { views } = sightOf(heldAs(cube, turn), PURPLE_GRID)
      const key = views.map((v) => drawingKey(v, FRAME)).join('|')
      index.set(key, [...(index.get(key) ?? []), { cube, turn }])
    })
  }
  return (BY_FACES = index)
}

/** Entered face by face, its faces first (it seldom stands in its box), a
 *  face drawn anywhere on its canvas; held any way. */
export const PURPLE_FACE_ENTRY: FaceEntry = {
  grid: PURPLE_GRID,
  canvas: 5,
  framed: false,
  first: true,
  find: (views: Views) =>
    views.length === FACES.length
      ? (byFaces().get(views.map((v) => drawingKey(v, 5)).join('|')) ?? [])
      : [],
}
