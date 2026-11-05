import { AXIS_ROTATIONS, normalIndex } from '../../core/geometry'
import type { Color, Cube, Cubie, Vec3 } from '../../core/types'

/**
 * A puzzle made of boxes seen from four sides, for entering its shape face
 * by face when it has too many to offer as thumbnails (the Camouflage, the
 * Meffert's Pocket Cube): its front, then, tilted toward us each time, what was its top,
 * its back, its bottom. Each face is drawn on a canvas of square cells, row
 * by row from its top, each cell showing the first piece along its line of
 * sight: the color its face toward us shows, or nothing ("absent": a
 * piece's plastic, or a hole). A region is neighboring cells showing one
 * piece's face (as one sees it: a piece standing out in front may hide part
 * of it, leaving it any shape, even in two parts); two colored neighbors of
 * two regions are two pieces (a seam).
 */

/** The faces entered, in order: the puzzle tilted toward us after each. */
export const FACES = ['F', 'U', 'B', 'D'] as const

/** The faces off that ring, seen past them (the puzzle turned left, then
 *  right): what tells apart two states its four faces leave alike (their
 *  black faces hiding the rest). */
const SIDES = ['R', 'L'] as const

/** The normal index of a face looking toward us, on each face in turn
 *  (`FACES`, then `SIDES`). */
export const FACE_TOWARD: readonly number[] = (
  [
    [0, 0, 1],
    [0, 1, 0],
    [0, 0, -1],
    [0, -1, 0],
    [1, 0, 0],
    [-1, 0, 0],
  ] as const
).map((n) => normalIndex(n as unknown as Vec3))

/** How a puzzle is seen face by face: a cube of `size` cells a side holds it,
 *  each piece filling a box of cells. */
export interface FaceGrid {
  readonly size: number
  /** The cells a piece fills, per axis (x, y, z): from, to (excluded). */
  readonly cellsOf: (piece: Cubie) => readonly (readonly [number, number])[]
  /** What a piece's face toward a normal index shows: a color, or null (no
   *  sticker there, its plastic). */
  readonly shows: (piece: Cubie, normal: number) => Color | null
}

/** Per face, per canvas cell (row by row): its region (numbered as met), or
 *  -1: nothing colored there. */
export type Views = readonly (readonly number[])[]

/** A state the faces show, as it is held: turned by `AXIS_ROTATIONS[turn]`. */
export interface Found {
  readonly cube: Cube
  readonly turn: number
}

/** How a puzzle is entered face by face (its model's `entry.faces`). */
export interface FaceEntry {
  readonly grid: FaceGrid
  /** Read by a camera: the cells a piece's face spans, where its color
   *  tells (Meffert's Pocket Cube: a violet sticker a big cube's, two; a
   *  colored one a mini cube's, one). */
  readonly spans?: Partial<Record<Color, number>>
  /** Read by a camera: how many big stickers a face shows at least, and
   *  all of them, where no small one shows (Meffert's Pocket Cube: three
   *  big cubes at least, four without minis). */
  readonly bigs?: { readonly least: number; readonly all: number }
  /** Cells a side of a canvas. */
  readonly canvas: number
  /** Whether a face is drawn where it stands on the grid (the Camouflage,
   *  its mechanism centered), or anywhere on the canvas, compared as drawn
   *  (Meffert's Pocket Cube, off its core). */
  readonly framed: boolean
  /** The states the faces show (canvas regions, in `FACES` order), however
   *  held: none if none fits. Slow at worst: run in a worker. */
  readonly find: (views: Views) => Found[]
  /** The states whose faces differ least from these, should none show
   *  them exactly (read by a camera, a sticker missed): none past a few
   *  cells. Slow: run in a worker. */
  readonly near?: (views: Views) => Nearest
}

/** The states nearest some faces read (none if too far), and how far each
 *  face read is from theirs: the farthest, a face to take again. */
export interface Nearest {
  readonly found: Found[]
  readonly off: readonly number[]
}

const LINES = new Map<number, number[][][]>()

/** Each face's lines of sight on a grid of `n` cells, by canvas cell (row r
 *  from the top, column c from the left, as the face is seen), the voxels
 *  front to back (a voxel: (x * n + y) * n + z). Tilting the puzzle toward
 *  us brings its top to the front, its back to the top: x stays left to
 *  right. Then its sides (`SIDES`), its top kept up. */
export function sightLines(n: number): number[][][] {
  const known = LINES.get(n)
  if (known) return known
  const voxel = (x: number, y: number, z: number) => (x * n + y) * n + z
  const near = Array.from({ length: n }, (_, k) => n - 1 - k)
  const far = Array.from({ length: n }, (_, k) => k)
  const faces = [
    (r: number, c: number) => near.map((z) => voxel(c, n - 1 - r, z)),
    (r: number, c: number) => near.map((y) => voxel(c, y, r)),
    (r: number, c: number) => far.map((z) => voxel(c, r, z)),
    (r: number, c: number) => far.map((y) => voxel(c, y, n - 1 - r)),
    (r: number, c: number) => near.map((x) => voxel(x, n - 1 - r, n - 1 - c)),
    (r: number, c: number) => far.map((x) => voxel(x, n - 1 - r, c)),
  ]
  const lines = faces.map((line) =>
    Array.from({ length: n * n }, (_, i) => line(Math.floor(i / n), i % n)),
  )
  LINES.set(n, lines)
  return lines
}

