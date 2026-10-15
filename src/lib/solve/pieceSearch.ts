import { cubeShape, solvedCube, stateKey, turnDims } from '../core/cube'
import { colorsOf } from '../core/pieces'
import { applyMoves } from '../core/turn'
import { invertMoves, sameLayer } from '../core/moves'
import type { MoveSet } from '../core/moveSet'
import type { Cube, Cubie, Dims, Move, Turn, Vec3 } from '../core/types'

/**
 * Search over a handful of tracked pieces, the brick of blockbuilding and
 * formula-driven steps (Roux, Petrus, ZZ, the tower, the Domino). A step like "build the second block with <R, U, r, M>"
 * only cares about five pieces, so the search turns those five and nothing
 * else: states differing elsewhere collapse, which keeps the space tiny and
 * lets the step use its method's real move set instead of algorithms.
 *
 * Two modes:
 * - default goal (every tracked piece at home): the goal is a single state,
 *   so the search runs from both ends and meets in the middle. That halves
 *   the depth each side explores, which is what makes 10+ move blocks with a
 *   restricted move set cheap;
 * - custom goal (say "every edge oriented"): plain breadth-first search, with
 *   an optional `key` projecting the state on what the goal reads.
 *
 * Pieces are named by their home position and found by their colors. With
 * the default goal they must be unique (true on a 3x3, whose centers are
 * fixed): identical pieces (the tower's twin middles) are told apart
 * arbitrarily, so they need a custom goal and key reading colors (`atHome`).
 * Solutions are shortest for a custom goal and at most one move longer than
 * shortest for the default one (first meet wins).
 */
export interface PieceSearch<T extends Turn = Move> {
  /** Home positions of the pieces to track. */
  readonly track: readonly Vec3[]
  /** Turns the search may use. */
  readonly moves: MoveSet
  /** Sequences usable as a single generator (setup-move conjugates...). They
   *  must only produce turns `moves` allows. */
  readonly macros?: readonly (readonly T[])[]
  /** Goal on the tracked pieces; absent means every tracked piece at home. */
  readonly goal?: (pieces: readonly Cubie[]) => boolean
  /** Dedup key; it must determine the goal and how the key evolves, e.g. the
   *  orientation pattern alone when the goal only asks for orientation. */
  readonly key?: (pieces: readonly Cubie[]) => string
  /** The kind of piece tracked, when pieces of another kind wear the same
   *  colors (a Master Pyraminx's wings and midges). */
  readonly among?: (cubie: Cubie) => boolean
  /** The state to bring the tracked pieces to, when not the solved one
   *  (a bandaged puzzle's START); `track` then names their places there. */
  readonly target?: Cube
  /** Whether a turn goes, read on the tracked pieces (a bandaged puzzle's
   *  blocks, all tracked, jam some): absent, every turn does. */
  readonly legal?: (pieces: Cube, turn: Turn) => boolean
  readonly maxDepth: number
}

interface Node {
  readonly pieces: Cube
  readonly moves: readonly Turn[]
}

/** Stickers in color order, so the same piece always encodes the same way
 *  whatever order a scramble or the editor left its stickers in. */
function normalized(cubie: Cubie): Cubie {
  const stickers = [...cubie.stickers].sort((a, b) => (a.color < b.color ? -1 : 1))
  return { position: cubie.position, stickers }
}

const SOLVED = new Map<string, Cube>()

/** The tracked pieces of `cube`, in `track` order, plus their solved state. */
function trackedPieces(
  cube: Cube,
  track: readonly Vec3[],
  among: (cubie: Cubie) => boolean = () => true,
  target?: Cube,
): { start: Cube; home: Cube } {
  const shape = cubeShape(cube)
  let solved = target ?? SOLVED.get(shape)
  if (!solved) {
    solved = solvedCube(shape)
    SOLVED.set(shape, solved)
  }
  const home = track.map((p) => {
    const piece = solved.find((c) => c.position.every((v, i) => v === p[i]))
    if (!piece) throw new Error(`pieceSearch: no piece at ${p.join(',')}`)
    return normalized(piece)
  })
  // Twins (identical pieces) each take a distinct cubie of their colors.
  const unused = cube.filter(among)
  const start = home.map((h) => {
    const i = unused.findIndex((c) => colorsOf(c) === colorsOf(h))
    if (i < 0) throw new Error(`pieceSearch: piece ${colorsOf(h)} missing`)
    return normalized(unused.splice(i, 1)[0]!)
  })
  return { start, home }
}

/** Every generator as a sequence: single turns, then the macros. */
function generatorsOf(spec: PieceSearch<Turn>): ReadonlyArray<readonly Turn[]> {
  return [...spec.moves.turns.map((t) => [t]), ...(spec.macros ?? [])]
}

