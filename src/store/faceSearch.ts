import type { CubeShape } from '@/lib/core/shapes'
import type { Cube } from '@/lib/core/types'
import { emptyEdit, progress } from '@/lib/editor/edit'
import { stepOf, type EditStickers } from '@/lib/editor/entry'
import {
  editOfCanvases,
  showsCanvases,
  viewsOfCanvases,
  type Canvas,
  type Canvases,
} from '@/lib/editor/modes/canvas'
import { FACES, type Found } from '@/lib/editor/modes/faceViews'
import { completed, realPieces } from '@/lib/editor/modes/colors'
import { formOf } from '@/lib/editor/modes/form'
import { asDrawn, bySide, needsSide } from '@/lib/editor/modes/sides'
import { combined } from '@/lib/editor/scan/crossRead'
import { findFaces, findNearest } from '@/workers/findFaces'

/**
 * A puzzle's state searched from its canvases (modes/canvas.ts), entered
 * by hand or read by a camera, its search in a worker: the states its four
 * faces show, told apart by a side when they leave two shapes (sides.ts),
 * that side asked for when not given; a camera's, its other side too
 * while a sticker is left unknown.
 */

/** A state found, in the form it takes, its stickers as the faces show
 *  them. */
interface Shown {
  readonly form: Cube | undefined
  readonly edit: EditStickers
}

/** What the search found: a state, a side to ask for, the faces to take
 *  again (a camera's, the likeliest misread first), or nothing. */
export type FacesFound =
  | { readonly kind: 'shown'; readonly faces: Canvases; readonly shown: Shown }
  | { readonly kind: 'side' }
  | { readonly kind: 'retake'; readonly faces: readonly number[] }
  | { readonly kind: 'none' }

/** A camera's: a side read may be 2 cells off the state's, its two sides
 *  asked for, every sticker known. */
const scanTelling = (side: number): Telling => ({ side, most: 2, sides: 2, whole: true })

const entryOf = (shape: CubeShape) => stepOf(shape, 'canvas')!.faces

/** The sides given after the four faces, each its index in `SIDES`: the
 *  first `side`, the next the other. */
const sidesIn = (faces: Canvases, side: number) =>
  faces.slice(FACES.length).map((canvas, i) => ({ canvas, index: i ? 1 - side : side }))

/** A state found, its stickers as the faces show them: its four, and its
 *  sides where given, turned as it draws them; then those its pieces tell
 *  (`completed`: on sides never seen). */
function shownOf(shape: CubeShape, found: Found, faces: Canvases, side: number): Shown {
  const form = formOf(found.cube)
  const entry = entryOf(shape)
  const shown: (Canvas | undefined)[] = faces.slice(0, FACES.length)
  for (const { canvas, index } of sidesIn(faces, side))
    shown[FACES.length + index] = asDrawn(found, canvas, entry, index)
  const edit = { ...emptyEdit(shape, form), ...editOfCanvases(found, shown, entry) }
  return { form, edit: completed(edit, shape, form) }
}

/** The states the four faces show exactly. */
async function showing(shape: CubeShape, ring: Canvases): Promise<Found[]> {
  const views = viewsOfCanvases(ring)
  if (!views) return []
  const states = await findFaces(shape, views)
  return states.filter((f) => showsCanvases(f, ring, entryOf(shape)))
}

/** How a search goes on from what the faces leave: the first side's index
 *  in `SIDES` (`side`), how far a side may be from a state's (`most`), how
 *  many sides may be asked for (`sides`), and whether one is asked for
 *  while a sticker is left unknown (`whole`: a camera's, nothing to paint
 *  after it). */
interface Telling {
  readonly side: number
  readonly most: number
  readonly sides: number
  readonly whole: boolean
}

/** Among states the four faces leave, the one their sides tell, or one
 *  more side to ask for: they leave two shapes, or (`whole`) a sticker no
 *  face shows nor its pieces tell; none (`whole`) if its colors make no
 *  real pieces. */