/** A canvas cell's neighbors (up, down, left, right), on a canvas `n` wide. */
export function neighborsOf(i: number, n: number): number[] {
  const [r, c] = [Math.floor(i / n), i % n]
  return [
    r > 0 ? i - n : -1,
    r < n - 1 ? i + n : -1,
    c > 0 ? i - 1 : -1,
    c < n - 1 ? i + 1 : -1,
  ].filter((j) => j >= 0)
}

/** Regions of a face's cells (neighbors showing the same piece), from what
 *  each shows: its piece, or null. */
function regionsOf(shown: readonly (number | null)[], n: number): number[] {
  const regions = shown.map(() => -1)
  let next = 0
  shown.forEach((p, i) => {
    if (p === null || regions[i]! >= 0) return
    const todo = [i]
    regions[i] = next
    while (todo.length) {
      const j = todo.pop()!
      for (const k of neighborsOf(j, n)) {
        if (regions[k]! < 0 && shown[k] === p) {
          regions[k] = next
          todo.push(k)
        }
      }
    }
    next++
  })
  return regions
}

/** What a state shows of its faces on its grid (its four, or `count` of
 *  them, its sides after): per cell, its front piece (an index in `cube`,
 *  -1 through a hole) and the color it shows (null: nothing), and the
 *  regions. */
export interface Sight {
  readonly views: number[][]
  readonly front: number[][]
  readonly colors: (Color | null)[][]
}

export function sightOf(cube: Cube, grid: FaceGrid, count: number = FACES.length): Sight {
  const n = grid.size
  const owner = new Int16Array(n * n * n).fill(-1)
  cube.forEach((piece, i) => {
    const [[x0, x1], [y0, y1], [z0, z1]] = grid.cellsOf(piece) as [
      [number, number],
      [number, number],
      [number, number],
    ]
    for (let x = x0; x < x1; x++) {
      for (let y = y0; y < y1; y++) {
        for (let z = z0; z < z1; z++) owner[(x * n + y) * n + z] = i
      }
    }
  })
  const front = sightLines(n)
    .slice(0, count)
    .map((lines) => lines.map((line) => line.map((x) => owner[x]!).find((o) => o >= 0) ?? -1))
  const colors = front.map((pieces, f) =>
    pieces.map((p) => (p < 0 ? null : grid.shows(cube[p]!, FACE_TOWARD[f]!))),
  )
  const views = front.map((pieces, f) =>
    regionsOf(
      pieces.map((p, i) => (colors[f]![i] ? p : null)),
      n,
    ),
  )
  return { views, front, colors }
}

/** Per face, the regions across a seam from each region (colored neighbors
 *  of another region: two pieces). */
export function seamsOf(views: Views, n: number): Map<number, Set<number>>[] {
  return views.map((regions) => {
    const seams = new Map<number, Set<number>>()
    regions.forEach((r, i) => {
      if (r < 0) return
      for (const j of neighborsOf(i, n)) {
        const other = regions[j]!
        if (other < 0 || other === r) continue
        if (!seams.has(r)) seams.set(r, new Set())
        seams.get(r)!.add(other)
      }
    })
    return seams
  })
}

/** A face's colored cells' bounding rows and columns ([r0, r1, c0, c1],
 *  inclusive), or null if none: where a drawing stands on its canvas. */
export function boundsOf(
  view: readonly number[],
  n: number,
): [number, number, number, number] | null {
  const cells = view.flatMap((r, i) => (r >= 0 ? [i] : []))
  if (!cells.length) return null
  const rows = cells.map((i) => Math.floor(i / n))
  const cols = cells.map((i) => i % n)
  return [Math.min(...rows), Math.max(...rows), Math.min(...cols), Math.max(...cols)]
}

/** A face trimmed to its colored cells, its regions renumbered as met, as a
 *  key: two drawings alike wherever they stand on their canvases. */
export function drawingKey(view: readonly number[], n: number): string {
  const b = boundsOf(view, n)
  if (!b) return ''
  const [r0, r1, c0, c1] = b
  const ids = new Map<number, number>()
  const rows: string[] = []
  for (let r = r0; r <= r1; r++) {
    let row = ''
    for (let c = c0; c <= c1; c++) {
      const v = view[r * n + c]!
      if (v < 0) row += '.'
      else {
        if (!ids.has(v)) ids.set(v, ids.size)
        row += String.fromCharCode(65 + ids.get(v)!)
      }
    }
    rows.push(row)
  }
  return rows.join('/')
}

/** A state held another way: turned by `AXIS_ROTATIONS[turn]`. */
export const heldAs = (cube: Cube, turn: number): Cube => {
  const t = AXIS_ROTATIONS[turn]!
  return cube.map((c) => ({
    ...c,
    position: t(c.position),
    stickers: c.stickers.map((s) => ({ ...s, normal: t(s.normal) })),
  }))
}