/** A single turn of the layer just turned would merge with it: skipped. */
function sameLayerTwice(last: Turn | undefined, gen: readonly Turn[]): boolean {
  return gen.length === 1 && last !== undefined && sameLayer(last, gen[0]!)
}

/** The pieces after `gen`, or null when one of its turns is jammed. */
function played(
  pieces: Cube,
  gen: readonly Turn[],
  dims: Dims,
  legal?: (pieces: Cube, turn: Turn) => boolean,
): Cube | null {
  if (!legal) return applyMoves(pieces, gen, dims)
  let state = pieces
  for (const turn of gen) {
    if (!legal(state, turn)) return null
    state = applyMoves(state, [turn], dims)
  }
  return state
}

/** Children of `node`; `visit` returns a solution to stop the search. */
function expand(
  node: Node,
  generators: ReadonlyArray<readonly Turn[]>,
  dims: Dims,
  visit: (child: Node) => Turn[] | null,
  legal?: (pieces: Cube, turn: Turn) => boolean,
): Turn[] | null {
  const last = node.moves[node.moves.length - 1]
  for (const gen of generators) {
    if (sameLayerTwice(last, gen)) continue
    const pieces = played(node.pieces, gen, dims, legal)
    if (!pieces) continue
    const child = { pieces, moves: [...node.moves, ...gen] }
    const solution = visit(child)
    if (solution) return solution
  }
  return null
}

/** Moves solving the tracked pieces as `spec` asks (face moves on the cubes,
 *  the star prism's turns on it). Throws past `maxDepth`. */
export function solvePieces<T extends Turn = Move>(cube: Cube, spec: PieceSearch<T>): T[] {
  const dims = turnDims(cubeShape(cube))
  const { start, home } = trackedPieces(cube, spec.track, spec.among, spec.target)
  // The generators are the set's turns and `T` macros: the result holds T.
  const generic = spec as PieceSearch<Turn>
  return (
    spec.goal
      ? forward(start, spec.goal, generic, dims)
      : meetInTheMiddle(start, home, generic, dims)
  ) as T[]
}

function forward(
  start: Cube,
  goal: (pieces: readonly Cubie[]) => boolean,
  spec: PieceSearch<Turn>,
  dims: Dims,
): Turn[] {
  if (goal(start)) return []
  const keyOf = spec.key ?? stateKey
  const generators = generatorsOf(spec)
  const seen = new Set([keyOf(start)])
  let frontier: Node[] = [{ pieces: start, moves: [] }]
  for (let depth = 0; depth < spec.maxDepth && frontier.length; depth++) {
    const next: Node[] = []
    for (const node of frontier) {
      const solution = expand(
        node,
        generators,
        dims,
        (child) => {
          const key = keyOf(child.pieces)
          if (seen.has(key)) return null
          if (goal(child.pieces)) return [...child.moves]
          seen.add(key)
          next.push(child)
          return null
        },
        spec.legal,
      )
      if (solution) return solution
    }
    frontier = next
  }
  throw new Error('solvePieces: no solution within the search depth')
}

interface Side {
  frontier: Node[]
  /** Moves reaching each visited state from this side's origin. */
  readonly seen: Map<string, readonly Turn[]>
  readonly generators: ReadonlyArray<readonly Turn[]>
}

function meetInTheMiddle(start: Cube, home: Cube, spec: PieceSearch<Turn>, dims: Dims): Turn[] {
  const startKey = stateKey(start)
  const homeKey = stateKey(home)
  if (startKey === homeKey) return []
  const generators = generatorsOf(spec)
  const fwd: Side = {
    frontier: [{ pieces: start, moves: [] }],
    seen: new Map([[startKey, []]]),
    generators,
  }
  // The backward search undoes moves, so it walks the inverse generators.
  const bwd: Side = {
    frontier: [{ pieces: home, moves: [] }],
    seen: new Map([[homeKey, []]]),
    generators: generators.map((g) => invertMoves(g)),
  }
  for (let depth = 0; depth < spec.maxDepth; depth++) {
    const side = fwd.frontier.length <= bwd.frontier.length ? fwd : bwd
    const other = side === fwd ? bwd : fwd
    const next: Node[] = []
    for (const node of side.frontier) {
      // A turn goes one way when it goes back: `legal` holds both ways.
      const solution = expand(
        node,
        side.generators,
        dims,
        (child) => {
          const key = stateKey(child.pieces)
          if (side.seen.has(key)) return null
          const met = other.seen.get(key)
          if (met) {
            const [f, b] = side === fwd ? [child.moves, met] : [met, child.moves]
            return [...f, ...invertMoves(b)]
          }
          side.seen.set(key, child.moves)
          next.push(child)
          return null
        },
        spec.legal,
      )
      if (solution) return solution
    }
    side.frontier = next
  }
  throw new Error('solvePieces: no solution within the search depth')
}
