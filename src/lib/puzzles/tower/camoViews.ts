import { solvedCube } from '../../core/cube'
import { normalIndex } from '../../core/geometry'
import { invertMoves } from '../../core/moves'
import { applyMoves } from '../../core/turn'
import type { Cube } from '../../core/types'
import {
  seamsOf,
  sightLines,
  type FaceEntry,
  type FaceGrid,
  type Views,
} from '../../editor/modes/faceViews'
import { camoBox } from './camo'
import { CELLS, shapeToBox, type Shape } from './camoShape'

/**
 * The Camouflage entered face by face (lib/editor/modes/faceViews.ts): four faces
 * around one axis tell its shape, always (of its 2 421 009 shapes, no two
 * look alike from these four sides, measured), and the shape is found again
 * from them alone (`shapeFromViews`). In half units (its thin layers'
 * thickness), its mechanism holds it in a 6x6x6 grid, centered: a face is
 * drawn where it stands on a 6x6 canvas.
 */

/** Cells (half units) a side: the 4x4x4 mechanism's 3 units. */
const N = 6

/** Its grid: each piece's box (camo.ts) in half units; a face shows its
 *  sticker if it has one there, else its plastic. */
const CAMO_GRID: FaceGrid = {
  size: N,
  cellsOf: (piece) => camoBox(piece).map(([lo, hi]) => [lo * 2 + 3, hi * 2 + 3] as const),
  shows: (piece, normal) =>
    piece.stickers.find((s) => normalIndex(s.normal) === normal)?.color ?? null,
}

/** A voxel's index from its three coordinates (0 to 5, along x, y, z). */
const voxel = (x: number, y: number, z: number) => (x * N + y) * N + z

/** The voxels a cell's piece fills, one unit high on `tall` (half units:
 *  thin layers 1, thick 2, the high side 2 from the middle). */
function voxelsOf(cell: readonly number[], tall: number): number[] {
  const [xs, ys, zs] = cell.map((v, a) => {
    const [lo, hi] = a === tall ? [0, 2] : Math.abs(v) === 3 ? [1, 3] : [0, 1]
    const [from, to] = v > 0 ? [lo, hi] : [-hi, -lo]
    return Array.from({ length: to - from }, (_, k) => from + k + 3)
  }) as [number[], number[], number[]]
  return xs.flatMap((x) => ys.flatMap((y) => zs.map((z) => voxel(x, y, z))))
}

/** Each cell's values (0: empty, 1 + tall axis), and the voxels each fills. */
const VALUES = CELLS.map((cell) => [
  0,
  ...[1, 0, 2].filter((a) => Math.abs(cell[a]!) === 1).map((a) => a + 1),
])
const FILLS = CELLS.map((cell) => [0, 1, 2, 3].map((v) => (v ? voxelsOf(cell, v - 1) : [])))

/** Every Camouflage has its 32 pieces somewhere. */
const PIECES = 32

const LINES = sightLines(N)

/** Voxels to the cells (and values) that could fill them. */
const FILLERS: [number, number][][] = Array.from({ length: N ** 3 }, () => [])
FILLS.forEach((byValue, c) =>
  VALUES[c]!.forEach((v) => byValue[v]!.forEach((x) => FILLERS[x]!.push([c, v]))),
)

/** Lines of sight through each voxel: [face, canvas cell]. */
const THROUGH: [number, number][][] = Array.from({ length: N ** 3 }, () => [])
LINES.forEach((lines, f) =>
  lines.forEach((line, i) => line.forEach((x) => THROUGH[x]!.push([f, i]))),
)

/** Cells tried outer first (what the faces see best), the ones a side's
 *  height lies on last. */
const ORDER = [...CELLS.keys()].sort(
  (a, b) =>
    Math.max(Math.abs(CELLS[b]![1]!), Math.abs(CELLS[b]![2]!)) -
    Math.max(Math.abs(CELLS[a]![1]!), Math.abs(CELLS[a]![2]!)),
)

/**
 * The shape the four faces show (`Views`, in `FACES` order), or null if
 * none fits. A search cell by cell, outer cells first: each line of sight
 * whose first voxels are known is checked as soon as they are (a region's
 * first piece, the same along all its lines; two regions across a seam,
 * two pieces). The faces tell a single shape, so the first that fits is it
 * (some 100 ms, a few seconds at worst: run it in a worker).
 */
export function shapeFromViews(views: Views): Shape | null {
  const value = new Int8Array(CELLS.length).fill(-1)
  const owner = new Int16Array(N ** 3).fill(-1)
  const piece = views.map(() => new Map<number, number>())
  const seams = seamsOf(views, N)
  let placed = 0

  const knownEmpty = (x: number) =>
    owner[x]! < 0 && FILLERS[x]!.every(([c, v]) => value[c]! >= 0 && value[c] !== v)

  /** Whether a line still fits; a region met for the first time is tied to
   *  its piece (listed in `tied`, to be untied on the way back). */
  const fits = (f: number, i: number, tied: [number, number][]): boolean => {
    const region = views[f]![i]!
    for (const x of LINES[f]![i]!) {
      const here = owner[x]!
      if (here >= 0) {
        if (region < 0) return true
        const was = piece[f]!.get(region)
        if (was !== undefined) return was === here
        for (const other of seams[f]!.get(region) ?? []) {
          if (piece[f]!.get(other) === here) return false
        }
        piece[f]!.set(region, here)
        tied.push([f, region])
        return true
      }
      if (!knownEmpty(x)) return true
    }
    return region < 0
  }

  const search = (k: number): boolean => {
    if (k === ORDER.length) return placed === PIECES
    const c = ORDER[k]!
    const left = ORDER.length - k - 1
    for (const v of VALUES[c]!) {
      const add = v ? 1 : 0
      if (placed + add > PIECES || placed + add + left < PIECES) continue
      const fills = FILLS[c]![v]!
      if (fills.some((x) => owner[x]! >= 0)) continue
      value[c] = v
      for (const x of fills) owner[x] = c
      placed += add
      const tied: [number, number][] = []
      const lines = new Set<number>()
      for (const w of VALUES[c]!) {
        for (const x of FILLS[c]![w]!) for (const [f, i] of THROUGH[x]!) lines.add(f * N * N + i)
      }
      let ok = true
      for (const line of lines) {
        if (!fits(Math.floor(line / (N * N)), line % (N * N), tied)) {
          ok = false
          break
        }
      }
      if (ok && search(k + 1)) return true
      for (const [f, region] of tied) piece[f]!.delete(region)
      placed -= add
      for (const x of fills) owner[x] = -1
      value[c] = -1
    }
    return false
  }
  return search(0) ? Uint8Array.from(value) : null
}

/** A state the four faces show (its shape found, then reached from the
 *  box), or null if no shape fits them or no turn reaches it. Its colors
 *  are any: the editor paints them. */
function stateFromViews(views: Views): Cube | null {
  const shape = shapeFromViews(views)
  if (!shape) return null
  const box = solvedCube('camo')
  const moves = shapeToBox(shape, box)
  return moves && applyMoves(box, invertMoves(moves))
}

/** Entered face by face: its box painted first (most often as it is), a
 *  face drawn where it stands; held as entered (its mechanism has no fixed
 *  center: any holding is one of its shapes). */
export const CAMO_FACE_ENTRY: FaceEntry = {
  grid: CAMO_GRID,
  canvas: N,
  framed: true,
  find: (views) => {
    const cube = stateFromViews(views)
    return cube ? [{ cube, turn: 0 }] : []
  },
}
