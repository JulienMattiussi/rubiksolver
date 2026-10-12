import { FACE_COLOR, solvedCube } from '../cube'
import { faceOfNormal } from '../geometry'
import { applyMoves } from '../turn'
import type { Cube, Cubie, Face, Move } from '../types'
import { buildLibrary, MIDDLES, OUTER, SLICES, type Library } from './cycles'
import { isCrossCenter, isDiagonalCenter, isFixedCenter, isMovingCenter } from './kinds'

/**
 * 5x5 centers: each face's eight moving centers (four diagonal "x", four
 * cross "+") in the color of its fixed middle one, which never moves (the
 * absolute frame: yellow down, white up, as on the 3x3). Face by face: D,
 * U, then the belt (F, R, B); L is then forced.
 *
 * Each placement is first sought among two turns (a slice, a face turn:
 * what a cuber does while the faces are still open), else made by a pure
 * 3-cycle of centers (cycles.ts): diagonal ones by a slice commutator, cross
 * ones by a middle-slice commutator, conjugated by a turn when needed. A
 * 3-cycle is picked to bring a piece of the right color in while its third
 * slot lies where nothing is done yet, so no finished face ever regresses.
 */

const MECHANISM = [5, 5, 5] as const

const faceOf = (c: Cubie): Face => faceOfNormal(c.stickers[0]!.normal)
const right = (c: Cubie) => c.stickers[0]!.color === FACE_COLOR[faceOf(c)]
const slot = (c: Cubie) => c.position.join(',')

export function centersDone(cube: Cube): boolean {
  return cube.every((c) => !isMovingCenter(c) || right(c))
}

/** The centers a 3-cycle must leave alone, the fixed ones included. */
const CENTERS = solvedCube('5').filter((c) => isMovingCenter(c) || isFixedCenter(c))

let libraries: { diagonal: Library; cross: Library } | null = null

/** The two libraries, built once (a few hundred milliseconds). */
function centerLibraries() {
  if (!libraries) {
    const centers = CENTERS
    libraries = {
      diagonal: buildLibrary(SLICES, OUTER, SLICES, centers, isDiagonalCenter),
      cross: buildLibrary(MIDDLES, OUTER, SLICES, centers, isCrossCenter),
    }
  }
  return libraries
}

const ORDER: readonly Face[] = ['D', 'U', 'F', 'R', 'B']

/** Right centers on `face`. */
const countOn = (centers: Cube, face: Face) =>
  centers.filter((c) => faceOf(c) === face && right(c)).length

/** Two turns (a slice, a face turn) that add a right center to `face`,
 *  every finished face kept, if any. */
function quickPlacement(centers: Cube, face: Face, finished: readonly Face[]): Move[] | null {
  const want = countOn(centers, face) + 1
  const ok = (c: Cube) => countOn(c, face) >= want && finished.every((f) => countOn(c, f) === 8)
  for (const first of [...SLICES, ...OUTER]) {
    const one = applyMoves(centers, [first], MECHANISM)
    if (ok(one)) return [first]
    for (const second of SLICES) {
      if (second.face === first.face) continue
      if (ok(applyMoves(one, [second], MECHANISM))) return [first, second]
    }
  }
  return null
}

/** A pure 3-cycle bringing a right center onto `face`, its third slot
 *  where nothing is done (a turn of the source's face first if needed). */
function cyclePlacement(centers: Cube, face: Face, finished: readonly Face[]): Move[] {
  const { diagonal, cross } = centerLibraries()
  const done = new Set(
    centers
      .filter((c) => finished.includes(faceOf(c)) || (faceOf(c) === face && right(c)))
      .map(slot),
  )
  const color = FACE_COLOR[face]
  for (const target of centers) {
    if (faceOf(target) !== face || right(target)) continue
    const library = isCrossCenter(target) ? cross : diagonal
    const sameKind = isCrossCenter(target) ? isCrossCenter : isDiagonalCenter
    for (const source of centers) {
      if (!sameKind(source) || source.stickers[0]!.color !== color || done.has(slot(source))) {
        continue
      }
      // The source's face turned 0 to 3 quarters first: free, it never
      // changes what a face holds.
      for (const amount of [0, 1, 2, 3] as const) {
        const setup: Move[] = amount ? [{ face: faceOf(source), amount }] : []
        const from = slot(amount ? applyMoves([source], setup, MECHANISM)[0]! : source)
        for (const cycle of library.get(`${from}>${slot(target)}`) ?? []) {
          if (!done.has(cycle.third)) return [...setup, ...cycle.moves]
        }
      }
    }
  }
  throw new Error(`solveCenters: no 3-cycle for face ${face}`)
}

export function solveCenters(cube: Cube): Move[] {
  // Only the centers matter here: the search turns them alone.
  let centers: Cube = cube.filter(isMovingCenter)
  const all: Move[] = []
  const finished: Face[] = []
  for (const face of ORDER) {
    for (let guard = 0; countOn(centers, face) < 8; guard++) {
      if (guard > 16) throw new Error(`solveCenters: no progress on ${face}`)
      const moves =
        quickPlacement(centers, face, finished) ?? cyclePlacement(centers, face, finished)
      centers = applyMoves(centers, moves, MECHANISM)
      all.push(...moves)
    }
    finished.push(face)
  }
  if (!centersDone(centers)) throw new Error('solveCenters: centers left unsolved')
  return all
}
