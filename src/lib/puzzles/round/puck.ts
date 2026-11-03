import { FACE_NORMAL } from '../../core/geometry'
import type { Color, Cube, Cubie, SectorMove, SectorSteps } from '../../core/types'
import { sectorAt, sectorPlace } from '../shared/sectors'

/**
 * The Hockey Puck: a disc of two layers of twelve pieces round a black
 * center, of the 2-Star Prism's family (star.ts). Each layer turns on the
 * other, a twelfth (30 degrees) at a time, and the slash flips the right
 * half of the puck over, about the upright line through the center: its
 * six pieces of each layer change layers. The top pieces wear their number
 * (1 to 12) on top, the bottom ones only their color; the colors go by
 * pairs (1-2 red, 3-4 green, 5-6 yellow, 7-8 orange, 9-10 blue, 11-12
 * violet), the bottom ones under the top ones, as on the real puzzle.
 *
 * Its mechanism, the sectors and the slash, is shared/sectors.ts. A piece's
 * hidden face (the one against the other layer) says
 * which piece it is, for the model only: the drawing paints it dark.
 */

/** Each pair of pieces' color, by sector pair. */
export const PUCK_COLORS: readonly Color[] = ['R', 'G', 'Y', 'O', 'B', 'V']

/** The hidden faces, which tell the pieces apart: the odd and the even
 *  numbers of each pair, and the bottom pieces (alike in each pair). */
const HIDDEN = { odd: 'W', even: 'K', bottom: 'E' } as const satisfies Record<string, Color>

/** The solved puck: the top pieces, the bottom ones, the center's halves
 *  (right and left of the slash's line, drawn only). */
export function solvedPuck(): Cube {
  const piece = (m: number, z: number): Cubie => ({
    position: sectorAt(m, z),
    stickers: [
      { normal: z > 0 ? FACE_NORMAL.F : FACE_NORMAL.B, color: PUCK_COLORS[m >> 1]! },
      {
        normal: z > 0 ? FACE_NORMAL.B : FACE_NORMAL.F,
        color: z < 0 ? HIDDEN.bottom : m % 2 === 0 ? HIDDEN.odd : HIDDEN.even,
      },
    ],
  })
  return [
    ...TWELVE.map((m) => piece(m, 1)),
    ...TWELVE.map((m) => piece(m, -1)),
    { position: [1, 0, 0], stickers: [] },
    { position: [-1, 0, 0], stickers: [] },
  ]
}

/** The twelve sectors of a layer. */
const TWELVE = Array.from({ length: 12 }, (_, m) => m)

const mod = (a: number, n: number) => ((a % n) + n) % n

/** Which piece a top piece is (its number), from its hidden face. */
export function puckNumber(cubie: Cubie): number | undefined {
  const hidden = cubie.stickers[1]!.color
  if (hidden === HIDDEN.bottom) return undefined
  return 2 * PUCK_COLORS.indexOf(cubie.stickers[0]!.color) + (hidden === HIDDEN.odd ? 1 : 2)
}

/** Whether the puck is solved, however its whole is turned: the numbers
 *  in order on top, face up, each pair's color under its pair. */
export function puckSolved(cube: Cube): boolean {
  const top: (number | undefined)[] = []
  const bottom: (Color | undefined)[] = []
  for (const c of cube) {
    const place = sectorPlace(c.position)
    if (!place) continue
    const up = c.stickers[0]!.normal[2] === place.z
    if (place.z > 0) top[place.m] = up ? puckNumber(c) : undefined
    else bottom[place.m] = up && puckNumber(c) === undefined ? c.stickers[0]!.color : undefined
  }
  const turn = mod((top[0] ?? 0) - 1, 12)
  return TWELVE.every((m) => {
    const n = mod(m + turn, 12)
    return top[m] === n + 1 && bottom[m] === PUCK_COLORS[n >> 1]
  })
}

/** A scramble: each layer turned, then the slash, again and again (a
 *  Square-1's). */
export function scramblePuck(length: number, rng: () => number): SectorMove[] {
  const moves: SectorMove[] = []
  const steps = () => (1 + Math.floor(rng() * 11)) as SectorSteps
  while (moves.length < length) {
    moves.push({ layer: 'U', steps: steps() }, { layer: 'D', steps: steps() }, { flip: true })
  }
  return moves.slice(0, length)
}
