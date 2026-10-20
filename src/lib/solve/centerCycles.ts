import { FACE_COLOR } from '../core/cube'
import { faceOfNormal } from '../core/geometry'
import { applyMoves } from '../core/turn'
import type { Cube, Cubie, Dims, Face, Move } from '../core/types'
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

/** A center to take from its slot to another (`x,y,z` keys). */
interface Pick {
  readonly from: string
  readonly to: string
}

export function centerSolver(spec: CenterSpec) {
  const { mechanism, kinds, slices, outer } = spec
  const kindOf = (c: Cubie) => kinds.find((k) => k.is(c))
  const isMoving = (c: Cubie) => kindOf(c) !== undefined

  const done = (cube: Cube) => cube.every((c) => !isMoving(c) || right(c))

  /** Right centers on `face`. */
  const countOn = (centers: Cube, face: Face) =>
    centers.filter((c) => faceOf(c) === face && right(c)).length

  /** Two turns (a slice, a face turn) that add a right center to `face`,
   *  every finished face kept (the picked center taken to its slot), if any. */
  function quickPlacement(
    centers: Cube,
    face: Face,
    full: number,
    finished: readonly Face[],
    pick?: Pick,
  ) {
    const want = countOn(centers, face) + 1
    const piece = pick ? centers.findIndex((c) => slot(c) === pick.from) : -1
    const ok = (c: Cube) =>
      countOn(c, face) >= want &&
      finished.every((f) => countOn(c, f) === full) &&
      (!pick || slot(c[piece]!) === pick.to)
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

  /** A pure 3-cycle bringing a right center onto `face` (the picked one to
   *  its slot), its third slot where nothing is done (a turn of the
   *  source's face first if needed); null when there is none. */
  function cyclePlacement(
    centers: Cube,
    face: Face,
    finished: readonly Face[],
    pick?: Pick,
  ): Move[] | null {
    const fixed = new Set(
      centers
        .filter((c) => finished.includes(faceOf(c)) || (faceOf(c) === face && right(c)))
        .map(slot),
    )
    const color = FACE_COLOR[face]
    for (const target of centers) {
      if (faceOf(target) !== face || right(target)) continue
      if (pick && slot(target) !== pick.to) continue
      const kind = kindOf(target)!
      for (const source of centers) {
        if (!kind.is(source) || source.stickers[0]!.color !== color || fixed.has(slot(source))) {
          continue
        }
        if (pick && slot(source) !== pick.from) continue
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
    return null
  }

  /** The next center placed: one more right center on the first face not
   *  done, those before kept (the picked one, from its slot to its own, if
   *  asked: null when no placement does that). Null once all are done. */
  function placeCenter(cube: Cube, pick?: Pick): Move[] | null {
    // Only the centers matter here: the search turns them alone.
    const centers = cube.filter(isMoving)
    const full = centers.length / 6
    const at = ORDER.findIndex((f) => countOn(centers, f) < full)
    if (at < 0) return null
    const face = ORDER[at]!
    const finished = ORDER.slice(0, at)
    return (
      quickPlacement(centers, face, full, finished, pick) ??
      cyclePlacement(centers, face, finished, pick)
    )
  }

  function solve(cube: Cube): Move[] {
    let centers: Cube = cube.filter(isMoving)
    const all: Move[] = []
    for (let guard = 0; !done(centers); guard++) {
      const moves = placeCenter(centers)
      if (!moves || guard > centers.length) throw new Error('solveCenters: no progress')
      centers = applyMoves(centers, moves, mechanism)
      all.push(...moves)
    }
    return all
  }

  return { centersDone: done, solveCenters: solve, placeCenter }
}
