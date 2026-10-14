import { FACE_NORMAL } from '../../core/geometry'
import type { FaceLabels } from '../../core/moves'
import type { Color, Cube, Cubie, PuckMove, PuckSteps, Vec3 } from '../../core/types'

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
 * The model stays integer. Sector m (0 to 11) is clockwise from the top
 * line, its middle at 75 - 30m degrees, in the plane x, y; the top layer at
 * z = 1, the bottom one at z = -1. A layer's turn of k sectors (clockwise
 * seen from above) takes m to m + k; the slash takes sector m (0 to 5) of
 * either layer to sector 5 - m of the other, front and back swapped.
 * Positions are integer points near each sector's direction, only ever
 * told apart. A piece's hidden face (the one against the other layer) says
 * which piece it is, for the model only: the drawing paints it dark.
 */

const SECTORS: readonly (readonly [number, number])[] = [
  [2, 6],
  [4, 4],
  [6, 2],
  [6, -2],
  [4, -4],
  [2, -6],
  [-2, -6],
  [-4, -4],
  [-6, -2],
  [-6, 2],
  [-4, 4],
  [-2, 6],
]

const KEY_OF = new Map(
  SECTORS.flatMap(([x, y], m) => [1, -1].map((z) => [[x, y, z].join(), { m, z }] as const)),
)

/** The sector and layer (1 on top, -1 below) of a position, if a piece's. */
export const puckPlace = (position: Vec3) => KEY_OF.get(position.join())

const at = (m: number, z: number): Vec3 => [SECTORS[m]![0], SECTORS[m]![1], z]

/** Each pair of pieces' color, by sector pair. */
export const PUCK_COLORS: readonly Color[] = ['R', 'G', 'Y', 'O', 'B', 'V']

/** The hidden faces, which tell the pieces apart: the odd and the even
 *  numbers of each pair, and the bottom pieces (alike in each pair). */
const HIDDEN = { odd: 'W', even: 'K', bottom: 'E' } as const satisfies Record<string, Color>

/** The solved puck: the top pieces, the bottom ones, the center's halves
 *  (right and left of the slash's line, drawn only). */
export function solvedPuck(): Cube {
  const piece = (m: number, z: number): Cubie => ({
    position: at(m, z),
    stickers: [
      { normal: z > 0 ? FACE_NORMAL.F : FACE_NORMAL.B, color: PUCK_COLORS[m >> 1]! },
      {
        normal: z > 0 ? FACE_NORMAL.B : FACE_NORMAL.F,
        color: z < 0 ? HIDDEN.bottom : m % 2 === 0 ? HIDDEN.odd : HIDDEN.even,
      },
    ],
  })
  return [
    ...SECTORS.map((_, m) => piece(m, 1)),
    ...SECTORS.map((_, m) => piece(m, -1)),
    { position: [1, 0, 0], stickers: [] },
    { position: [-1, 0, 0], stickers: [] },
  ]
}

const mod = (a: number, n: number) => ((a % n) + n) % n

/** Whether a turn carries a piece at `position`: its layer, or the right
 *  half (and the center's right half) for the slash. */
export function puckTurns(move: PuckMove, position: Vec3): boolean {
  const place = puckPlace(position)
  if ('flip' in move) return place ? place.m <= 5 : position[0] > 0
  return place !== undefined && place.z === (move.layer === 'U' ? 1 : -1)
}

export function applyPuckMove(cube: Cube, move: PuckMove): Cube {
  return cube.map((c) => {
    if (!puckTurns(move, c.position)) return c
    const place = puckPlace(c.position)
    if (!place) return c // the center's half turns into itself
    if ('flip' in move) {
      return {
        position: at(5 - place.m, -place.z),
        stickers: c.stickers.map((s) => ({ normal: [0, 0, -s.normal[2]] as Vec3, color: s.color })),
      }
    }
    return { ...c, position: at(mod(place.m + move.steps, 12), place.z) }
  })
}

/** A turn as the renderer animates it, in the model's frame (x right,
 *  across the slash's cut, y along it, z up out of the top). */
