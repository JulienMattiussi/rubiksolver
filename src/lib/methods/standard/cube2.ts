import { cubeOrientations, isSolved, OPPOSITE_COLOR, solvedCube, stateKey } from '../../core/cube'
import { colorAt, cubieAt, listedAs } from '../../core/pieces'
import { applyMove } from '../../core/turn'
import { invertMoves } from '../../core/moves'
import { OUTER_TURNS } from '../../core/moveSet'
import type { MethodPlan } from '../../solve/solverKit'
import type { Color, Cube, CubeColor, Face, Move } from '../../core/types'

// ---------------------------------------------------------------------------
// The 2x2's frame, for the puzzles solved as one (the Void Cube's corners);
// its own layer-by-layer method is its tutorial's
// (lib/tutorials/standard/cube2.ts)
// ---------------------------------------------------------------------------
//
// A 2x2 has no centers, so there is no fixed color frame. The corner sitting
// at DBL (position [-1,-1,-1]) plays that role instead: its three stickers
// define the D/L/B reference colors (opposites follow from the standard color
// scheme). Predicates re-derive this frame from the state they inspect, so
// algorithms that move the anchor corner stay sound: a state satisfies a goal
// exactly when it is consistent with whatever corner then anchors it.

/** Reference color of each face, anchored on the corner currently at DBL. */
export function frame2(cube: Cube): Record<Face, Color> {
  const dbl = cubieAt(cube, [-1, -1, -1])
  if (!dbl) throw new Error('frame2: no corner at DBL')
  // A 2x2 only wears cube colors.
  const d = colorAt(dbl, 'D') as CubeColor | undefined
  const l = colorAt(dbl, 'L') as CubeColor | undefined
  const b = colorAt(dbl, 'B') as CubeColor | undefined
  if (!d || !l || !b) throw new Error('frame2: DBL corner is missing stickers')
  return { D: d, L: l, B: b, U: OPPOSITE_COLOR[d], R: OPPOSITE_COLOR[l], F: OPPOSITE_COLOR[b] }
}

// ---------------------------------------------------------------------------
// 2x2 optimal solver (bidirectional breadth-first search)
// ---------------------------------------------------------------------------

/** U/R/F generate the whole 2x2 group while never moving the DBL corner. */
const MOVES_URF: readonly Face[] = ['U', 'R', 'F']

/** God's number for the 2x2 is 11 half-turn-metric moves, so a solvable cube
 *  always meets within a combined search depth of 11; 12 proves impossibility. */
const MAX_DEPTH_2 = 12

/** The 24 orientations of a solved 2x2 with their DBL frames, computed once. */
const SOLVED_2 = cubeOrientations(solvedCube('2')).map((c) => ({ cube: c, frame: frame2(c) }))

interface BfsSide {
  frontier: Array<{ cube: Cube; moves: Move[] }>
  /** Shortest move sequence (from this side's origin) per visited state key. */
  visited: Map<string, Move[]>
}

function bfsSide(origin: Cube): BfsSide {
  return { frontier: [{ cube: origin, moves: [] }], visited: new Map([[stateKey(origin), []]]) }
}

/**
 * Optimal 2x2 solution by bidirectional BFS over U/R/F turns, from `cube`
 * towards the orientation of the solved cube that shares its DBL corner (URF
 * turns never move that corner, so both searches walk the same coset).
 *
 * A meet gives forward-moves + inverted backward-moves. The first meet may not
 * be the best one, so the search keeps expanding until the two depths add up
 * to the best total found; any shorter solution would already have met.
 * Throws when depth `MAX_DEPTH_2` is exhausted, i.e. the cube is unsolvable.
 */
export function solveOptimal2(entered: Cube): Move[] {
  const g = frame2(entered)
  const target = SOLVED_2.find(({ frame: f }) => f.D === g.D && f.L === g.L && f.B === g.B)?.cube
  if (!target) throw new Error('solveOptimal2: DBL piece is not a real corner')
  // The two searches meet on state keys: list the pieces as the target does
  // (an entered cube lists them slot by slot).
  let cube: Cube
  try {
    cube = listedAs(entered, target)
  } catch {
    throw new Error('solveOptimal2: not the pieces of a 2x2')
  }
  if (stateKey(cube) === stateKey(target)) return []

  const fwd = bfsSide(cube)
  const bwd = bfsSide(target)
  let best: Move[] | null = null
  let fwdDepth = 0
  let bwdDepth = 0

  while (fwdDepth + bwdDepth < Math.min(best?.length ?? Infinity, MAX_DEPTH_2)) {
    const expand = fwd.frontier.length <= bwd.frontier.length ? fwd : bwd
    const other = expand === fwd ? bwd : fwd
    if (expand === fwd) fwdDepth++
    else bwdDepth++
    const next: BfsSide['frontier'] = []
    for (const node of expand.frontier) {
      const lastFace = node.moves[node.moves.length - 1]?.face
      for (const face of MOVES_URF) {
        if (face === lastFace) continue
        let state = node.cube
        for (let amount = 1; amount <= 3; amount++) {
          state = applyMove(state, { face, amount: 1 })
          // Key first: most children are already-visited duplicates, so the
          // move-list copy below is only built for meets and fresh states.
          const key = stateKey(state)
          const met = other.visited.get(key)
          const fresh = !expand.visited.has(key)
          if (!met && !fresh) continue
          const moves = [...node.moves, { face, amount: amount as 1 | 2 | 3 }]
          if (met && (!best || moves.length + met.length < best.length)) {
            const [f, b] = expand === fwd ? [moves, met] : [met, moves]
            best = [...f, ...invertMoves(b)]
          }
          if (fresh) {
            expand.visited.set(key, moves)
            next.push({ cube: state, moves })
          }
        }
      }
    }
    expand.frontier = next
  }
  if (!best) throw new Error('solveOptimal2: no solution (unsolvable cube)')
  return best
}

/** 2x2 optimal solution, as a single step. */
export const OPTIMAL_2_PLAN: MethodPlan = [
  { key: 'stepOptimal', goal: isSolved, moves: OUTER_TURNS, phases: [solveOptimal2] },
]