function told(
  shape: CubeShape,
  found: readonly Found[],
  faces: Canvases,
  { side, most, sides, whole }: Telling,
): FacesFound {
  const entry = entryOf(shape)
  const given = sidesIn(faces, side)
  let left: readonly Found[] = found
  for (const { canvas, index } of given) {
    const best = bySide(left, canvas, entry, index)
    if (!best.found.length || best.off > most) return { kind: 'none' }
    left = best.found
  }
  const more = given.length < sides
  const next = given.length ? 1 - side : side
  if (more && needsSide(left, entry, next)) return { kind: 'side' }
  if (!left.length) return { kind: 'none' }
  const shown = likeliest(shape, left, faces, side)
  // A camera's colors that make no real pieces: a sticker missed or
  // misread, the state not taken (a face asked again).
  if (whole && !realPieces(shown.edit, shape, shown.form)) return { kind: 'none' }
  const { filled, total } = progress(shown.edit, shape, shown.form)
  if (whole && more && filled < total) return { kind: 'side' }
  return { kind: 'shown', faces, shown }
}

/** Among states one shape held several ways (its faces' drawings alike),
 *  the first whose colors the faces show could be real pieces (`realPieces`:
 *  held another way, they would show five yellow stickers of four); else
 *  the first. */
function likeliest(
  shape: CubeShape,
  found: readonly Found[],
  faces: Canvases,
  side: number,
): Shown {
  const shown = found.map((f) => shownOf(shape, f, faces, side))
  return shown.find((s) => realPieces(s.edit, shape, s.form)) ?? shown[0]!
}

/** The state canvases entered by hand show: four faces, and their right
 *  side once asked for. */
export async function entered(shape: CubeShape, faces: Canvases): Promise<FacesFound> {
  const found = await showing(shape, faces.slice(0, FACES.length))
  const telling = { side: 0, most: 0, sides: 1, whole: false }
  return found.length ? told(shape, found, faces, telling) : { kind: 'none' }
}

/** A camera's reading of the faces: each face's ways to read it (the best
 *  first; its four, then its top and its bottom once asked for), and the
 *  side its picture of the top shows (its index in `SIDES`: which one
 *  depends on the way it was turned; its bottom, the other). */
export interface Reading {
  readonly choices: readonly (readonly Canvas[])[]
  readonly side: number
}

/** The state a camera's readings show (the likeliest reading first): the
 *  first way that shows a state exactly, every sticker known; else the
 *  state nearest the best ways; a side to ask for when they leave two
 *  shapes or a sticker unknown; else, too far, the face farthest from the
 *  nearest, to take again. */
export async function scanned(shape: CubeShape, readings: readonly Reading[]): Promise<FacesFound> {
  let side = false
  for (const { choices, side: which } of readings) {
    for (const faces of combined(choices)) {
      const found = await showing(shape, faces.slice(0, FACES.length))
      if (!found.length) continue
      const result = told(shape, found, faces, scanTelling(which))
      if (result.kind === 'shown') return result
      if (result.kind === 'side') side = true
    }
  }
  if (side) return { kind: 'side' }
  // The nearest, a sticker missed.
  const sum = (off: readonly number[]) => off.reduce((a, b) => a + b, 0)
  let nearest: { faces: Canvases; found: Found[]; off: readonly number[]; side: number } | undefined
  for (const { choices, side: which } of readings) {
    const faces = combined(choices)[0]
    const views = faces && viewsOfCanvases(faces.slice(0, FACES.length))
    if (!views) continue
    const { found, off } = await findNearest(shape, views)
    if (off.length && (!nearest || sum(off) < sum(nearest.off)))
      nearest = { faces: faces!, found, off, side: which }
  }
  if (!nearest) return { kind: 'none' }
  if (nearest.found.length) {
    const result = told(shape, nearest.found, nearest.faces, scanTelling(nearest.side))
    if (result.kind !== 'none') return result
  }
  // The faces farthest from the nearest state first, then its sides (not
  // weighed).
  const { off, faces } = nearest
  const ring = off.map((_, f) => f).sort((a, b) => off[b]! - off[a]! || a - b)
  const sides = faces.slice(FACES.length).map((_, i) => FACES.length + i)
  return { kind: 'retake', faces: [...ring, ...sides] }
}