export function puckRotation(move: PuckMove): { axis: [number, number, number]; angle: number } {
  // The slash: about the axis across the cut (x), as the 2-Star's: the
  // right half stays right, its front going back and its top down.
  if ('flip' in move) return { axis: [1, 0, 0], angle: Math.PI }
  const k = move.steps > 6 ? move.steps - 12 : move.steps
  return { axis: [0, 0, 1], angle: (-k * Math.PI) / 6 }
}

/** The pad's and the guide's turns: each layer a twelfth either way, the
 *  slash. */
export const PUCK_TURNS: readonly PuckMove[] = [
  ...(['U', 'D'] as const).flatMap((layer) =>
    ([1, 11] as const).map((steps): PuckMove => ({ layer, steps })),
  ),
  { flip: true },
]

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
    const place = puckPlace(c.position)
    if (!place) continue
    const up = c.stickers[0]!.normal[2] === place.z
    if (place.z > 0) top[place.m] = up ? puckNumber(c) : undefined
    else bottom[place.m] = up && puckNumber(c) === undefined ? c.stickers[0]!.color : undefined
  }
  const turn = mod((top[0] ?? 0) - 1, 12)
  return SECTORS.every((_, m) => {
    const n = mod(m + turn, 12)
    return top[m] === n + 1 && bottom[m] === PUCK_COLORS[n >> 1]
  })
}

/** A scramble: each layer turned, then the slash, again and again (a
 *  Square-1's). */
export function scramblePuck(length: number, rng: () => number): PuckMove[] {
  const moves: PuckMove[] = []
  const steps = () => (1 + Math.floor(rng() * 11)) as PuckSteps
  while (moves.length < length) {
    moves.push({ layer: 'U', steps: steps() }, { layer: 'D', steps: steps() }, { flip: true })
  }
  return moves.slice(0, length)
}

export function invertPuckMove(move: PuckMove): PuckMove {
  return 'flip' in move
    ? move
    : { layer: move.layer, steps: (12 - move.steps) as typeof move.steps }
}

/** Merge consecutive turns of the same layer, cancel two slashes. */
export function simplifyPuckMoves(moves: readonly PuckMove[]): PuckMove[] {
  const out: PuckMove[] = []
  for (const move of moves) {
    const last = out[out.length - 1]
    if (last && 'flip' in last && 'flip' in move) out.pop()
    else if (last && 'layer' in last && 'layer' in move && last.layer === move.layer) {
      out.pop()
      const steps = (last.steps + move.steps) % 12
      if (steps) out.push({ layer: move.layer, steps: steps as typeof move.steps })
    } else out.push(move)
  }
  return out
}

/** A turn as written, as the star prisms' (fan2cube's): the top's signed
 *  twelfths (`2`, `-1`), the bottom's with its letter (`-2B`, `B`), the
 *  slash `/`. */
export function formatPuckMove(move: PuckMove, labels: FaceLabels): string {
  if ('flip' in move) return '/'
  const k = move.steps > 6 ? move.steps - 12 : move.steps
  if (move.layer === 'U') return String(k)
  return `${k === 1 ? '' : k === -1 ? '-' : k}${labels.D}`
}

/** Parse that notation (`/ B / 1-B / -1 /`): slashes, `+`, spaces and a
 *  sign after a turn separate turns, parentheses only help reading. */
export function parsePuckMoves(text: string, labels: FaceLabels): PuckMove[] {
  const bottom = new RegExp(`^(-?\\d*)${labels.D}$`)
  return (
    text
      .replace(/[()]/g, '')
      .replace(/\//g, ' / ')
      // `1-B`: the top turned 1, the bottom -1.
      .replace(/([\dA-Za-z])-/g, '$1 -')
      .split(/[+\s]+/)
      .filter(Boolean)
      .map((token): PuckMove => {
        if (token === '/') return { flip: true }
        const lower = bottom.exec(token)
        const n = lower
          ? lower[1] === ''
            ? 1
            : lower[1] === '-'
              ? -1
              : Number(lower[1])
          : Number(token)
        if (!Number.isInteger(n) || n % 12 === 0) throw new Error(`parsePuckMoves: "${token}"`)
        return { layer: lower ? 'D' : 'U', steps: mod(n, 12) as PuckSteps }
      })
  )
}
