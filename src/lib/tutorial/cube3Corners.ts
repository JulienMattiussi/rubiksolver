import { FACE_COLOR } from '../core/cube'
import { colorAt, hasColors } from '../core/pieces'
import { simplifyMoves } from '../core/moves'
import { applyMoves } from '../core/turn'
import type { Cube, Move, Vec3 } from '../core/types'
import { CORNER_PAIRS, cornerPlaced } from '../methods/standard/layers3'
import { homeOf } from '../methods/standard/pieces3'
import { keepsPlaced } from './keep'
import type { TutorialPick, TutorialStep } from './tutorial'

/**
 * The 3x3 tutorial's second stage: the yellow corners, one at a time, by
 * the beginner's trigger. A corner is brought above its slot (out of the
 * bottom layer first, by the trigger of the slot it sits in), then the
 * trigger of its slot, `R U R' U'` for the front right one, played until
 * it lands yellow down (once, three or five times). The trigger leaves the
 * bottom layer as it was but for its slot: the cross and the corners
 * placed stay.
 */

const Y = FACE_COLOR.D

type Pair = (typeof CORNER_PAIRS)[number]

const sameAt = (a: Vec3, b: Vec3) => a.join() === b.join()

/** A corner slot of the bottom layer, and the place above it. */
const slotOf = ([a, b]: Pair): Vec3 => homeOf(`D${a}${b}`)
const aboveOf = ([a, b]: Pair): Vec3 => homeOf(`U${a}${b}`)

/** The slot's trigger: its right side up, the top, back down, the top
 *  back (`R U R' U'` for the front right slot). */
const trigger = ([, b]: Pair): Move[] => [
  { face: b, amount: 1 },
  { face: 'U', amount: 1 },
  { face: b, amount: 3 },
  { face: 'U', amount: 3 },
]

/** The index of the corner carrying yellow and a slot's two colors. */
const cornerOf = (cube: Cube, [a, b]: Pair) =>
  cube.findIndex((c) => hasColors(c, [Y, FACE_COLOR[a], FACE_COLOR[b]]))

/** The slot a position is (null: not a bottom corner slot). */
const pairAt = (at: Vec3) => CORNER_PAIRS.find((p) => sameAt(slotOf(p), at)) ?? null

/**
 * The formula taking a corner to a slot, yellow down: out of the bottom
 * layer if it stands in another slot, the top turned to bring it above the
 * slot, then the slot's trigger until it lands. Null if it does not.
 */
function cornerFormula(cube: Cube, pick: TutorialPick): Move[] | null {
  const pair = pairAt(pick.slot)
  if (!pair) return null
  const lands = (c: Cube) =>
    sameAt(c[pick.piece]!.position, pick.slot) && colorAt(c[pick.piece]!, 'D') === Y
  const moves: Move[] = []
  const play = (more: Move[]) => {
    moves.push(...more)
    cube = applyMoves(cube, more)
  }
  // Out of another slot: its own trigger lifts it to the top.
  const from = pairAt(cube[pick.piece]!.position)
  if (from && from !== pair) play(trigger(from))
  // Above its slot: the top turned (it may be there already, or in it).
  if (!sameAt(cube[pick.piece]!.position, pick.slot)) {
    const turns = ([1, 2, 3] as const).find((amount) =>
      sameAt(applyMoves(cube, [{ face: 'U', amount }])[pick.piece]!.position, aboveOf(pair)),
    )
    if (turns) play([{ face: 'U', amount: turns }])
  }
  for (let k = 0; k < 6 && !lands(cube); k++) play(trigger(pair))
  // The trigger lifting it out ends on the top, as the turn above starts:
  // one turn of the top.
  return lands(cube) ? simplifyMoves(moves) : null
}

/** The yellow corners, a corner at a time: any yellow corner not placed,
 *  to any corner slot no placed corner holds, yellow down; the corners
 *  placed read where the step began (`begun`). The trigger keeps them only
 *  from a first layer whole: after turns by hand that broke it, the
 *  formula is null (the tutorial then goes back to where it began). */
export function cornersStep(cube: Cube, begun: Cube, cross: readonly number[]): TutorialStep {
  const placedPairs = CORNER_PAIRS.filter(([a, b]) => cornerPlaced(begun, a, b))
  const free = CORNER_PAIRS.filter((p) => !placedPairs.includes(p))
  const placed = [...cross, ...placedPairs.map((p) => cornerOf(cube, p))]
  const next = free[0]!
  return {
    key: 'stepTutorialCorner',
    stage: 2,
    progress: { done: placedPairs.length, total: CORNER_PAIRS.length },
    front: FACE_COLOR.F,
    marker: Y,
    placed,
    suggestion: { piece: cornerOf(cube, next), slot: slotOf(next) },
    pickable: free.map((p) => cornerOf(cube, p)),
    slots: () => free.map(slotOf),
    formula: (pick) => {
      const moves = pick && cornerFormula(cube, pick)
      return moves && keepsPlaced(cube, moves, placed, begun) ? moves : null
    },
  }
}

/** Whether the four yellow corners are all placed. */
export const cornersDone = (cube: Cube) => CORNER_PAIRS.every(([a, b]) => cornerPlaced(cube, a, b))
