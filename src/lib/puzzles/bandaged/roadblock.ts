import { FACE_SPEC, mapVec } from '../../core/geometry'
import { MARK } from '../../core/types'
import { applyMove, moveSlab, inSlab } from '../../core/turn'
import type { Cube, Cubie, Face, Move, Vec3 } from '../../core/types'

/**
 * The RoadBlock-I (fan2cube.fr/roadblock-I1, WitEden, 2012): a 5x5x5 whose
 * nine centers of each face are fused three by three into parallel bars
 * (the "I"s), its outer layers thick and its three inner ones thin. A face
 * always turns; a slice only when it cuts no bar, that is when no bar it
 * takes lies along its axis. Its START (here solved): the four sides' bars
 * level, the top's and the bottom's from left to right; then the three
 * slices of the equator turn, "comme un Professor".
 *
 * Model: the 5x5x5's cubies, each center marked by a hidden sticker along
 * its bar (as the Fisher Cube's, fisher.ts): every turn carries it, and the
 * face it is on says how its bar lies.
 */

const isCenter = (c: Cubie) =>
  c.position.filter((v) => Math.abs(v) === 2).length === 1 &&
  c.stickers.some((s) => s.color !== MARK)

/** Where a center's bar lies when solved: along x on top and bottom, level
 *  (across the face, not up) on the sides. */
function solvedBar(face: Vec3): Vec3 {
  const axis = face.findIndex((v) => v !== 0)
  return axis === 1 ? [1, 0, 0] : axis === 0 ? [0, 0, 1] : [1, 0, 0]
}

/** A face's key, by its normal: its middle center's place (and its slot's
 *  key in the editor). */
const faceKey = (normal: readonly number[]) => normal.map((v) => 2 * v).join(',')

/** The face a center is on: the normal of its colored sticker. */
const faceOf = (c: Cubie) => c.stickers.find((s) => s.color !== MARK)!.normal

/** Which way a face's bars lie: as solved, or a quarter turn off
 *  (`turned`), the other way across it. */
function barOn(face: Vec3, turned: boolean): Vec3 {
  const start = solvedBar(face)
  if (!turned) return start
  const other = 3 - face.findIndex((v) => v !== 0) - start.findIndex((v) => v !== 0)
  return mapVec([0, 1, 2], (d) => (d === other ? 1 : 0))
}

/** The 5x5x5 as a RoadBlock-I: its centers marked along their bars, as
 *  solved but on the faces `turned` (by key: their middle center's place). */
export const withBars = (cube: Cube, turned: readonly string[] = []): Cube =>
  cube.map((c) =>
    isCenter(c)
      ? {
          ...c,
          stickers: [
            ...c.stickers,
            { normal: barOn(faceOf(c), turned.includes(faceKey(faceOf(c)))), color: MARK },
          ],
        }
      : c,
  )

/** The faces whose bars lie a quarter turn off, by key (`withBars`). */
export const barsTurned = (cube: Cube): string[] =>
  cube.flatMap((c) => {
    const axis = barAxis(c)
    if (axis === undefined || c.position.filter((v) => v !== 0).length !== 1) return []
    const face = faceOf(c)
    return barOn(face, false).findIndex((v) => v !== 0) === axis ? [] : [faceKey(face)]
  })

/** The cells of a center's bar (its own among them), its face's bars lying
 *  as `turned` says. */
export function barCells(position: Vec3, turned: readonly string[]): Vec3[] {
  const axis = position.findIndex((v) => Math.abs(v) === 2)
  const face = mapVec(position, (v, d) => (d === axis ? Math.sign(v) : 0))
  const along = barOn(face, turned.includes(faceKey(face))).findIndex((v) => v !== 0)
  return [-1, 0, 1].map((k) => mapVec(position, (v, d) => (d === along ? k : v)))
}

/** The 5x5x5 it is, its bars' marks set aside. */
export const withoutBars = (cube: Cube): Cube =>
  cube.map((c) =>
    c.stickers.some((s) => s.color === MARK)
      ? { ...c, stickers: c.stickers.filter((s) => s.color !== MARK) }
      : c,
  )

