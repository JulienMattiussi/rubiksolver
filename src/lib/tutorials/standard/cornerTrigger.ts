import { FACE_COLOR } from '../../core/cube'
import { CUBE_HOLDS, type Hold } from '../../core/hold'
import { simplifyMoves } from '../../core/moves'
import { parseMoves } from '../../core/notation'
import { colorAt, hasColors, sameAt } from '../../core/pieces'
import { applyMoves } from '../../core/turn'
import type { Color, Cube, Move, Vec3 } from '../../core/types'
import { CORNER_PAIRS, cornerPlaced } from '../../methods/standard/layers3'
import { homeOf } from '../../methods/standard/pieces3'
import type { Target } from '../../teach/kit'
import type { TutorialPick } from '../../teach/tutorial'

/**
 * What the cube tutorials share (the 3x3's, the 2x2's, Ofapel's): slots
 * named by their two sides, a turn of the top, a formula read in a hold,
 * the yellow corners as targets, and the beginner's corner recipe: a
 * corner brought above its bottom slot then dropped in by the slot's
 * trigger (`R U R' U'` held with the slot front right), once, three or five
 * times. The trigger leaves the bottom layer as it was but for its slot.
 */

/** A side slot, by its two sides: the second the first's right (seen with
 *  the first in front), as its corners and middle edges are named. */
export type Pair = (typeof CORNER_PAIRS)[number]

/** The index of the piece carrying these colors. */
export const pieceWith = (cube: Cube, colors: readonly Color[]) =>
  cube.findIndex((c) => hasColors(c, colors))

/** A bottom corner slot, and the slot at a position (null: none). */
const cornerSlot = ([a, b]: Pair): Vec3 => homeOf(`D${a}${b}`)
export const cornerPairAt = (at: Vec3) =>
  CORNER_PAIRS.find((p) => sameAt(cornerSlot(p), at)) ?? null

/** A yellow corner as a target: its bottom slot, placed there yellow down. */
export const cornerTarget = (pair: Pair): Target => ({
  piece: (cube) => pieceWith(cube, [FACE_COLOR.D, FACE_COLOR[pair[0]], FACE_COLOR[pair[1]]]),
  slot: cornerSlot(pair),
  placed: (cube) => cornerPlaced(cube, pair[0], pair[1]),
})

/** A turn of the top, `amount` quarters (none: no move). */
export const topTurn = (amount: number): Move[] =>
  amount % 4 === 0 ? [] : [{ face: 'U', amount: (amount % 4) as 1 | 2 | 3 }]

/** A formula read in a hold, as played. */
export const playedIn = (hold: Hold, moves: readonly Move[]): Move[] =>
  moves.map((m) => CUBE_HOLDS.played(hold, m) as Move)

/** The corners' trigger, read with the slot front right. */
export const TRIGGER = parseMoves("R U R' U'")

/** A slot's trigger as played: held with its first side in front. */
const triggerAt = ([a]: Pair) => playedIn(a, TRIGGER)

/**
 * A corner to a bottom slot, its `bottom` color down: out of the bottom
 * layer if it stands in another slot (that slot's trigger lifts it), the
 * top turned to bring it above the slot, then the slot's trigger until it
 * lands.
 */
export function cornerFormula(cube: Cube, pick: TutorialPick, bottom: Color): Move[] | null {
  const pair = cornerPairAt(pick.slot)
  if (!pair) return null
  const lands = (c: Cube) =>
    sameAt(c[pick.piece]!.position, pick.slot) && colorAt(c[pick.piece]!, 'D') === bottom
  const moves: Move[] = []
  const play = (more: Move[]) => {
    moves.push(...more)
    cube = applyMoves(cube, more)
  }
  const from = cornerPairAt(cube[pick.piece]!.position)
  if (from && from !== pair) play(triggerAt(from))
  if (!sameAt(cube[pick.piece]!.position, pick.slot)) {
    const above = homeOf(`U${pair[0]}${pair[1]}`)
    const turns = ([1, 2, 3] as const).find((amount) =>
      sameAt(applyMoves(cube, [{ face: 'U', amount }])[pick.piece]!.position, above),
    )
    if (turns) play([{ face: 'U', amount: turns }])
  }
  for (let k = 0; k < 6 && !lands(cube); k++) play(triggerAt(pair))
  // The trigger lifting it out ends on the top, as the turn above starts:
  // one turn of the top.
  return lands(cube) ? simplifyMoves(moves) : null
}
