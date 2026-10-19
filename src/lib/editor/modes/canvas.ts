import { normalIndex, normalOfIndex } from '../../core/geometry'
import type { Color, Cube } from '../../core/types'
import {
  boundsOf,
  drawingKey,
  FACE_TOWARD,
  FACES,
  heldAs,
  neighborsOf,
  sightOf,
  unturn,
  type FaceEntry,
  type Found,
  type Views,
} from './faceViews'
import { stickerId } from '../editorTables'
import type { EditStickers } from '../entry'

/**
 * Entry on canvases (a model's `canvas` step, its `FaceEntry`, see
 * faceViews.ts): a puzzle's shape told face by face, four canvases of square cells, its front, then
 * what was its top, its back, its bottom as it tilts toward us. Each cell
 * is painted a color, or "absent" (nothing shows there: a piece's plastic,
 * or a hole); joints between two colored cells tell they are one piece's
 * face (any shape: a piece standing out may hide part of it), and two
 * colored neighbors not joined, two pieces. A canvas holds once every cell
 * is painted. The four then tell the shape (`entry.find`), and their colors
 * fill in the stickers they show for the painting that follows.
 */

/** A canvas cell: a color, or nothing shown. */
export type FaceCell = Color | 'absent'

export interface Canvas {
  /** Per cell (row by row from the top), as painted; null: not yet. */
  readonly cells: readonly (FaceCell | null)[]
  /** Joints between neighboring cells, by key (`joinKey`). */
  readonly joins: readonly string[]
}

/** The four canvases, in `FACES` order. */
export type Canvases = readonly Canvas[]

/** How many canvases an entry fills, one a face. */
export const CANVAS_COUNT = FACES.length

/** A joint's key, between two neighboring cells (in either order). */
export const joinKey = (a: number, b: number): string => (a < b ? `${a}-${b}` : `${b}-${a}`)

/** A canvas's width. */
const widthOf = (canvas: Canvas) => Math.round(Math.sqrt(canvas.cells.length))

/** What a state, held some way, shows on its canvases: each face's regions,
 *  colors and front pieces (index in the state), and where its grid's cell
 *  lies for each canvas cell. A framed puzzle's canvas is its grid; another
 *  one's drawing is centered on its canvas. */
function canvasSight(cube: Cube, entry: FaceEntry, turn = 0) {
  const n = entry.canvas
  const g = entry.grid.size
  const sight = sightOf(heldAs(cube, turn), entry.grid)
  return sight.views.map((view, f) => {
    let [dr, dc] = [0, 0]
    if (!entry.framed) {
      const [r0, r1, c0, c1] = boundsOf(view, g) ?? [0, 0, 0, 0]
      dr = r0 - Math.floor((n - (r1 - r0 + 1)) / 2)
      dc = c0 - Math.floor((n - (c1 - c0 + 1)) / 2)
    }
    const at = (i: number) => {
      const [r, c] = [Math.floor(i / n) + dr, (i % n) + dc]
      return r >= 0 && r < g && c >= 0 && c < g ? r * g + c : -1
    }
    const cells = Array.from({ length: n * n }, (_, i) => at(i))
    // Regions renumbered as met on the canvas.
    const ids = new Map<number, number>()
    const regions = cells.map((k) => {
      const r = k < 0 ? -1 : view[k]!
      if (r < 0) return -1
      if (!ids.has(r)) ids.set(r, ids.size)
      return ids.get(r)!
    })
    return {
      regions,
      colors: cells.map((k) => (k < 0 ? null : sight.colors[f]![k]!)),
      front: cells.map((k) => (k < 0 ? -1 : sight.front[f]![k]!)),
    }
  })
}

/** The canvases of a state: each cell the color it shows or absent, the
 *  cells of one piece's face joined. */
export function canvasesOf(cube: Cube, entry: FaceEntry): Canvases {
  const n = entry.canvas
  return canvasSight(cube, entry).map(({ regions, colors }) => ({
    cells: colors.map((c): FaceCell => c ?? 'absent'),
    joins: regions.flatMap((r, i) =>
      r >= 0
        ? neighborsOf(i, n)
            .filter((j) => j > i && regions[j] === r)
            .map((j) => joinKey(i, j))
        : [],
    ),
  }))
}

