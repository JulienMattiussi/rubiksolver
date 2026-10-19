import { backToBox, loopsBack } from '../../puzzles/tower/camoShape'
import { isBoxed, solvedCube } from '../../core/cube'
import { AXIS_ROTATIONS, faceOfNormal } from '../../core/geometry'
import { formatMoves, parseMoves } from '../../core/notation'
import { allTurnsOf, moveSet } from '../../core/moveSet'
import { homesOf, withStickers } from '../../core/pieces'
import { solvePieces } from '../../solve/pieceSearch'
import { atEverySide, projectPlan, type MethodPlan } from '../../solve/solverKit'
import { applyMoves } from '../../core/turn'
import type { Cube, Cubie, Move, Turn, Vec3 } from '../../core/types'
import { DOMINO_PLAN } from './domino'
import { permutationIsOdd } from '../../solve/permutation'

/**
 * Camouflage 4x4x2, as taught on fan2cube.fr (camouflage4422):
 *
 *   A. Shape   back to a Domino's shape ("tout se fait au feeling" says
 *              the page: a search on the shape alone here, camoShape.ts),
 *              then the wings' parity if odd (WING_PARITY)
 *   B. Centers the four white ones on top, as on a 4x4x4
 *   C. Edges   each edge's two wings paired, with the page's exchange
 *              D*²H'D²HD*², from every side
 *   D. Domino  now a Domino 3x3x2: its method (domino.ts), its side turns
 *              the outer layers' half turns, its top and bottom the whole
 *              layers (H*, B*)
 *
 * Notation (page -> app): H B A P G D = U D F B L R; X* = Xw (the block,
 * half the puzzle); a² the inner layer's half turn, 2F2.
 */

/** C: (BPd) -> (HdA), D*²H'D²HD*² */
export const EXCHANGE = parseMoves("Rw2 Uw' R2 Uw Rw2")

const isWing = withStickers(2)
const isCenter = withStickers(1)

const SOLVED = solvedCube('camo')
const CENTERS = homesOf('camo', isCenter)
const WINGS = homesOf('camo', isWing)

/** Turns that keep the box: the top and bottom, and half turns of the
 *  sides' layers and blocks. */
const IN_BOX = moveSet('Uw Dw R2 L2 F2 B2 2R2 2L2 2F2 2B2 Rw2 Lw2 Fw2 Bw2')

/** Which solved wing each wing is: the one its whole-puzzle turn takes
 *  there, its colors on the same faces (each slot of an edge's pair takes
 *  one of its two wings only). */
const WING_HOMES = SOLVED.filter(isWing)
function wingHome(c: Cubie): number {
  return WING_HOMES.findIndex((h) =>
    AXIS_ROTATIONS.some(
      (turn) =>
        turn(h.position).join() === c.position.join() &&
        h.stickers.every((s) =>
          c.stickers.some((x) => x.color === s.color && x.normal.join() === turn(s.normal).join()),
        ),
    ),
  )
}

/** Whether the wings, in the box, are an even permutation from their solved
 *  places: every paired state is, and the pairing's formulas keep it. */
export function evenWings(cube: Cube): boolean {
  const slot = new Map(WING_HOMES.map((h, i) => [h.position.join(), i]))
  const to: number[] = []
  for (const c of cube) if (isWing(c)) to[wingHome(c)] = slot.get(c.position.join())!
  return !permutationIsOdd(to)
}

/**
 * Out of the box and back, the wings left an odd permutation (found by the
 * shape search, camoShape.ts): a layer's quarter turns can leave them so,
 * which the pairing's formulas, all even, cannot undo. No shorter way out
 * and back does it (none of six turns or fewer).
 */
export const WING_PARITY = parseMoves("L Uw Lw Uw2 Fw2 L' Dw2 Rw Dw L'")

/** A: back in the box, by a search on the shape alone (camoShape.ts), and
 *  the wings' parity set even. */
function backInShape(cube: Cube): Move[] {
  const moves = backToBox(cube, SOLVED)
  if (!moves) throw new Error('camo: no way back to the box found')
  return evenWings(applyMoves(cube, moves)) ? moves : [...moves, ...WING_PARITY]
}

/** B: the white centers on top (the yellow ones under them). */
const centersUp = (centers: readonly Cubie[]) =>
  centers.every((c) => (c.stickers[0]!.color === 'W') === c.position[1] > 0)

function raiseCenters(cube: Cube): Move[] {
  return solvePieces(cube, {
    track: CENTERS,
    moves: IN_BOX,
    goal: centersUp,
    key: (centers) =>
      centers
        .filter((c) => c.stickers[0]!.color === 'W')
        .map((c) => c.position.join())
        .sort()
        .join(' '),
    maxDepth: 8,
  }) as Move[]
}