/** The axis a center's bar lies along (0, 1 or 2), if it is one. */
export const barAxis = (c: Cubie): number | undefined => {
  const mark = c.stickers.find((s) => s.color === MARK)
  return mark && mark.normal.findIndex((v) => v !== 0)
}

/** Whether a turn cuts no bar: none it takes lies along its axis (a face
 *  alone takes no other face's centers). */
export function roadblockTurns(cube: Cube, move: Move): boolean {
  if (!move.depth) return true
  const axis = FACE_SPEC[move.face].coordIndex
  const slab = moveSlab(move, [5, 5, 5])
  return cube.every(
    (c) => !inSlab(c.position[axis]!, slab) || barAxis(c) === undefined || barAxis(c) !== axis,
  )
}

const FACES: readonly Face[] = ['U', 'D', 'L', 'R', 'F', 'B']
const AMOUNTS = [1, 2, 3] as const
const OUTER: Move[] = FACES.flatMap((face) => AMOUNTS.map((amount): Move => ({ face, amount })))
const SLICES: Move[] = FACES.flatMap((face) =>
  AMOUNTS.flatMap((amount): Move[] => [
    { face, amount, depth: 2 },
    ...(face === 'U' || face === 'L' || face === 'F' ? [{ face, amount, depth: 3 } as Move] : []),
  ]),
)

/** The faces around an axis. */
const AROUND: Record<number, readonly Face[]> = {
  0: ['U', 'D', 'F', 'B'],
  1: ['L', 'R', 'F', 'B'],
  2: ['U', 'D', 'L', 'R'],
}

/**
 * A RoadBlock-I scramble. Random turns would seldom let a slice turn (its
 * four faces' bars must all lie across it), so the centers would hardly
 * mix: whenever a slice can turn it mostly does; when none can, a quarter
 * turn of each face whose bars block an axis frees one.
 */
export function scrambleRoadblock(length: number, rng: () => number, start: Cube): Move[] {
  let state = start
  const moves: Move[] = []
  const play = (move: Move) => {
    state = applyMove(state, move, [5, 5, 5])
    moves.push(move)
  }
  while (moves.length < length) {
    const last = moves[moves.length - 1]
    const slices = SLICES.filter(
      (m) => roadblockTurns(state, m) && !(m.face === last?.face && m.depth === last.depth),
    )
    if (slices.length && rng() < 0.6) {
      play(slices[Math.floor(rng() * slices.length)]!)
    } else if (rng() < 0.5) {
      const outer = OUTER.filter((m) => m.face !== last?.face)
      play(outer[Math.floor(rng() * outer.length)]!)
    } else {
      // Free an axis: each face around it whose bars lie along it, a quarter.
      const axis = Math.floor(rng() * 3)
      for (const face of AROUND[axis]!) {
        const at = [0, 0, 0]
        at[FACE_SPEC[face].coordIndex] = 2 * FACE_SPEC[face].dir
        const middle = state.find((c) => c.position.join() === at.join())
        if (middle && barAxis(middle) === axis) play({ face, amount: rng() < 0.5 ? 1 : 3 })
      }
    }
  }
  return moves
}

/** Back to START: each face whose bars lie the other way, a quarter turn. */
export const toStart = (cube: Cube): Move[] =>
  FACES.filter((face) => {
    const axis = FACE_SPEC[face].coordIndex
    const at = [0, 1, 2].map((d) => (d === axis ? 2 * FACE_SPEC[face].dir : 0)).join()
    return barsTurned(cube).includes(at)
  }).map((face) => ({ face, amount: 1 }))

/** Whether every bar lies as at START. */
export const barsAtStart = (cube: Cube): boolean => barsTurned(cube).length === 0

/** Whether a RoadBlock-I's slot is a center (one coordinate at the edge of
 *  its 5x5x5): a click on it turns its face's bars. */
export const isBarCenter = (position: readonly number[]): boolean =>
  position.filter((v) => Math.abs(v) === 2).length === 1

/** The key of the face a center slot is on (`withBars`), from its place. */
export const faceKeyAt = (position: Vec3): string => {
  const axis = position.findIndex((v) => Math.abs(v) === 2)
  return faceKey(mapVec(position, (v, d) => (d === axis ? Math.sign(v) : 0)))
}
