import { FACE_NORMAL, FACE_SPEC, faceOfNormal, layerCoords, rotateN } from '../core/geometry'
import { inSlab, moveSlab } from '../core/turn'
import type { Axis, Dims, Move, Turn, Vec3 } from '../core/types'
import { isFaceMove } from '../core/types'

/**
 * A solution without the whole-puzzle turns its layer turns make by
 * themselves (pure): Uw' Dw on a 2x2x4 turns every layer alike, the tower
 * turned in hand, nothing of it moved. Each run of turns about one axis
 * turning every layer alike is left out, and the turns after it named as
 * seen with the puzzle so held. A whole turn written as such (x y z, a
 * tutorial's gesture: the 2x2 turned over) is kept.
 */

/** How far a turn turns each layer of its axis, in quarters about the
 *  axis (right-hand rule), outermost on the negative side first. */
function layerTurns(move: Move, mechanism: Dims): number[] {
  const spec = FACE_SPEC[move.face]
  const slab = moveSlab(move, mechanism)
  const quarters = (spec.sign * move.amount + 4) % 4
  return layerCoords(mechanism[spec.coordIndex]).map((c) => (inSlab(c, slab) ? quarters : 0))
}

/** A move named as seen once the puzzle is held as `frame` says. */
const held = (move: Move, frame: (n: Vec3) => Vec3): Move => ({
  ...move,
  face: faceOfNormal(frame(FACE_NORMAL[move.face])),
})

/** The turns of each step, its whole-puzzle turns made of layer turns left
 *  out (a run may span two steps), the later turns named as then held. */
export function withoutRotations(steps: readonly (readonly Turn[])[], mechanism: Dims): Turn[][] {
  let frame = (n: Vec3): Vec3 => n
  const out: Turn[][] = steps.map(() => [])
  // The run of layer turns about one axis, as held now, each with its step.
  let run: { move: Move; step: number }[] = []
  let axis: Axis | undefined
  const close = () => {
    if (run.length && axis) {
      const sums = run
        .map(({ move }) => layerTurns(move, mechanism))
        .reduce((a, b) => a.map((x, i) => (x + b[i]!) % 4))
      const q = sums[0]!
      if (q !== 0 && sums.every((x) => x === q)) {
        // The puzzle turned whole: the turns after it as then held.
        const [was, turnAxis] = [frame, axis]
        frame = (n) => rotateN(was(n), turnAxis, -q)
      } else for (const { move, step } of run) out[step]!.push(move)
    }
    run = []
    axis = undefined
  }
  steps.forEach((moves, step) => {
    for (const move of moves) {
      if (!isFaceMove(move) || move.whole) {
        close()
        out[step]!.push(move)
        continue
      }
      // Off the run's axis: the run closed, which may turn the puzzle in hand.
      if (FACE_SPEC[held(move, frame).face].axis !== axis) close()
      const now = held(move, frame)
      axis = FACE_SPEC[now.face].axis
      run.push({ move: now, step })
    }
  })
  close()
  return out
}