/** The edge slots: each one's two wing slots. */
const EDGE_SLOTS: readonly [string, string][] = WINGS.filter(
  (p) => (Math.abs(p[0]) === 3 ? p[2] : p[0]) > 0,
).map((p) => {
  const other = [...p] as number[]
  other[Math.abs(p[0]) === 3 ? 2 : 0] = -other[Math.abs(p[0]) === 3 ? 2 : 0]!
  return [p.join(), other.join()]
})

/** What a wing shows where it stands: its colors on the faces. */
const shows = (c: Cubie) =>
  c.stickers
    .map((s) => `${faceOfNormal(s.normal)}${s.color}`)
    .sort()
    .join('')

/** How many edges have their two wings together. */
function pairedCount(wings: readonly Cubie[]): number {
  const look = new Map(wings.filter(isWing).map((c) => [c.position.join(), shows(c)]))
  return EDGE_SLOTS.filter(([a, b]) => look.get(a) === look.get(b)).length
}

const edgesPaired = (cube: readonly Cubie[]) => pairedCount(cube) === EDGE_SLOTS.length

/** The exchange from every side. */
const EXCHANGES = atEverySide(formatMoves(EXCHANGE))

/** A side's layer turned a quarter, the top or bottom turned, the layer
 *  turned back (2R Uw 2R'...): out of the box and back, every one that can
 *  be played, as on a 4x4x4 (the page's "comme dans le Revenge"). */
const CONJUGATES: Move[][] = (['F', 'R', 'B', 'L'] as const).flatMap((face) =>
  [undefined, 2 as const].flatMap((depth) =>
    ([1, 3] as const).flatMap((amount) =>
      parseMoves("Uw Uw' Uw2 Dw Dw' Dw2").flatMap((middle) => {
        const turn: Move = depth ? { face, amount, depth } : { face, amount }
        const moves = [turn, middle, { ...turn, amount: (4 - amount) as 1 | 3 }]
        return loopsBack(SOLVED, moves) ? [moves] : []
      }),
    ),
  ),
)

/** C: one more edge paired at a time, by a short search. */
function pairEdges(cube: Cube): Move[] {
  let state = cube
  const all: Move[] = []
  for (let guard = 0; !edgesPaired(state); guard++) {
    if (guard > EDGE_SLOTS.length) throw new Error('camo: edges left unpaired')
    const want = pairedCount(state) + 1
    const moves = solvePieces(state, {
      // The centers kept up: the inner layers' half turns move them.
      track: [...WINGS, ...CENTERS],
      moves: IN_BOX,
      macros: [...EXCHANGES, ...CONJUGATES],
      goal: (pieces) => pairedCount(pieces) >= want && centersUp(pieces.filter(isCenter)),
      maxDepth: 4,
    }) as Move[]
    state = applyMoves(state, moves)
    all.push(...moves)
  }
  return all
}

/** The Domino the reduced puzzle is: each Domino piece read on its
 *  counterpart (an edge on a wing, the center on one of four). */
const DOMINO = solvedCube('332')
const counterpart = (p: Vec3) => p.map((v, a) => (a === 1 ? v : v === 0 ? 1 : 3 * v)).join()
function asDomino(cube: Cube): Cube {
  const byPos = new Map(cube.map((c) => [c.position.join(), c]))
  return DOMINO.map((d) => ({
    position: d.position,
    stickers: byPos.get(counterpart(d.position))!.stickers,
  }))
}

/** A Domino turn on the Camouflage: the top and bottom whole, a side's
 *  outer layer. */
const asCamo = (turn: Turn): Turn => {
  const m = turn as Move
  return m.face === 'U' || m.face === 'D' ? { ...m, depth: 2, wide: true } : m
}

/** D: the Domino's plan, read on the Domino the puzzle is. */
const DOMINO_PHASE: MethodPlan = projectPlan(DOMINO_PLAN, asDomino, asCamo)

export const CAMO_PLAN: MethodPlan = [
  { key: 'stepCamoShape', goal: isBoxed, moves: allTurnsOf('camo'), phases: [backInShape] },
  {
    key: 'stepCenters',
    goal: (cube) => isBoxed(cube) && centersUp(cube.filter(isCenter)),
    moves: IN_BOX,
    phases: [raiseCenters],
  },
  {
    key: 'stepPairEdges',
    goal: (cube) => isBoxed(cube) && centersUp(cube.filter(isCenter)) && edgesPaired(cube),
    // Its formulas step out of the box a moment.
    moves: allTurnsOf('camo'),
    phases: [pairEdges],
  },
  ...DOMINO_PHASE,
]
