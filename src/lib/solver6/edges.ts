import { FACE_COLOR, solvedCube } from '../cube'
import { FACE_NORMAL, faceOfNormal } from '../geometry'
import { parseMoves } from '../moves'
import { applyMove, applyMoves } from '../turn'
import type { Color, Cube, Cubie, Dims, Face, Move, Vec3 } from '../types'
import { buildLibrary, DEEP, OUTER, SLICES, type Library } from '../cycleLibrary'
import { cornerTwistSum, edgeFlipParity, permSignsMatch } from '../solver4/parity'
import { oddArrangement, pairWings } from '../wingPairing'
import { isInnerWing, isOuterWing } from './kinds'

/**
 * 6x6 edges: each edge slot gets one edge, its four wings brought in by
 * pure 3-cycles of wings (wingPairing.ts), the outer ones (beside the
 * corners) and the inner ones (by the middle) each in their own orbit.
 *
 * No middle piece says which edge goes where, so the pairing picks it: for
 * each slot the edge, and its way round, that most of its wings already
 * show; then, so the 3x3 step meets a real 3x3, an edge swapped for another
 * if the edges' order and the corners' disagree, and one edge turned over
 * if an odd number are flipped. No OLL or PLL parity is left for later.
 *
 * Even 3-cycles cannot swap two wings alone: when bringing an orbit's wings
 * home is an odd permutation, the UF edge's two wings of that orbit are
 * aimed crossed, then swapped by the 4x4's OLL parity algorithm played on
 * that orbit's slices (2R for the outer wings, 3R for the inner ones),
 * which with the centers solved changes nothing else.
 */

const SIX: Dims = [6, 6, 6]
const SOLVED = solvedCube('6')
const key = (p: readonly number[]) => p.join(',')
const isWing = (c: Cubie) => isOuterWing(c) || isInnerWing(c)

/** An edge slot: its faces, and its wing slots (outer pair, inner pair). */
interface EdgeSlot {
  readonly faces: readonly [Face, Face]
  readonly outer: readonly [string, string]
  readonly inner: readonly [string, string]
  /** Its 3x3 position. */
  readonly at: Vec3
}

const EDGES: readonly EdgeSlot[] = SOLVED.filter(
  (c) => isOuterWing(c) && c.position.some((v) => v === 3),
).map((w) => {
  const free = w.position.findIndex((v) => Math.abs(v) === 3)
  const along = (v: number) => key(w.position.map((x, a) => (a === free ? v : x)))
  return {
    faces: w.stickers.map((s) => faceOfNormal(s.normal)) as [Face, Face],
    outer: [along(3), along(-3)],
    inner: [along(1), along(-1)],
    at: w.position.map((x, a) => (a === free ? 0 : Math.sign(x))) as unknown as Vec3,
  }
})

/** Each edge's colors, in its slot's face order. */
const EDGE_COLORS: readonly [Color, Color][] = EDGES.map(
  (e) => e.faces.map((f) => FACE_COLOR[f]) as [Color, Color],
)

/** How each wing shows its colors in each slot: wing index -> slot -> face
 *  -> color (found by turning each wing alone). */
