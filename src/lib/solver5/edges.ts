import { solvedCube } from '../cube'
import { faceOfNormal } from '../geometry'
import { parseMoves } from '../moves'
import { applyMove, applyMoves } from '../turn'
import type { Color, Cube, Cubie, Face, Move, Vec3 } from '../types'
import { centersDone } from './centers'
import { borrow, buildLibrary, findCycle, OUTER, SLICES, type Library } from '../cycleLibrary'
import { isMidge, isWing } from './kinds'

/**
 * 5x5 edges: pair each edge's two wings with its middle piece, which stays
 * where it is (the 3x3 step will move whole edges). A wing has one way to
 * sit in each slot (its handedness), so each slot wants one wing in
 * particular: the one showing the middle piece's colors there. Wings are
 * brought in by pure 3-cycles of wings (cycles.ts: a slice commutator, all
 * else untouched, the centers included), slot after slot, each with its
 * third slot among the wings still to place.
 *
 * Even 3-cycles cannot swap two wings alone: when the last edge holds its
 * two wings crossed, that is the 5x5's edge parity, left to the parity step
 * (the 4x4 OLL parity algorithm, which swaps the UF edge's wings and,
 * centers solved, nothing else).
 */

const MECHANISM = [5, 5, 5] as const
const SOLVED = solvedCube('5')
const key = (p: Vec3) => p.join(',')

/** Each edge: its middle piece's slot and its two wing slots. */
interface EdgeSlot {
  readonly midge: string
  readonly wings: readonly [Vec3, Vec3]
  readonly faces: readonly Face[]
}

const EDGES: readonly EdgeSlot[] = SOLVED.filter(isMidge).map((m) => {
  const free = m.position.findIndex((v) => v === 0)
  const at = (v: number): Vec3 => m.position.map((x, a) => (a === free ? v : x)) as unknown as Vec3
  return {
    midge: key(m.position),
    wings: [at(1), at(-1)],
    faces: m.stickers.map((s) => faceOfNormal(s.normal)),
  }
})

/** How each wing shows its colors in each slot: wing index -> slot -> face
 *  -> color (found by turning each wing alone). */
const WING_POSES: ReadonlyMap<number, ReadonlyMap<string, ReadonlyMap<Face, Color>>> = (() => {
  const poses = new Map<number, Map<string, Map<Face, Color>>>()
  SOLVED.forEach((home, i) => {
    if (!isWing(home)) return
    const seen = new Map<string, Map<Face, Color>>()
    const queue: Cubie[] = [home]
    for (let k = 0; k < queue.length; k++) {
      const wing = queue[k]!
      if (seen.has(key(wing.position))) continue
      seen.set(
        key(wing.position),
        new Map(wing.stickers.map((s) => [faceOfNormal(s.normal), s.color])),
      )
      for (const move of [...OUTER, ...SLICES]) queue.push(applyMove([wing], move, MECHANISM)[0]!)
    }
    poses.set(i, seen)
  })
  return poses
})()

/** Which wing a cubie is (by how it shows its colors where it stands). */
function wingOf(cubie: Cubie): number {
  const faces = new Map(cubie.stickers.map((s) => [faceOfNormal(s.normal), s.color]))
  for (const [wing, slots] of WING_POSES) {
    const pose = slots.get(key(cubie.position))
    if (pose && [...faces].every(([f, c]) => pose.get(f) === c)) return wing
  }
  throw new Error('edges: unknown wing')
}

/** The wing each wing slot wants: the one showing its edge's middle colors. */
function targets(cube: Cube): Map<string, number> {
  const byPos = new Map(cube.map((c) => [key(c.position), c]))
  const wanted = new Map<string, number>()
  for (const edge of EDGES) {
    const midge = byPos.get(edge.midge)!
    const colors = new Map(midge.stickers.map((s) => [faceOfNormal(s.normal), s.color]))
    for (const p of edge.wings) {
      const wing = [...WING_POSES].find(([, slots]) =>
        edge.faces.every((f) => slots.get(key(p))?.get(f) === colors.get(f)),
      )
      if (!wing) throw new Error('edges: no wing fits')
      wanted.set(key(p), wing[0])
    }
  }
  return wanted
}

/** Where each wing stands now. */
function wingSlots(cube: Cube): Map<number, string> {
  return new Map(cube.filter(isWing).map((c) => [wingOf(c), key(c.position)]))
}

/** Wing slots not holding the wing they want (`wanted`: the targets). */
function misplaced(cube: Cube, wanted = targets(cube)): string[] {
  const at = wingSlots(cube)
  return [...wanted].filter(([slot, wing]) => at.get(wing) !== slot).map(([slot]) => slot)
}

export function edgesPaired(cube: Cube): boolean {
  return misplaced(cube).length === 0
}

/** Paired, or all but one edge whose two wings sit crossed (the parity). */
export function pairedOrParity(cube: Cube): boolean {
  const wrong = misplaced(cube)
  return wrong.length === 0 || (wrong.length === 2 && crossedEdge(cube) !== undefined)
}

