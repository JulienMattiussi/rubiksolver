import { FACE_SPEC, rotateN } from '../../core/geometry'
import {
  hasColoredClips,
  isGearMove,
  type Cube,
  type CubeShape,
  type Cubie,
  type Face,
  type GearMove,
  type Move,
  type Turn,
  type Vec3,
} from '../../core/types'

/**
 * The Gear Cubes (Oskar van Deventer, 2009-2010, fan2cube.fr/gearcube1):
 * a 3x3x3 whose edges are gears. The two faces of an axis are suns, the
 * slice between them their carrier, its four edges the planets, so the
 * slice always stands halfway between its faces: turning a face a half turn
 * (its opposite face held) turns the slice a quarter, the same way. That is
 * the only move (fan2cube's D², Jaap's R): a face's quarter turn would leave
 * the slice at 45 degrees, where nothing else can turn.
 *
 * The slice's four gears spin on their bases (the clips) while it turns,
 * five sixths of a turn (300 degrees, about the 135 degrees per quarter
 * turn of a face measured on the real puzzle) each move: the same way for
 * a clockwise turn of either face (the two suns turn opposite ways around
 * their carrier), counted here seen from outside the gear. They all share
 * that spin, which no cube rotation can say: each edge keeps it
 * (`Cubie.spin`, in sixths). A gear's shape has a half turn's symmetry, so
 * the Ultimate's gears fit the cube again every three moves (six quarter
 * turns of a face: what the real puzzle shows), turned over on their
 * bases: a gear's colors need not be its clips'. Four moves pivot them a
 * notch (a third), twelve bring them home.
 */

/** A clockwise move's spin, in sixths of a turn. */
const GEAR_SPIN = 5

/** How far a move spins its slice's gears, in sixths (signed). */
export const gearSpinOf = (move: GearMove): number =>
  (move.amount === 1 ? 1 : -1) * (move.times ?? 1) * GEAR_SPIN

/** Whether a position is an edge's (two coordinates off the middle). */
const isEdgeAt = (p: Vec3) => p.filter((v) => v !== 0).length === 2

/** Whether the edge at a position is a gear on a shape: every one, but the
 *  Extreme's middle layer (no gears: plain blocks, its top and bottom turn
 *  freely). */
export const gearAt = (shape: CubeShape, p: Vec3): boolean =>
  isEdgeAt(p) && (shape !== 'gearX' || p[1] !== 0)

/** A Gear Cube from a 3x3x3 (its solved one): its edges gears, at rest;
 *  with `plainClips`, clips that bear no color (the plain Gear Cube). */
export function withGears(cube: Cube, plainClips = false, shape: CubeShape = 'gearU'): Cube {
  return cube.map((c) =>
    gearAt(shape, c.position)
      ? { ...c, spin: 0, ...(plainClips && { plainClips: true as const }) }
      : c,
  )
}

/**
 * A plain Gear Cube's edge as its gear shows: its clips bear no color, so
 * clips half a turn round, the gear on them half a turn back, is the same
 * edge. A gear half a turn round or more on its clips (spin 3 or more) is
 * written so: the piece a half turn about its axis (its stickers' two faces
 * swapped), its spin under 3, the gear standing as it did.
 */
function asSeen(c: Cubie): Cubie {
  if (!c.plainClips || c.spin === undefined || c.spin < 3) return c
  return {
    ...c,
    stickers: c.stickers.map((s, i) => ({ ...s, normal: c.stickers[1 - i]!.normal })),
    spin: c.spin - 3,
  }
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
  if (move.times) {
    const once = { gear: move.gear, amount: move.amount }
    return applyGearMove(applyGearMove(applyGearMove(cube, once), once), once)
  }
  const { axis, coordIndex, dir, sign } = FACE_SPEC[move.gear]
  const way = move.amount === 1 ? 1 : -1
  return cube.map((c) => {
    const at = c.position[coordIndex]!
    if (at === dir) return turned(c, axis, 2) // the face: a half turn
    // The slice: a quarter, the face's way; its gears spin five sixths.
    if (at === 0) {
      return asSeen(turned(c, axis, sign * way, c.spin === undefined ? 0 : way * GEAR_SPIN))
    }
    return c // the opposite face, held
  })
}

const FACES: readonly Face[] = ['U', 'D', 'L', 'R', 'F', 'B']

/** A gear's pivot as it shows, in sixths: its spin less any half turn, a
 *  gear looking the same half a turn round (0, 1 or 2). */