/** The way back from a holding: the turn undoing `AXIS_ROTATIONS[turn]`. */
export function unturn(turn: number): (v: Vec3) => Vec3 {
  const probe: Vec3 = [1, 2, 3]
  const there = AXIS_ROTATIONS[turn]!(probe)
  return AXIS_ROTATIONS.find((t) => t(there).join() === probe.join())!
}

/** A drawing (`drawingKey`) as its rows of cells: a region's letter, or
 *  '.' (nothing colored). */
const rowsOf = (key: string): string[] => (key ? key.split('/') : [])

/** A drawing turned a quarter clockwise, its regions lettered anew. */
function quarterOf(key: string): string {
  const rows = rowsOf(key)
  const [h, w] = [rows.length, rows[0]?.length ?? 0]
  const ids = new Map<string, string>()
  return Array.from({ length: w }, (_, r) =>
    Array.from({ length: h }, (_, c) => {
      const x = rows[h - 1 - c]![r]!
      if (x === '.') return x
      if (!ids.has(x)) ids.set(x, String.fromCharCode(65 + ids.size))
      return ids.get(x)!
    }).join(''),
  ).join('/')
}

/** How far a drawing is from another, however turned (a side shown to a
 *  camera, held some way). */
export function turnedDistance(a: string, b: string): number {
  let best = Infinity
  for (let k = 0, t = a; k < 4; k++, t = quarterOf(t)) best = Math.min(best, drawingDistance(t, b))
  return best
}

/** The drawings of a state's sides (`SIDES`), as held. */
export function sidesOf({ cube, turn }: Found, grid: FaceGrid): string[] {
  const { views } = sightOf(heldAs(cube, turn), grid, FACE_TOWARD.length)
  return views.slice(FACES.length, FACES.length + SIDES.length).map((v) => drawingKey(v, grid.size))
}

/** How far a drawing may lie from where another's corner puts it, in
 *  cells: a big cube's face missed off its side (two). */
const SLIDE = 2

/** How far apart two drawings are, laid on each other where they differ
 *  least (corner to corner, give or take `SLIDE`, from either corner): the
 *  cells one colors and the other not, and the neighbors both color that
 *  one joins (one region) and the other not. */
export function drawingDistance(a: string, b: string): number {
  const [ra, rb] = [rowsOf(a), rowsOf(b)]
  const [ha, wa, hb, wb] = [ra.length, ra[0]?.length ?? 0, rb.length, rb[0]?.length ?? 0]
  const slides = (from: number) => [
    ...new Set(
      [0, from].flatMap((o) => Array.from({ length: 2 * SLIDE + 1 }, (_, k) => o + k - SLIDE)),
    ),
  ]
  const at = (rows: string[], r: number, c: number) => rows[r]?.[c] ?? '.'
  let best = Infinity
  for (const dr of slides(ha - hb)) {
    for (const dc of slides(wa - wb)) {
      // B's cell (r, c) lies on A's (r + dr, c + dc).
      const cellA = (r: number, c: number) => at(ra, r, c)
      const cellB = (r: number, c: number) => at(rb, r - dr, c - dc)
      let cost = 0
      for (let r = Math.min(0, dr); r < Math.max(ha, hb + dr) && cost < best; r++) {
        for (let c = Math.min(0, dc); c < Math.max(wa, wb + dc); c++) {
          const [x, y] = [cellA(r, c), cellB(r, c)]
          if ((x === '.') !== (y === '.')) cost++
          for (const [r2, c2] of [
            [r, c + 1],
            [r + 1, c],
          ] as const) {
            const [x2, y2] = [cellA(r2, c2), cellB(r2, c2)]
            if ([x, y, x2, y2].includes('.')) continue
            if ((x === x2) !== (y === y2)) cost++
          }
        }
      }
      best = Math.min(best, cost)
    }
  }
  return best
}

/** Among states indexed by their faces' drawings (`drawingKey`s, in
 *  `FACES` order), those whose drawings are nearest these, if within
 *  `most` (several as near: a side tells them apart, sides.ts), and how
 *  far each face is from the first's: each face's distance found once per
 *  drawing. */
export function nearestOf(
  index: ReadonlyMap<string, readonly Found[]>,
  views: Views,
  n: number,
  most: number,
): Nearest {
  const seen = views.map((v) => drawingKey(v, n))
  const known = seen.map(() => new Map<string, number>())
  const far = (f: number, key: string) => {
    let d = known[f]!.get(key)
    if (d === undefined) known[f]!.set(key, (d = drawingDistance(seen[f]!, key)))
    return d
  }
  let best = Infinity
  let off: number[] = []
  let found: Found[] = []
  for (const [key, states] of index) {
    const each = key.split('|').map((k, f) => far(f, k))
    const total = each.reduce((a, b) => a + b, 0)
    if (total < best) [best, off, found] = [total, each, [...states]]
    else if (total === best) found.push(...states)
  }
  return { found: best <= most ? found : [], off }
}
