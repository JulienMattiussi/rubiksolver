import { isSolved } from '../../core/cube'
import { homesOf } from '../../core/pieces'
import { normalIndex } from '../../core/geometry'
import { NOTATION_FR } from '../../core/moves'
import type { MoveSet } from '../../core/moveSet'
import { solvePieces } from '../../solve/pieceSearch'
import type { MethodPlan } from '../../solve/solverKit'
import { parseStarMoves } from '../../puzzles/round/star'
import type { Color, Cube, Cubie, RingMove, StarMove } from '../../core/types'

/**
 * Star Prism, "isolate then permute", as taught on fan2cube.fr (2-star1):
 *
 *   1. Isolate the points  every green-topped point up, every blue one down,
 *                          with the slash and the page's two placements
 *                          (`/-1/1` for the top-left half, `/1+3B/` for two
 *                          points to bring up)
 *   2. Finish the bottom   with K = /-1/1+B/-B/, which swaps two bottom points
 *                          (and two top ones, no matter yet), and bottom turns
 *   3. Finish the top      with K again: applied twice, the bottom comes back,
 *                          so only top turns set it up. Plus the page's two
 *                          singular cases: the half-screw flipped (/3/3/) and
 *                          two top points to swap (4(1+K))
 *
 * Every phase searches over these formulas only; each formula's effect is
 * asserted in tests/unit/puzzles/round/star.test.ts.
 */

const formula = (text: string): StarMove[] => parseStarMoves(text, NOTATION_FR)

const K = formula('/-1/1+B/-B/')
const ISOLATE_FORMULAS = [formula('/-1/1'), formula('/1+3B/')]
const HALF_SCREW = formula('/3/3/')
/** 4(1+K): four times a top turn then K. */
const SWAP_TOP = formula(Array(4).fill('1 + /-1/1+B/-B/').join(' '))

const AMOUNTS: RingMove['amount'][] = [1, 2, 3, 4, 5]
export const ringTurns = (ring: RingMove['ring']): StarMove[] =>
  AMOUNTS.map((amount) => ({ ring, amount }))

/** A move set of star turns, shown as the turns it allows. */
export function starSet(turns: StarMove[]): MoveSet {
  return { generators: turns, turns }
}

const EVERY_TURN = starSet([...ringTurns('U'), ...ringTurns('D'), { slash: true }])

const TOP_COLOR: Color = 'G'
const isPoint = (c: Cubie) => c.position[1] !== 0
const isGreen = (c: Cubie) => c.stickers.some((s) => s.color === TOP_COLOR)

const POINTS = homesOf('star', isPoint)
const BOTTOM_POINTS = homesOf('star', (c) => isPoint(c) && !isGreen(c))
const EVERYTHING = homesOf('star', () => true)

/** Green points up, blue points down (the layers are separated). */
function isolated(cubies: readonly Cubie[]): boolean {
  return cubies.filter(isPoint).every((c) => isGreen(c) === c.position[1] > 0)
}

/** Neighboring points show one color in each valley they share. */
function valleysMatch(cubies: readonly Cubie[]): boolean {
  const seen = new Map<number, Color>()
  for (const c of cubies) {
    for (const s of c.stickers) {
      const valley = normalIndex(s.normal)
      if (valley < 6) continue
      const color = seen.get(valley)
      if (color === undefined) seen.set(valley, s.color)
      else if (color !== s.color) return false
    }
  }
  return true
}

const bottomDone = (cubies: readonly Cubie[]) =>
  isolated(cubies) && valleysMatch(cubies.filter((c) => isPoint(c) && c.position[1] < 0))

/** Which slots hold a green point: the separation evolves from this alone. */
const layerPattern = (cubies: readonly Cubie[]): string =>
  cubies
    .filter(isPoint)
    .map((c) => `${c.position.join(',')}${isGreen(c) ? 'G' : 'B'}`)
    .sort()
    .join(' ')

function isolate(cube: Cube): StarMove[] {
  return solvePieces(cube, {
    track: POINTS,
    moves: EVERY_TURN,
    macros: ISOLATE_FORMULAS,
    goal: isolated,
    key: layerPattern,
    maxDepth: 12,
  })
}

function finishBottom(cube: Cube): StarMove[] {
  return solvePieces(cube, {
    track: BOTTOM_POINTS,
    moves: starSet(ringTurns('D')),
    macros: [K],
    goal: bottomDone,
    maxDepth: 16,
  })
}

function finishTop(cube: Cube): StarMove[] {
  return solvePieces(cube, {
    track: EVERYTHING,
    moves: starSet(ringTurns('U')),
    macros: [K, HALF_SCREW, SWAP_TOP],
    goal: isSolved,
    maxDepth: 16,
  })
}

export const STAR_PLAN: MethodPlan = [
  {
    key: 'stepIsolate',
    goal: (c) => isolated(c),
    moves: EVERY_TURN,
    phases: [isolate],
  },
  { key: 'stepStarBottom', goal: (c) => bottomDone(c), moves: EVERY_TURN, phases: [finishBottom] },
  { key: 'stepStarTop', goal: isSolved, moves: EVERY_TURN, phases: [finishTop] },
]