export const shownSpin = (spin: number): number => spin % 3

/**
 * A Gear Cube as entered: its edges gears, each pivoted as entered (`spins`,
 * its shown pivot by slot, see `shownSpin`), the Ultimate's and the
 * Extreme's `turned` over on their clips besides (half a turn more).
 */
export function withEnteredGears(
  cube: Cube,
  shape: CubeShape,
  turned: readonly string[],
  spins: Readonly<Record<string, number>>,
): Cube {
  return withGears(cube, !hasColoredClips(shape), shape).map((c) => {
    if (c.spin === undefined) return c
    const key = c.position.join(',')
    return { ...c, spin: (spins[key] ?? 0) + (turned.includes(key) ? 3 : 0) }
  })
}

/** Every gear move: each face, both ways. */
export const GEAR_TURNS: readonly GearMove[] = FACES.flatMap((gear) =>
  ([1, 3] as const).map((amount): GearMove => ({ gear, amount })),
)

/**
 * Every turn of a Gear Cube shape: its gear moves; on the Extreme, the side
 * faces' only, its top and bottom turning like a 3x3's (a quarter, either
 * way, or a half), the middle layer's edges being no gears.
 */
export function gearTurnsOf(shape: CubeShape): readonly Turn[] {
  if (shape !== 'gearX') return GEAR_TURNS
  return [
    ...GEAR_TURNS.filter((m) => m.gear !== 'U' && m.gear !== 'D'),
    ...(['U', 'D'] as const).flatMap((face) =>
      ([1, 2, 3] as const).map((amount): Move => ({ face, amount })),
    ),
  ]
}

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
  return { axis: unit, angle: sign * (move.amount === 1 ? 1 : -1) * Math.PI * (move.times ?? 1) }
}

export const invertGearMove = (move: GearMove): GearMove => ({
  ...move,
  amount: move.amount === 1 ? 3 : 1,
})

/** Whether two gear moves in a row cancel: a move and its inverse. Two
 *  the same way stay (they are not one: the slice turned a half, its gears
 *  ten sixths). */
export const gearMovesCancel = (a: GearMove, b: GearMove): boolean =>
  a.gear === b.gear && a.amount !== b.amount

/** A scramble: turns at random, never undoing the last one (nor, for a
 *  plain face's, turning it again). */
export function scrambleGear(shape: CubeShape, length: number, rng: () => number): Turn[] {
  const turns = gearTurnsOf(shape)
  const moves: Turn[] = []
  while (moves.length < length) {
    const move = turns[Math.floor(rng() * turns.length)]!
    const last = moves[moves.length - 1]
    if (last && isGearMove(last) && isGearMove(move)) {
      if (last.gear === move.gear && last.amount !== move.amount) continue
    } else if (last && 'face' in last && 'face' in move && last.face === move.face) continue
    moves.push(move)
  }
  return moves
}

/** fan2cube's D² (a half turn), written R2 here, R2' the other way; 3R2
 *  three in a row. */
export function formatGearMove(move: GearMove, labels: Record<Face, string>): string {
  return (move.times ? '3' : '') + labels[move.gear] + '2' + (move.amount === 3 ? "'" : '')
}

/** fan2cube's letters: H(aut), B(as), G(auche), D(roite), A(vant),
 *  P(ostérieur). */
const FAN2CUBE: Record<string, Face> = { H: 'U', B: 'D', G: 'L', D: 'R', A: 'F', P: 'B' }

/**
 * A Gear Cube formula as fan2cube writes it (gearultimate2): a side face
 * turns by gears, `D²` one move (our R2), `D4` two, `D8` four, `D'²` the
 * other way; the Extreme's top and bottom by quarters (`H`, `B'`, `H²`).
 * Dots and spaces only space it out.
 */
export function parseGearFormula(text: string): Turn[] {
  const out: Turn[] = []
  for (const [, letter, prime, power] of text.matchAll(/([HBGDAP])('?)(²|2|4|8)?/g)) {
    const face = FAN2CUBE[letter!]!
    const amount = prime ? 3 : 1
    if (face === 'U' || face === 'D') {
      out.push({ face, amount: power === '²' || power === '2' ? 2 : amount })
    } else {
      const times = power === '4' ? 2 : power === '8' ? 4 : 1
      for (let i = 0; i < times; i++) out.push({ gear: face, amount })
    }
  }
  return out
}
