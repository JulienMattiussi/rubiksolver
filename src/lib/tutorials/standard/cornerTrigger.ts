import { CUBE_HOLDS } from '../../core/hold'
import { parseMoves, simplifyMoves } from '../../core/moves'
import { colorAt, hasColors } from '../../core/pieces'
import { applyMoves } from '../../core/turn'
import type { Color, Cube, Move, Vec3 } from '../../core/types'
import { CORNER_PAIRS } from '../../methods/standard/layers3'
import { homeOf } from '../../methods/standard/pieces3'
import type { TutorialPick } from '../../teach/tutorial'

/**
 * What the cube tutorials share (the 3x3's, the 2x2's): slots named by
 * their two sides, and the beginner's corner recipe: a corner brought above
 * its bottom slot then dropped in by the slot's trigger (`R U R' U'` held
 * with the slot front right), once, three or five times. The trigger leaves
 * the bottom layer as it was but for its slot.
 */

/** A side slot, by its two sides: the second the first's right (seen with
 *  the first in front), as its corners and middle edges are named. */
export type Pair = (typeof CORNER_PAIRS)[number]

export const sameAt = (a: Vec3, b: Vec3) => a.join() === b.join()

/** The index of the piece carrying these colors. */
export const pieceWith = (cube: Cube, colors: readonly Color[]) =>
  cube.findIndex((c) => hasColors(c, colors))

/** A bottom corner slot, and the slot at a position (null: none). */
export const cornerSlot = ([a, b]: Pair): Vec3 => homeOf(`D${a}${b}`)
export const cornerPairAt = (at: Vec3) =>
  CORNER_PAIRS.find((p) => sameAt(cornerSlot(p), at)) ?? null

/** The corners' trigger, read with the slot front right. */
export const TRIGGER = parseMoves("R U R' U'")

/** A slot's trigger as played: held with its first side in front. */
const triggerAt = ([a]: Pair) => TRIGGER.map((m) => CUBE_HOLDS.played(a, m) as Move)

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
