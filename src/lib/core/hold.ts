import type { Face, Move } from './types'

/**
 * The way the puzzle is held: which side faces you, the top kept up (a turn
 * of the whole puzzle about its vertical axis). Moves stay written in the
 * puzzle's own frame; read in a hold, each side takes the name of where it
 * now stands, so a formula written once (`R U R' U'`) serves every side.
 */
export type Hold = 'F' | 'R' | 'B' | 'L'

/** The sides round the top, each the right of the one before (seen with
 *  it in front). */
const ROUND: readonly Hold[] = ['F', 'R', 'B', 'L']

const isSide = (face: Face): face is Hold => (ROUND as readonly Face[]).includes(face)

/** How many steps round a hold is from the front. */
const turnsOf = (hold: Hold) => ROUND.indexOf(hold)

/** The side of the puzzle seen as `face` in a hold (the top and bottom
 *  stay). */
export function heldFace(hold: Hold, face: Face): Face {
  return isSide(face) ? ROUND[(turnsOf(face) + turnsOf(hold)) % 4]! : face
}

/** The name a side of the puzzle takes in a hold. */
export function faceInHold(hold: Hold, face: Face): Face {
  return isSide(face) ? ROUND[(turnsOf(face) - turnsOf(hold) + 4) % 4]! : face
}

/** A move as read in a hold (its letter where its side now stands). */
export const moveInHold = (hold: Hold, move: Move): Move => ({
  ...move,
  face: faceInHold(hold, move.face),
})

/** The move of the puzzle a move read in a hold makes. */
export const heldMove = (hold: Hold, move: Move): Move => ({
  ...move,
  face: heldFace(hold, move.face),
})