/** The edge whose two wings sit in each other's slot, if any. */
function crossedEdge(cube: Cube): EdgeSlot | undefined {
  const wanted = targets(cube)
  const at = wingSlots(cube)
  return EDGES.find((edge) => {
    const [a, b] = edge.wings.map(key)
    return at.get(wanted.get(a!)!) === b && at.get(wanted.get(b!)!) === a
  })
}

let library: Library | null = null

/** Pure wing 3-cycles: everything with a sticker stays, but three wings. */
function wingLibrary(): Library {
  library ??= buildLibrary(
    SLICES,
    OUTER,
    OUTER,
    SOLVED.filter((c) => c.stickers.length > 0),
    isWing,
  )
  return library
}

/** Whether bringing every wing where it is wanted is an odd permutation
 *  of the wing slots, which 3-cycles never make: the edge parity. */
function oddWings(cube: Cube): boolean {
  const wanted = targets(cube)
  const at = wingSlots(cube)
  const seen = new Set<string>()
  let swaps = 0
  for (const start of wanted.keys()) {
    let length = 0
    for (let slot = start; !seen.has(slot); slot = at.get(wanted.get(slot)!)!) {
      seen.add(slot)
      length++
    }
    if (length > 0) swaps += length - 1
  }
  return swaps % 2 === 1
}

/** The UF edge's two wing slots. */
const UF: readonly [string, string] = ['1,2,2', '-1,2,2']

/**
 * Pair every edge, but for a last one left crossed (parity). Each round
 * brings the wing a wrong slot wants, by a 3-cycle whose third slot is
 * wrong too (it can only get better), through another wrong slot when no
 * 3-cycle goes straight there (a wing to the other end of its own edge), or
 * at worst disturbing a right one, to be fixed in a later round. With the
 * parity, the UF edge's wings are aimed crossed: the parity step then
 * swaps them where they stand.
 */
export function pairEdges(cube: Cube): Move[] {
  let state = cube
  // The wings stay where they want to be (only wings move here), so the
  // targets hold throughout.
  const wanted = targets(cube)
  if (oddWings(cube)) {
    const [a, b] = UF.map((slot) => wanted.get(slot)!)
    wanted.set(UF[0], b!)
    wanted.set(UF[1], a!)
  }
  const all: Move[] = []
  const play = (moves: Move[]) => {
    state = applyMoves(state, moves)
    all.push(...moves)
  }
  const cycleTo = (from: string, to: string, free: (slot: string) => boolean) =>
    findCycle(wingLibrary(), from, to, (third) => third !== to && free(third))?.moves
  for (let guard = 0; ; guard++) {
    if (guard > 60) throw new Error('pairEdges: no progress')
    const wrong = misplaced(state, wanted)
    if (wrong.length === 0) break
    const isWrong = (slot: string) => wrong.includes(slot)
    const slot = wrong[0]!
    const from = wingSlots(state).get(wanted.get(slot)!)!
    const straight = cycleTo(from, slot, isWrong)
    if (straight) {
      play(straight)
      continue
    }
    const via = wrong.find((m) => m !== slot && m !== from && cycleTo(from, m, isWrong))
    if (via) {
      play(cycleTo(from, via, isWrong)!)
      continue
    }
    // The last wrong ones hold an edge's two wings, which no 3-cycle takes
    // together: a few 3-cycles, borrowing a right slot.
    const holds = new Map([...wingSlots(state)].map(([wing, at]) => [at, wing]))
    const pair = borrow(wingLibrary(), holds, wanted, wrong)
    if (!pair)
      throw new Error(`pairEdges: no 3-cycle from ${from} to ${slot} (wrong: ${wrong.join(' ')})`)
    play(pair)
  }
  if (!pairedOrParity(state)) throw new Error('pairEdges: edges left unpaired')
  return all
}

/** Swaps the UF edge's two wings; with the centers solved, nothing else. */
export const EDGE_PARITY = parseMoves("2R2 B2 U2 2L U2 2R' U2 2R U2 F2 2R F2 2L' B2 2R2")

/** The crossed edge brought to UF by outer turns, then the parity fixed. */
export function fixEdgeParity(cube: Cube): Move[] {
  const crossed = crossedEdge(cube)
  if (!crossed || edgesPaired(cube)) return []
  // Outer turns move whole edges: follow the crossed edge's middle piece.
  const midge = cube.find((c) => key(c.position) === crossed.midge)!
  const moves = [...toUF(midge), ...EDGE_PARITY]
  const after = applyMoves(cube, moves)
  if (!edgesPaired(after) || !centersDone(after))
    throw new Error('fixEdgeParity: parity fix failed')
  return moves
}

/** The fewest outer turns bringing a middle piece to UF. */
function toUF(midge: Cubie): Move[] {
  let frontier: { piece: Cubie; moves: Move[] }[] = [{ piece: midge, moves: [] }]
  for (let depth = 0; depth <= 2; depth++) {
    const next: typeof frontier = []
    for (const node of frontier) {
      if (key(node.piece.position) === '0,2,2') return node.moves
      for (const move of OUTER) {
        next.push({
          piece: applyMove([node.piece], move, MECHANISM)[0]!,
          moves: [...node.moves, move],
        })
      }
    }
    frontier = next
  }
  throw new Error('fixEdgeParity: crossed edge out of reach')
}