/** The cells joined to a cell, itself among them. */
function regionAt(canvas: Canvas, at: number): number[] {
  const region = [at]
  for (let k = 0; k < region.length; k++) {
    const i = region[k]!
    for (const key of canvas.joins) {
      const [a, b] = key.split('-').map(Number) as [number, number]
      const other = a === i ? b : b === i ? a : -1
      if (other >= 0 && !region.includes(other)) region.push(other)
    }
  }
  return region
}

/** A cell painted: its whole face (the cells joined to it) takes the color;
 *  painted absent, it leaves its joints. */
export function paintCanvas(canvas: Canvas, at: number, cell: FaceCell): Canvas {
  if (cell === 'absent') {
    return {
      cells: canvas.cells.map((c, i) => (i === at ? cell : c)),
      joins: canvas.joins.filter((key) => !key.split('-').map(Number).includes(at)),
    }
  }
  const region = regionAt(canvas, at)
  return { ...canvas, cells: canvas.cells.map((c, i) => (region.includes(i) ? cell : c)) }
}

/** A joint clicked between two colored cells of one color: joined, or
 *  apart again. */
export function toggleJoin(canvas: Canvas, a: number, b: number): Canvas {
  const key = joinKey(a, b)
  if (canvas.joins.includes(key)) return { ...canvas, joins: canvas.joins.filter((k) => k !== key) }
  const [ca, cb] = [canvas.cells[a], canvas.cells[b]]
  if (!neighborsOf(a, widthOf(canvas)).includes(b) || !ca || ca === 'absent' || ca !== cb) {
    return canvas
  }
  return { ...canvas, joins: [...canvas.joins, key] }
}

/** A canvas's regions (a `Views` row), or null while a cell is unpainted. */
export function regionsOf(canvas: Canvas): number[] | null {
  if (canvas.cells.some((c) => c === null)) return null
  const regions = canvas.cells.map(() => -1)
  let next = 0
  for (let i = 0; i < regions.length; i++) {
    if (canvas.cells[i] === 'absent' || regions[i]! >= 0) continue
    for (const j of regionAt(canvas, i)) regions[j] = next
    next++
  }
  return regions
}

/** The four canvases' regions, or null while one does not hold. */
export function viewsOfCanvases(canvases: Canvases): Views | null {
  const views = canvases.map(regionsOf)
  return views.every((v) => v !== null) ? (views as number[][]) : null
}

/** Whether a state found shows exactly the canvases (where colors are,
 *  which are one piece's), wherever an unframed drawing stands. */
export function showsCanvases(found: Found, canvases: Canvases, entry: FaceEntry): boolean {
  const entered = viewsOfCanvases(canvases)
  if (!entered) return false
  const n = entry.canvas
  return canvasSight(found.cube, entry, found.turn).every(({ regions }, f) =>
    entry.framed
      ? regions.every((r, i) => r === entered[f]![i])
      : drawingKey(regions, n) === drawingKey(entered[f]!, n),
  )
}

/** The stickers the canvases show, colored as painted, on a state that
 *  shows them (`showsCanvases`): the painting that follows starts there. */
export function editOfCanvases(found: Found, canvases: Canvases, entry: FaceEntry): EditStickers {
  const n = entry.canvas
  const back = unturn(found.turn)
  const edit: Record<string, Color> = {}
  canvasSight(found.cube, entry, found.turn).forEach(({ regions, front }, f) => {
    // An unframed drawing may stand elsewhere on its canvas than this one.
    const mine = boundsOf(regions, n)
    const theirs = viewsOfCanvases([canvases[f]!])
    const drawn = theirs && boundsOf(theirs[0]!, n)
    const [dr, dc] =
      mine && drawn && !entry.framed ? [mine[0] - drawn[0], mine[2] - drawn[2]] : [0, 0]
    const toward = normalIndex(back(normalOfIndex(FACE_TOWARD[f]!)))
    canvases[f]!.cells.forEach((cell, i) => {
      if (!cell || cell === 'absent') return
      const [r, c] = [Math.floor(i / n) + dr, (i % n) + dc]
      if (r < 0 || r >= n || c < 0 || c >= n) return
      const p = front[r * n + c]!
      const piece = p >= 0 ? found.cube[p] : undefined
      // Only a face the model gives a sticker (the Purple's revealed faces
      // are violet, painted with nothing to enter).
      if (piece?.stickers.some((s) => normalIndex(s.normal) === toward)) {
        edit[stickerId(piece.position, toward)] = cell
      }
    })
  })
  return edit
}
