import { applyMoves, cubeShape, solvedCube, stateKey, turnDims } from './cube'
import { invertMoves } from './moves'
import type { MoveSet } from './moveSet'
import type { Color, Cube, Cubie, Dims, Move, Vec3 } from './types'

/**
 * Search over a handful of tracked pieces, the brick of blockbuilding methods
 * (Roux, Petrus, ZZ). A step like "build the second block with <R, U, r, M>"
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
 * Pieces are named by their home position and must be unique (true on a 3x3,
 * whose centers are fixed). Solutions are shortest for a custom goal and at
 * most one move longer than shortest for the default one (first meet wins).
 */
export interface PieceSearch {
  /** Home positions of the pieces to track. */
  readonly track: readonly Vec3[]
  /** Turns the search may use. */
  readonly moves: MoveSet
  /** Sequences usable as a single generator (setup-move conjugates...). They
   *  must only produce turns `moves` allows. */
  readonly macros?: readonly (readonly Move[])[]
  /** Goal on the tracked pieces; absent means every tracked piece at home. */
  readonly goal?: (pieces: readonly Cubie[]) => boolean
  /** Dedup key; it must determine the goal and how the key evolves, e.g. the
   *  orientation pattern alone when the goal only asks for orientation. */
  readonly key?: (pieces: readonly Cubie[]) => string
  readonly maxDepth: number
}

interface Node {
  readonly pieces: Cube
  readonly moves: readonly Move[]
}

/** Stickers in color order, so the same piece always encodes the same way
 *  whatever order a scramble or the editor left its stickers in. */
function normalized(cubie: Cubie): Cubie {
  const stickers = [...cubie.stickers].sort((a, b) => (a.color < b.color ? -1 : 1))
  return { position: cubie.position, stickers }
}

function colorKey(cubie: Cubie): string {
  return cubie.stickers
    .map((s): Color => s.color)
    .sort()
    .join('')
}

const SOLVED = new Map<string, Cube>()

/** The tracked pieces of `cube`, in `track` order, plus their solved state. */
function trackedPieces(cube: Cube, track: readonly Vec3[]): { start: Cube; home: Cube } {
  const shape = cubeShape(cube)
  let solved = SOLVED.get(shape)
  if (!solved) {
    solved = solvedCube(shape)
    SOLVED.set(shape, solved)
  }
  const byColors = new Map(cube.map((c) => [colorKey(c), c]))
  const home = track.map((p) => {
    const piece = solved.find((c) => c.position.every((v, i) => v === p[i]))
    if (!piece) throw new Error(`pieceSearch: no piece at ${p.join(',')}`)
    return normalized(piece)
  })
  const start = home.map((h) => {
    const piece = byColors.get(colorKey(h))
    if (!piece) throw new Error(`pieceSearch: piece ${colorKey(h)} missing`)
    return normalized(piece)
  })
  return { start, home }
}

/** Generators as sequences; single turns remember their layer so a search
 *  never turns the same layer twice in a row (that would just merge). */
function generatorsOf(spec: PieceSearch): ReadonlyArray<readonly Move[]> {
  return [...spec.moves.turns.map((t) => [t]), ...(spec.macros ?? [])]
}

function sameLayerTwice(last: Move | undefined, gen: readonly Move[]): boolean {
  const first = gen[0]
  return (
    gen.length === 1 &&
    last !== undefined &&
    first !== undefined &&
    last.face === first.face &&
    last.depth === first.depth &&
    last.wide === first.wide
  )
}

/** Children of `node`; `visit` returns a solution to stop the search. */
function expand(
  node: Node,
  generators: ReadonlyArray<readonly Move[]>,
  dims: Dims,
  visit: (child: Node) => Move[] | null,
): Move[] | null {
  const last = node.moves[node.moves.length - 1]
  for (const gen of generators) {
    if (sameLayerTwice(last, gen)) continue
    const child = { pieces: applyMoves(node.pieces, gen, dims), moves: [...node.moves, ...gen] }
    const solution = visit(child)
    if (solution) return solution
  }
  return null
}

/** Moves solving the tracked pieces as `spec` asks. Throws past `maxDepth`. */
export function solvePieces(cube: Cube, spec: PieceSearch): Move[] {
  const dims = turnDims(cubeShape(cube))
  const { start, home } = trackedPieces(cube, spec.track)
  return spec.goal
    ? forward(start, spec.goal, spec, dims)
    : meetInTheMiddle(start, home, spec, dims)
}

function forward(
  start: Cube,
  goal: (pieces: readonly Cubie[]) => boolean,
  spec: PieceSearch,
  dims: Dims,
): Move[] {
  if (goal(start)) return []
  const keyOf = spec.key ?? stateKey
  const generators = generatorsOf(spec)
  const seen = new Set([keyOf(start)])
  let frontier: Node[] = [{ pieces: start, moves: [] }]
  for (let depth = 0; depth < spec.maxDepth && frontier.length; depth++) {
    const next: Node[] = []
    for (const node of frontier) {
      const solution = expand(node, generators, dims, (child) => {
        const key = keyOf(child.pieces)
        if (seen.has(key)) return null
        if (goal(child.pieces)) return [...child.moves]
        seen.add(key)
        next.push(child)
        return null
      })
      if (solution) return solution
    }
    frontier = next
  }
  throw new Error('solvePieces: no solution within the search depth')
}

interface Side {
  frontier: Node[]
  /** Moves reaching each visited state from this side's origin. */
  readonly seen: Map<string, readonly Move[]>
  readonly generators: ReadonlyArray<readonly Move[]>
}

function meetInTheMiddle(start: Cube, home: Cube, spec: PieceSearch, dims: Dims): Move[] {
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
      const solution = expand(node, side.generators, dims, (child) => {
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
      })
      if (solution) return solution
    }
    side.frontier = next
  }
  throw new Error('solvePieces: no solution within the search depth')
}
