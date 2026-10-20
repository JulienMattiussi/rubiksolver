import { turnedBy } from '../core/turn'
import type { Cube, Cubie, Turn } from '../core/types'

/**
 * The pieces a word of the glossary (or a step) lights, by index: those
 * that are something (a kind of piece), or those a turn moves (a layer, a
 * way of turning).
 */

export const piecesWhere =
  (is: (cubie: Cubie) => boolean) =>
  (cube: Cube): number[] =>
    cube.flatMap((c, i) => (is(c) ? [i] : []))

export const piecesTurnedBy =
  (turn: Turn) =>
  (cube: Cube): number[] => {
    const turns = turnedBy(cube, turn)
    return cube.flatMap((_, i) => (turns(i) ? [i] : []))
  }
