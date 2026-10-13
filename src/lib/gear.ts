import { FACE_SPEC, rotateN } from './geometry'
import type { Cube, Cubie, Face, GearMove, Vec3 } from './types'

/**
 * The Gear Cubes (Oskar van Deventer, 2009-2010, fan2cube.fr/gearcube1):
 * a 3x3x3 whose edges are gears. The two faces of an axis are suns, the
 * slice between them their carrier, its four edges the planets, so the
 * slice always stands halfway between its faces: turning a face a half turn
 * (its opposite face held) turns the slice a quarter, the same way. That is
 * the only move (fan2cube's D², Jaap's R): a face's quarter turn would leave
 * the slice at 45 degrees, where nothing else can turn.
 *
 * The slice's four gears spin while it turns, a sixth of a turn (60
 * degrees) each move (Jaap: "six 180 turns to complete one rotation"): the
 * same way for a clockwise turn of either face (the two suns turn opposite
 * ways around their carrier), counted here seen from outside the gear. They
 * all share that spin, which no cube rotation can say: each edge keeps it
 * (`Cubie.spin`, in sixths). A gear's colors show it every third of a turn
 * (Gear Cube), or only every full turn on the Ultimate, whose gears jut out
 * of the cube until then.
 */

/** A Gear Cube from a 3x3x3 (its solved one): every edge a gear, at rest. */
export function withGears(cube: Cube): Cube {
  return cube.map((c) => (c.position.filter((v) => v !== 0).length === 2 ? { ...c, spin: 0 } : c))
}

/** A cubie turned by quarter turns about an axis, its spin kept. */
function turned(c: Cubie, axis: 'x' | 'y' | 'z', times: number, spin = 0): Cubie {
  return {
    ...c,
    position: rotateN(c.position, axis, times),
    stickers: c.stickers.map((s) => ({ normal: rotateN(s.normal, axis, times), color: s.color })),
    ...(c.spin !== undefined && { spin: (((c.spin + spin) % 6) + 6) % 6 }),
  }
}

export function applyGearMove(cube: Cube, move: GearMove): Cube {
  const { axis, coordIndex, dir, sign } = FACE_SPEC[move.gear]
  const way = move.amount === 1 ? 1 : -1
  return cube.map((c) => {
    const at = c.position[coordIndex]!
    if (at === dir) return turned(c, axis, 2) // the face: a half turn
    // The slice: a quarter, the face's way; its gears spin a sixth.
    if (at === 0) return turned(c, axis, sign * way, c.spin === undefined ? 0 : way)
    return c // the opposite face, held
  })
}

const FACES: readonly Face[] = ['U', 'D', 'L', 'R', 'F', 'B']

/** Every gear move: each face, both ways. */
export const GEAR_TURNS: readonly GearMove[] = FACES.flatMap((gear) =>
  ([1, 3] as const).map((amount): GearMove => ({ gear, amount })),
)

/** Whether a move turns a piece fully (its face's layer). */
export function gearFaceTurns(move: GearMove, position: Vec3): boolean {
  const { coordIndex, dir } = FACE_SPEC[move.gear]
  return position[coordIndex] === dir
}

/** Whether a move turns a piece half as far (the slice beside its face). */
export function gearSliceTurns(move: GearMove, position: Vec3): boolean {
  return position[FACE_SPEC[move.gear].coordIndex] === 0
}

/** The face's half turn, for the animation: the slice turns half as far. */
export function gearRotation(move: GearMove) {
  const { axis, sign } = FACE_SPEC[move.gear]
  const unit = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] }[axis] as [number, number, number]
  return { axis: unit, angle: sign * (move.amount === 1 ? 1 : -1) * Math.PI }
}

export const invertGearMove = (move: GearMove): GearMove => ({
  ...move,
  amount: move.amount === 1 ? 3 : 1,
})

/** A move and its inverse in a row cancel; two the same way stay (they
 *  are not one: the slice turned a half, its gears two sixths). */
export function simplifyGearMoves(moves: readonly GearMove[]): GearMove[] {
  const out: GearMove[] = []
  for (const move of moves) {
    const last = out[out.length - 1]
    if (last?.gear === move.gear && last.amount !== move.amount) out.pop()
    else out.push(move)
  }
  return out
}

/** A scramble: gear moves at random, never undoing the last one. */
export function scrambleGear(length: number, rng: () => number): GearMove[] {
  const moves: GearMove[] = []
  while (moves.length < length) {
    const move = GEAR_TURNS[Math.floor(rng() * GEAR_TURNS.length)]!
    const last = moves[moves.length - 1]
    if (last?.gear === move.gear && last.amount !== move.amount) continue
    moves.push(move)
  }
  return moves
}

/** fan2cube's D² (a half turn), written R2 here, R2' the other way. */
export function formatGearMove(move: GearMove, labels: Record<Face, string>): string {
  return labels[move.gear] + '2' + (move.amount === 3 ? "'" : '')
}
