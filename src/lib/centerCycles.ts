import { FACE_COLOR } from './cube'
import { faceOfNormal } from './geometry'
import { applyMoves } from './turn'
import type { Cube, Cubie, Dims, Face, Move } from './types'
import type { Library } from './cycleLibrary'

/**
 * The big cubes' moving centers (the 5x5's, the 6x6's), each in the color
 * of its face in the absolute frame (yellow down, white up, as on the 3x3).
 * Face by face: D, U, then the belt (F, R, B); L is then forced.
 *
 * Each placement is first sought among two turns (a slice, then a face
 * turn: what a cuber does while the faces are still open), else made by a
 * pure 3-cycle of centers of the target's kind (cycleLibrary.ts), its third
 * slot where nothing is done yet, so no finished face ever regresses.
 */

export interface CenterSpec {
  readonly mechanism: Dims
  /** The kinds of moving center, each with its 3-cycles (built lazily). */
  readonly kinds: readonly { is: (c: Cubie) => boolean; cycles: () => Library }[]
  /** The inner slices tried by a quick placement. */
  readonly slices: readonly Move[]
  readonly outer: readonly Move[]
}

const faceOf = (c: Cubie): Face => faceOfNormal(c.stickers[0]!.normal)
const right = (c: Cubie) => c.stickers[0]!.color === FACE_COLOR[faceOf(c)]
const slot = (c: Cubie) => c.position.join(',')

const ORDER: readonly Face[] = ['D', 'U', 'F', 'R', 'B']

export function centerSolver(spec: CenterSpec) {
  const { mechanism, kinds, slices, outer } = spec
  const kindOf = (c: Cubie) => kinds.find((k) => k.is(c))
  const isMoving = (c: Cubie) => kindOf(c) !== undefined

  const done = (cube: Cube) => cube.every((c) => !isMoving(c) || right(c))

  /** Right centers on `face`. */
  const countOn = (centers: Cube, face: Face) =>
    centers.filter((c) => faceOf(c) === face && right(c)).length

  /** Two turns (a slice, a face turn) that add a right center to `face`,
   *  every finished face kept, if any. */
  function quickPlacement(centers: Cube, face: Face, full: number, finished: readonly Face[]) {
    const want = countOn(centers, face) + 1
    const ok = (c: Cube) =>
      countOn(c, face) >= want && finished.every((f) => countOn(c, f) === full)
    for (const first of [...slices, ...outer]) {
      const one = applyMoves(centers, [first], mechanism)
      if (ok(one)) return [first]
      for (const second of slices) {
        if (second.face === first.face) continue
        if (ok(applyMoves(one, [second], mechanism))) return [first, second]
      }
    }
    return null
  }

  /** A pure 3-cycle bringing a right center onto `face`, its third slot
   *  where nothing is done (a turn of the source's face first if needed). */
  function cyclePlacement(centers: Cube, face: Face, finished: readonly Face[]): Move[] {
    const fixed = new Set(
      centers
        .filter((c) => finished.includes(faceOf(c)) || (faceOf(c) === face && right(c)))
        .map(slot),
    )
    const color = FACE_COLOR[face]
    for (const target of centers) {
      if (faceOf(target) !== face || right(target)) continue
      const kind = kindOf(target)!
      for (const source of centers) {
        if (!kind.is(source) || source.stickers[0]!.color !== color || fixed.has(slot(source))) {
          continue
        }
        // The source's face turned 0 to 3 quarters first: free, it never
        // changes what a face holds.
        for (const amount of [0, 1, 2, 3] as const) {
          const setup: Move[] = amount ? [{ face: faceOf(source), amount }] : []
          const from = slot(amount ? applyMoves([source], setup, mechanism)[0]! : source)
          for (const cycle of kind.cycles().cycles.get(`${from}>${slot(target)}`) ?? []) {
            if (!fixed.has(cycle.third)) return [...setup, ...cycle.moves]
          }
        }
      }
    }
    throw new Error(`solveCenters: no 3-cycle for face ${face}`)
  }

  function solve(cube: Cube): Move[] {
    // Only the centers matter here: the search turns them alone.
    let centers: Cube = cube.filter(isMoving)
    const full = centers.length / 6
    const all: Move[] = []
    const finished: Face[] = []
    for (const face of ORDER) {
      for (let guard = 0; countOn(centers, face) < full; guard++) {
        if (guard > 2 * full) throw new Error(`solveCenters: no progress on ${face}`)
        const moves =
          quickPlacement(centers, face, full, finished) ?? cyclePlacement(centers, face, finished)
        centers = applyMoves(centers, moves, mechanism)
        all.push(...moves)
      }
      finished.push(face)
    }
    if (!done(centers)) throw new Error('solveCenters: centers left unsolved')
    return all
  }

  return { centersDone: done, solveCenters: solve }
}