const WING_POSES: ReadonlyMap<number, ReadonlyMap<string, ReadonlyMap<Face, Color>>> = (() => {
  const poses = new Map<number, Map<string, Map<Face, Color>>>()
  const moves = [...OUTER, ...SLICES, ...DEEP]
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
      for (const move of moves) queue.push(applyMove([wing], move, SIX)[0]!)
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

/** Where each wing stands now. */
const wingSlots = (cube: Cube) =>
  new Map(cube.filter(isWing).map((c) => [wingOf(c), key(c.position)]))

/** The wing showing these colors on the slot's faces at `slot`. */
function wingFor(slot: string, faces: readonly Face[], colors: readonly Color[]): number {
  for (const [wing, slots] of WING_POSES) {
    const pose = slots.get(slot)
    if (pose && faces.every((f, i) => pose.get(f) === colors[i])) return wing
  }
  throw new Error('edges: no wing fits')
}

/** An edge in a slot: which edge, and whether turned over. */
interface Placed {
  readonly edge: number
  readonly flipped: boolean
}

/** The colors an edge shows on a slot's faces. */
const colorsOf = ({ edge, flipped }: Placed): [Color, Color] => {
  const [a, b] = EDGE_COLORS[edge]!
  return flipped ? [b, a] : [a, b]
}

/** The wing each of a slot's wing slots wants, holding this edge. */
const slotWanted = (s: number, placed: Placed): [string, number][] => {
  const slot = EDGES[s]!
  const colors = colorsOf(placed)
  return [...slot.outer, ...slot.inner].map((p) => [p, wingFor(p, slot.faces, colors)])
}

/** The 3x3 the plan would make: its corners as they are, each slot holding
 *  its edge. */
function as3x3(cube: Cube, plan: readonly Placed[]): Cube {
  const corners = cube
    .filter((c) => c.stickers.length === 3)
    .map((c) => ({ ...c, position: c.position.map((v) => v / 5) as unknown as Vec3 }))
  const edges = EDGES.map((slot, s) => {
    const colors = colorsOf(plan[s]!)
    return {
      position: slot.at,
      stickers: slot.faces.map((f, i) => ({ normal: FACE_NORMAL[f], color: colors[i]! })),
    }
  })
  return [...corners, ...edges]
}

/** Which edge goes in which slot: for each slot, the edge (and its way
 *  round) most of its wings show, then set right so the 3x3 is a real one. */
function planEdges(cube: Cube): Placed[] {
  const at = wingSlots(cube)
  const options = EDGES.flatMap((_, s) =>
    EDGES.flatMap((__, edge) =>
      [false, true].map((flipped) => ({
        s,
        placed: { edge, flipped },
        score: slotWanted(s, { edge, flipped }).filter(([p, wing]) => at.get(wing) === p).length,
      })),
    ),
  ).sort((x, y) => y.score - x.score)
  const plan: (Placed | undefined)[] = EDGES.map(() => undefined)
  const used = new Set<number>()
  for (const { s, placed } of options) {
    if (plan[s] || used.has(placed.edge)) continue
    plan[s] = placed
    used.add(placed.edge)
  }
  const placed = plan as Placed[]
  const last = placed.length - 1
  // The edges' order must agree with the corners' (a 3x3 turn moves both).
  if (!permSignsMatch(as3x3(cube, placed))) {
    ;[placed[last - 1], placed[last]] = [placed[last]!, placed[last - 1]!]
  }
  // An even number of edges turned over, as on a 3x3.
  if (edgeFlipParity(as3x3(cube, placed)) === 1) {
    placed[last] = { ...placed[last]!, flipped: !placed[last]!.flipped }
  }
  if (cornerTwistSum(as3x3(cube, placed)) !== 0) {
    throw new Error('edges: twisted corner (unsolvable cube)')
  }
  return placed
}

/** What each wing slot shows, as "face:color face:color". */
const shows = (cube: Cube) =>
  new Map(
    cube.filter(isWing).map((c) => [
      key(c.position),
      c.stickers
        .map((s) => `${faceOfNormal(s.normal)}:${s.color}`)
        .sort()
        .join(' '),
    ]),
  )

/** A slot's wing pairs: each pair alike, and both pairs alike. */
function pairsOf(look: Map<string, string>, slot: EdgeSlot) {
  const [o1, o2] = slot.outer.map((p) => look.get(p))
  const [i1, i2] = slot.inner.map((p) => look.get(p))
  return { outer: o1 === o2, inner: i1 === i2, whole: o1 === o2 && i1 === i2 && o1 === i1 }
}

export function edgesPaired(cube: Cube): boolean {
  const look = shows(cube)
  return EDGES.every((slot) => pairsOf(look, slot).whole)
}

const UF = EDGES.findIndex((e) => key(e.at) === '0,1,1')

/** Paired, but maybe for the UF edge, its pairs each alike (a crossed pair
 *  of wings, the parity, shows its colors the other way). */
export function pairedOrParity(cube: Cube): boolean {
  const look = shows(cube)
  return EDGES.every((slot, s) => {
    const pairs = pairsOf(look, slot)
    return s === UF ? pairs.outer && pairs.inner : pairs.whole
  })
}

const STICKERED = SOLVED.filter((c) => c.stickers.length > 0)
let libraries: { outer: Library; inner: Library } | null = null

/** Pure wing 3-cycles of each orbit: everything with a sticker stays, but
 *  three wings. */
function wingLibraries() {
  libraries ??= {
    outer: buildLibrary(SLICES, OUTER, OUTER, STICKERED, isOuterWing, SIX),
    inner: buildLibrary(DEEP, OUTER, OUTER, STICKERED, isInnerWing, SIX),
  }
  return libraries
}

/** Pair every edge as planned; an orbit an odd permutation away gets its
 *  UF pair aimed crossed, for the parity step. */
export function pairEdges(cube: Cube): Move[] {
  const plan = planEdges(cube)
  const at = wingSlots(cube)
  const all: Move[] = []
  let state = cube
  for (const orbit of ['outer', 'inner'] as const) {
    const wanted = new Map(
      plan.flatMap((placed, s) =>
        slotWanted(s, placed).filter(([p]) => EDGES[s]![orbit].includes(p)),
      ),
    )
    if (oddArrangement(wanted, at)) {
      const [a, b] = EDGES[UF]![orbit]
      const wa = wanted.get(a)!
      wanted.set(a, wanted.get(b)!)
      wanted.set(b, wa)
    }
    const moves = pairWings(state, wingLibraries()[orbit], wanted, wingSlots)
    state = applyMoves(state, moves)
    all.push(...moves)
  }
  if (!pairedOrParity(state)) throw new Error('pairEdges: edges left unpaired')
  return all
}

/** Swap the UF edge's two outer wings (2R) or inner ones (3R); with the
 *  centers solved, nothing else. */
const PARITY = (depth: 2 | 3) =>
  parseMoves(
    `${depth}R2 B2 U2 ${depth}L U2 ${depth}R' U2 ${depth}R U2 F2 ${depth}R F2 ${depth}L' B2 ${depth}R2`,
  )
export const OUTER_PARITY = PARITY(2)
export const INNER_PARITY = PARITY(3)

/** The UF edge's crossed pairs swapped back: the outer one if the 3x3 it
 *  shows has an edge turned over alone, then the inner one if it still
 *  disagrees. */
export function fixEdgeParity(cube: Cube): Move[] {
  const moves: Move[] = []
  let state = cube
  const read = readEdges(state)
  if (edgeFlipParity(read) === 1) {
    moves.push(...OUTER_PARITY)
    state = applyMoves(state, OUTER_PARITY)
  }
  if (!edgesPaired(state)) {
    moves.push(...INNER_PARITY)
    state = applyMoves(state, INNER_PARITY)
  }
  if (!edgesPaired(state)) throw new Error('fixEdgeParity: parity fix failed')
  return moves
}

/** The 3x3's edges as each slot's first outer wing shows them. */
function readEdges(cube: Cube): Cube {
  const byPos = new Map(cube.map((c) => [key(c.position), c]))
  return EDGES.map((slot) => ({ position: slot.at, stickers: byPos.get(slot.outer[0])!.stickers }))
}
