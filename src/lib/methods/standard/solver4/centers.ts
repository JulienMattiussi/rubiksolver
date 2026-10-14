import { FACE_COLOR } from '../../../core/cube'
import { colorAt } from '../../../core/pieces'
import { faceOfNormal } from '../../../core/geometry'
import { applyMoves } from '../../../core/turn'
import { FACES } from '../../../core/moves'
import { search } from '../../../solve/solverKit'
import type { Cube, CubeColor, Cubie, Face, Move } from '../../../core/types'

/**
 * 4x4 centers: build the four center facelets of every face in its FACE_COLOR
 * color (absolute frame, yellow down / white up, like the 3x3 methods). Order:
 * D, then U, then the belt (F, R, B; L is forced once the five others are
 * full). Every placement is a bounded shortest-path search whose goal counts
 * correct centers and never regresses the faces already done, so the result
 * is correct by construction.
 *
 * Key facts making this simple and fast:
 * - an outer turn never moves a center from one face to another (it only spins
 *   a face's own centers), so alignment turns are free with count-based goals;
 * - centers of one color are interchangeable, and the searches dedupe visited
 *   states by a centers-only key, which collapses the space massively;
 * - cubies keep their array index through applyMove, so the center indices of
 *   the start cube stay valid for every state a search visits.
 */

function isCenter(c: Cubie): boolean {
  return c.stickers.length === 1
}

/** Correctly colored center facelets currently on `face`. */
function centerCount(cube: Cube, face: Face): number {
  let count = 0
  for (const c of cube) {
    if (!isCenter(c)) continue
    if (colorAt(c, face) === FACE_COLOR[face]) count++
  }
  return count
}

export function centersDone(cube: Cube): boolean {
  return FACES.every((f) => centerCount(cube, f) === 4)
}

const COLOR_CODE: Record<CubeColor, number> = { W: 0, Y: 1, G: 2, B: 3, O: 4, R: 5 }

function centerIndices(cube: Cube): number[] {
  const idx: number[] = []
  cube.forEach((c, i) => {
    if (isCenter(c)) idx.push(i)
  })
  return idx
}

/** Canonical centers-only key: sorted position+color codes (same-color
 *  centers collapse, everything else is ignored). */
function centersKeyFor(indices: readonly number[]): (cube: Cube) => string {
  return (cube) => {
    const codes: number[] = []
    for (const i of indices) {
      const c = cube[i]!
      const p = c.position
      codes.push(
        ((p[0] + 3) * 49 + (p[1] + 3) * 7 + (p[2] + 3)) * 6 +
          COLOR_CODE[c.stickers[0]!.color as CubeColor],
      )
    }
    codes.sort((a, b) => a - b)
    return String.fromCharCode(...codes)
  }
}

/** One-scan goal: every `full` face shows 4 correct centers and `face` at
 *  least `wanted`. */
function countGoalFor(
  indices: readonly number[],
  full: readonly Face[],
  face: Face,
  wanted: number,
): (cube: Cube) => boolean {
  return (cube) => {
    const counts: Partial<Record<Face, number>> = {}
    for (const i of indices) {
      const s = cube[i]!.stickers[0]!
      const f = faceOfNormal(s.normal)
      if (s.color === FACE_COLOR[f]) counts[f] = (counts[f] ?? 0) + 1
    }
    return (counts[face] ?? 0) >= wanted && full.every((g) => counts[g] === 4)
  }
}

const slice = (face: Face): Move => ({ face, amount: 1, depth: 2 })
const outer = (face: Face): Move => ({ face, amount: 1 })

/** For D and U: all outer turns plus two vertical inner slices. 2R reaches
 *  the F/B/U/D columns and 2F the R/L/U/D ones, so together with alignment
 *  turns (free, they never change a count) they reach every center. */
const VERTICAL_GENERATORS: readonly Move[] = [...FACES.map(outer), slice('R'), slice('F')]

/** For the belt: side turns plus the two horizontal inner slices. U/D outer
 *  turns move no belt center, so they are left out to cut branching. */
const BELT_GENERATORS: readonly Move[] = [
  ...(['F', 'R', 'B', 'L'] as const).map(outer),
  slice('U'),
  slice('D'),
]

const BELT_ORDER: readonly Face[] = ['F', 'R', 'B']

export function solveCenters(cube: Cube): Move[] {
  const indices = centerIndices(cube)
  const key = centersKeyFor(indices)
  let state = cube
  const all: Move[] = []
  const solveFace = (
    face: Face,
    full: readonly Face[],
    generators: readonly Move[],
    maxDepth: number,
  ) => {
    for (let k = centerCount(state, face); k < 4; k++) {
      const moves = search(
        state,
        countGoalFor(indices, full, face, k + 1),
        generators,
        maxDepth,
        key,
      )
      state = applyMoves(state, moves)
      all.push(...moves)
    }
  }
  // D freely, then U while keeping D (worst insertion: align a face, a
  // 3-move slice sandwich around U; 4 turns total).
  solveFace('D', [], VERTICAL_GENERATORS, 4)
  solveFace('U', ['D'], VERTICAL_GENERATORS, 4)
  // Belt faces one by one (horizontal slices and side turns keep D and U by
  // construction; the goal states it anyway). Worst insertion: align the
  // source face, slice in, park with a face turn, slice back; 5 covers the
  // awkward diagonal cases.
  const keep: Face[] = ['D', 'U']
  for (const face of BELT_ORDER) {
    solveFace(face, keep, BELT_GENERATORS, 5)
    keep.push(face)
  }
  // L is forced: the only four centers left are its own.
  return all
}
