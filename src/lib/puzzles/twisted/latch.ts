import { FACE_COLOR } from '../../core/cube'
import { FACE_NORMAL } from '../../core/geometry'
import { applyMove } from '../../core/turn'
import type { Color, Cube, Cubie, Face, Move, Sticker, Vec3 } from '../../core/types'

/**
 * The Latch Cube (fan2cube.fr/latchcube1, Katsuhiko Okamoto, 2010): a 3x3
 * whose twelve edges each wear an arrow on one of their two stickers, six
 * black and six white. A face turns the way its arrows say: clockwise with
 * white ones, counterclockwise with black ones, either way with none, and
 * not at all with both (it locks). The arrows are on the pieces, so the
 * edges' colors say where they are: each edge (by its two colors) carries
 * its arrow on the sticker of `color`, turning `way`.
 *
 * Solved, each face wears two arrows of one kind on two opposite edges,
 * opposite faces turning opposite ways: black on the top (white), the front
 * (green) and the left (orange), white on the bottom, the back and the
 * right (as the real puzzle).
 */

export type ArrowWay = 'cw' | 'ccw'

/** Each edge (its two faces), the face whose sticker wears its arrow, and
 *  which way it turns that face. */
const ARROWS: readonly [Face, Face, Face, ArrowWay][] = [
  ['U', 'F', 'F', 'ccw'],
  ['U', 'L', 'U', 'ccw'],
  ['U', 'R', 'U', 'ccw'],
  ['U', 'B', 'B', 'cw'],
  ['F', 'R', 'R', 'cw'],
  ['F', 'L', 'L', 'ccw'],
  ['B', 'R', 'R', 'cw'],
  ['B', 'L', 'L', 'ccw'],
  ['D', 'F', 'F', 'ccw'],
  ['D', 'L', 'D', 'cw'],
  ['D', 'R', 'D', 'cw'],
  ['D', 'B', 'B', 'cw'],
]

const pairKey = (a: Color, b: Color) => [a, b].sort().join()

/** Each edge's arrow: the color of the sticker that wears it, its way
 *  (built when first asked: cube.ts, which defines the colors, loads after
 *  this file). */
let arrowOf: Map<string, { color: Color; way: ArrowWay }> | undefined
const ARROW_OF = () =>
  (arrowOf ??= new Map(
    ARROWS.map(([a, b, on, way]) => [
      pairKey(FACE_COLOR[a], FACE_COLOR[b]),
      { color: FACE_COLOR[on], way },
    ]),
  ))

/** The arrow a sticker of a piece wears, if any. */
export function arrowOn(cubie: Cubie, sticker: Sticker): ArrowWay | undefined {
  if (cubie.stickers.length !== 2) return undefined
  const arrow = ARROW_OF().get(pairKey(cubie.stickers[0]!.color, cubie.stickers[1]!.color))
  return arrow && arrow.color === sticker.color ? arrow.way : undefined
}

const on = (normal: Vec3, face: Face) => normal.join() === FACE_NORMAL[face].join()

/** The ways the arrows on a face let it turn. */
export function faceWays(cube: Cube, face: Face): { cw: boolean; ccw: boolean } {
  let cw = true
  let ccw = true
  for (const c of cube) {
    for (const s of c.stickers) {
      if (!on(s.normal, face)) continue
      const way = arrowOn(c, s)
      if (way === 'cw') ccw = false
      if (way === 'ccw') cw = false
    }
  }
  return { cw, ccw }
}

/** Whether a turn goes: its way allowed by the face's arrows (a half turn
 *  either way: two quarters, the face's arrows going round with it). */
export function latchTurns(cube: Cube, move: Move): boolean {
  if (move.depth) return false
  const { cw, ccw } = faceWays(cube, move.face)
  return move.amount === 1 ? cw : move.amount === 3 ? ccw : cw || ccw
}

const FACES = Object.keys(FACE_NORMAL) as Face[]

/** A scramble: turns at random among those that go from where the cube
 *  then stands, never the same face twice in a row (unless it is the only
 *  one left unlocked: the face just turned never locks). */
export function scrambleLatch(length: number, rng: () => number, start: Cube): Move[] {
  const moves: Move[] = []
  let cube = start
  while (moves.length < length) {
    const going = FACES.flatMap((face) =>
      ([1, 2, 3] as const)
        .map((amount): Move => ({ face, amount }))
        .filter((move) => latchTurns(cube, move)),
    )
    const fresh = going.filter((m) => m.face !== moves[moves.length - 1]?.face)
    const pool = fresh.length ? fresh : going
    const move = pool[Math.floor(rng() * pool.length)]!
    cube = applyMove(cube, move)
    moves.push(move)
  }
  return moves
}

/** The mark on the hidden core, along a diagonal (no face's): the core
 *  never moves, the mark only tells the Latch Cube from the 3x3. */
const MARK = { normal: [1, 1, 1] as Vec3, color: 'H' as Color }

const isCore = (c: Cubie) => c.position.every((v) => v === 0)

export const withLatchMark = (cube: Cube): Cube =>
  cube.map((c) => (isCore(c) && !c.stickers.length ? { ...c, stickers: [MARK] } : c))

export const withoutLatchMark = (cube: Cube): Cube =>
  cube.map((c) => (isCore(c) ? { ...c, stickers: [] } : c))
