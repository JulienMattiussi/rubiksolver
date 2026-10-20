import { stateKey } from '../../core/cube'
import { invertMoves } from '../../core/moves'
import { parseMoves } from '../../core/notation'
import { applyMoves } from '../../core/turn'
import type { Cube, Dims, Move } from '../../core/types'
import { edgePairing } from '../../methods/standard/solver5/edges'
import { isMidge, isWing } from '../../methods/standard/solver5/kinds'
import { OUTER_GENERATORS } from '../../solve/solverKit'

/**
 * The 5x5's edges paired the way a cuber does, a wing at a time beside its
 * edge's middle piece: an inner slice moves a wing out of the front right
 * edge, `R U R' F R' F' R` flips that edge (the top layer taking the rest),
 * the slice comes back with the wing it brings. Outer turns first set up
 * the wings (they move whole edges, so nothing paired comes apart). Each
 * formula pairs one more edge, or one more wing with the paired edges kept;
 * the centers stay whole (the outer turns only spin their faces, as many
 * one way as the other).
 */

const MECHANISM: Dims = [5, 5, 5]
const FLIP = "R U R' F R' F' R"

/** The pairing formulas, read held from the front: the top or bottom
 *  slice, either way, and each played backwards. */
const BASE = [`2U ${FLIP} 2U'`, `2U' ${FLIP} 2U`, `2D ${FLIP} 2D'`, `2D' ${FLIP} 2D`].map((f) =>
  parseMoves(f),
)
export const PAIR_FORMULAS: readonly Move[][] = [...BASE, ...BASE.map(invertMoves)]

/** Outer turns setting up a pairing, at most. */
const SETUP_DEPTH = 3

/** Whether `after` pairs more than `before`: one more edge, or as many and
 *  one more wing. */
function better(before: Cube, after: Cube): boolean {
  const [b, a] = [edgePairing(before), edgePairing(after)]
  return a.edges > b.edges || (a.edges === b.edges && a.wings.length > b.wings.length)
}

const NEXT = new WeakMap<Cube, Move[] | null>()

/** The next pairing (once per state): the fewest outer turns, then a
 *  pairing formula, that pair more; null when none does (all paired, or
 *  the last edge crossed: the parity). */
export function nextPairing(cube: Cube): Move[] | null {
  if (NEXT.has(cube)) return NEXT.get(cube)!
  // Only the edges matter: the search turns them alone.
  const start = cube.filter((c) => isWing(c) || isMidge(c))
  let found: Move[] | null = null
  let frontier: { edges: Cube; moves: Move[] }[] = [{ edges: start, moves: [] }]
  const seen = new Set([stateKey(start)])
  for (let depth = 0; depth <= SETUP_DEPTH && !found; depth++) {
    for (const node of frontier) {
      const formula = PAIR_FORMULAS.find((f) => better(start, applyMoves(node.edges, f, MECHANISM)))
      if (formula) {
        found = [...node.moves, ...formula]
        break
      }
    }
    const next: typeof frontier = []
    for (const node of depth < SETUP_DEPTH && !found ? frontier : []) {
      for (const gen of OUTER_GENERATORS) {
        for (const amount of [1, 2, 3] as const) {
          const move = { ...gen, amount }
          const edges = applyMoves(node.edges, [move], MECHANISM)
          const key = stateKey(edges)
          if (seen.has(key)) continue
          seen.add(key)
          next.push({ edges, moves: [...node.moves, move] })
        }
      }
    }
    frontier = next
  }
  NEXT.set(cube, found)
  return found
}
