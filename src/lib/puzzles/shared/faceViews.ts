import { AXIS_ROTATIONS, normalIndex } from '../../core/geometry'
import type { Color, Cube, Cubie, Vec3 } from '../../core/types'

/**
 * A puzzle made of boxes seen from four sides, for entering its shape face
 * by face when it has too many to offer as thumbnails (the Camouflage, the
 * Purple): its front, then, tilted toward us each time, what was its top,
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

/** The normal index of a face looking toward us, on each face in turn. */
export const FACE_TOWARD: readonly number[] = (
  [
    [0, 0, 1],
    [0, 1, 0],
    [0, 0, -1],
    [0, -1, 0],
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
  /** Cells a side of a canvas. */
  readonly canvas: number
  /** Whether a face is drawn where it stands on the grid (the Camouflage,
   *  its mechanism centered), or anywhere on the canvas, compared as drawn
   *  (the Purple, off its core). */
  readonly framed: boolean
  /** Whether its entry starts with its faces (the Purple, seldom in its
   *  box), or paints its box first (the Camouflage). */
  readonly first: boolean
  /** The states the faces show (canvas regions, in `FACES` order), however
   *  held: none if none fits. Slow at worst: run in a worker. */
  readonly find: (views: Views) => Found[]
}

const LINES = new Map<number, number[][][]>()

/** Each face's lines of sight on a grid of `n` cells, by canvas cell (row r
 *  from the top, column c from the left, as the face is seen), the voxels
 *  front to back (a voxel: (x * n + y) * n + z). Tilting the puzzle toward
 *  us brings its top to the front, its back to the top: x stays left to
 *  right. */
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

/** What a state shows of its four faces on its grid: per cell, its front
 *  piece (an index in `cube`, -1 through a hole) and the color it shows
 *  (null: nothing), and the regions. */
export interface Sight {
  readonly views: number[][]
  readonly front: number[][]
  readonly colors: (Color | null)[][]
}

export function sightOf(cube: Cube, grid: FaceGrid): Sight {
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
  const front = sightLines(n).map((lines) =>
    lines.map((line) => line.map((x) => owner[x]!).find((o) => o >= 0) ?? -1),
  )
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
