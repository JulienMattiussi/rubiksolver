import { AXIS_ROTATIONS, normalIndex } from '../../core/geometry'
import { layerTurnsOf } from '../../core/moves'
import { applyMove, turnAllowed } from '../../core/turn'
import type { Cube } from '../../core/types'
import {
  drawingKey,
  FACES,
  heldAs,
  nearestOf,
  sightOf,
  type FaceEntry,
  type FaceGrid,
  type Found,
  type Views,
} from '../../editor/modes/faceViews'
import { A_COLORS, half, solvedMeffertsPocket } from './meffertsPocket'

/**
 * Meffert's Pocket Cube entered face by face (lib/editor/modes/faceViews.ts): its 1 160 shapes,
 * each held any of 24 ways, show four faces no other shape does (measured),
 * so the faces are simply looked up among them. A cell is a mini cube
 * (2 model units, meffertsPocket.ts); off its core, Meffert's Pocket Cube stands anywhere on a
 * 5x5 canvas (its widest face), and a face is compared as drawn, wherever.
 */

/** Model units -9 to 9, in cells of 2 between odd coordinates: room for
 *  every shape held any way about the core. */
const FRAME = 9

/** Its grid: each piece's box in mini cubes; a face shows its sticker's
 *  color, or nothing (its black body: a face a turn brings out, inside the
 *  solved cube, has none). */
const MEFFERTS_POCKET_GRID: FaceGrid = {
  size: FRAME,
  cellsOf: (piece) =>
    piece.position.map(
      (v) => [(v - half(piece) + FRAME) / 2, (v + half(piece) + FRAME) / 2] as const,
    ),
  shows: (piece, normal) =>
    piece.stickers.find((s) => normalIndex(s.normal) === normal)?.color ?? null,
}

/** Its shapes, one state each: where its pieces stand, colors aside (a
 *  breadth-first search from the solved one, its big cubes alike). */
let SHAPES: Cube[] | undefined
function meffertsPocketShapes(): Cube[] {
  if (SHAPES) return SHAPES
  const key = (cube: Cube) =>
    cube
      .map((c) => `${c.position.join()}:${half(c)}`)
      .sort()
      .join(' ')
  const turns = layerTurnsOf('meffertsPocket')
  const start = solvedMeffertsPocket()
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
  for (const cube of meffertsPocketShapes()) {
    AXIS_ROTATIONS.forEach((_, turn) => {
      const { views } = sightOf(heldAs(cube, turn), MEFFERTS_POCKET_GRID)
      const key = views.map((v) => drawingKey(v, FRAME)).join('|')
      index.set(key, [...(index.get(key) ?? []), { cube, turn }])
    })
  }
  return (BY_FACES = index)
}

/** How many cells the faces read by a camera may differ by from a
 *  shape's: a big cube's sticker missed (four cells), and a little more. */
const NEAR = 6

/** Entered face by face (its faces first: it seldom stands in its box), a
 *  face drawn anywhere on its canvas; held any way. */
export const MEFFERTS_POCKET_FACE_ENTRY: FaceEntry = {
  grid: MEFFERTS_POCKET_GRID,
  // The big cubes violet, A's minis in its colors.
  spans: { V: 2, ...Object.fromEntries(A_COLORS.map((c) => [c, 1])) },
  // Its eight big cubes: four of a face's corners at most, three at least
  // (the fourth's place holds minis).
  bigs: { least: 3, all: 4 },
  canvas: 5,
  framed: false,
  find: (views: Views) =>
    views.length === FACES.length
      ? (byFaces().get(views.map((v) => drawingKey(v, 5)).join('|')) ?? [])
      : [],
  near: (views: Views) =>
    views.length === FACES.length ? nearestOf(byFaces(), views, 5, NEAR) : { found: [], off: [] },
}
