import { cubeOrientations, solvedCube } from '../../core/cube'
import { faceOfNormal, mapVec, normalIndex, vecKey } from '../../core/geometry'
import { allTurnsOf } from '../../core/moveSet'
import { invertMoves, parseMoves } from '../../core/moves'
import { colorsOf } from '../../core/pieces'
import type { MethodPlan } from '../../solve/solverKit'
import { applyMoves } from '../../core/turn'
import type { Cube, CubeShape, Cubie, Move, Vec3 } from '../../core/types'
import { cycleTable, placeByCycles, uniqueHomes } from '../../solve/cycleTable'
import { once } from '../../solve/once'
import { heldEveryWay, turnedFace } from '../../solve/everyWay'
import { COMM_FR, COMM_UR } from '../standard/algs'

/**
 * Octahedron VTO and GEM-0, "centers then edges", as taught on fan2cube.fr
 * (VTO2, GEM-O2): a 3x3x3 cut to an octahedron (vto.ts), whose corners only
 * turn in place.
 *
 *   1. Centers   each corner turned until the four triangles beside it
 *                (fan2cube's "centres") match their faces
 *   2. Edges     placed with the page's 3-cycles, from every side and set
 *                up by a turn: on the VTO, three edges of a face, [G D'],
 *                and three around a corner, G'PG.P.G'P²G; on the GEM-0,
 *                [H D]
 *   3. Flips     two at a time, [G D'][P' D] (the GEM-0's [A D'][H' D])
 *   4. Tips      the VTO's, each turned alone to match (the page's corners
 *                that "serve no purpose")
 *
 * The page holds the puzzle a face toward us, its corner P on top, G at the
 * lower left and D at the lower right: P, G, D are the cube's U, F, R
 * (every formula's effect is asserted in tests/unit/puzzles/polyhedron/vto.test.ts).
 *
 * Its corners never leave their place and their colors tell how the solved
 * puzzle is held: the one whose corners show the same colors. Once they all
 * face right, the edges stand in an even permutation (a quarter turn is a
 * 4-cycle of edges and a quarter of a corner turn), so 3-cycles do the rest.
 */

/** The cube's centers (a corner's triangles), the VTO's tips beyond them,
 *  and the cube's edges, by where they stand. */
const nonZero = (c: Cubie) => c.position.filter((v) => v !== 0).length
const reach = (c: Cubie) => Math.max(...c.position.map(Math.abs))
const isCenter = (c: Cubie) => nonZero(c) === 1 && reach(c) === 1
const isTip = (c: Cubie) => nonZero(c) === 1 && reach(c) === 2
const isEdge = (c: Cubie) => nonZero(c) === 2

/** The VTO page's formulas, in the cube's letters (P = U, G = F, D = R). */
export const FACE_CYCLE = parseMoves(COMM_FR)
export const CORNER_CYCLE = parseMoves("F' U F U F' U2 F")
export const EDGE_FLIP = parseMoves("F R' F' R U' R U R'")

/** The GEM-0 page's 3-cycle (its letters are the cube's: A = F, D = R,
 *  H = U), (HP) -> (HD) -> (AD); its flip of (HA) and (HD), [A D'][H' D],
 *  is the VTO's held the same way. */
export const GEM_CYCLE = parseMoves(COMM_UR)

/** A puzzle of the family: its solved state, its turns, its ways of being
 *  held, and the page's 3-cycles and flip. */
interface Family {
  readonly solved: Cube
  readonly all: ReturnType<typeof allTurnsOf>
  readonly holdings: readonly Cube[]
  readonly cycleFormulas: readonly (readonly Move[])[]
  readonly flip: readonly Move[]
  /** The VTO: a corner turns wide (Rw), its tip alone outer (R). */
  readonly tips: boolean
}

/** The family's plan for a shape, its tables of 3-cycles and flips built
 *  on first use. */
function centersThenEdges(
  shape: CubeShape,
  f0: Omit<Family, 'solved' | 'all' | 'holdings'>,
): MethodPlan {
  const solved = solvedCube(shape)
  // A corner's turn: wide where the tips turn apart.
  const corner = (m: Move): Move => (f0.tips ? { ...m, depth: 2, wide: true } : m)
  const f: Family = {
    ...f0,
    cycleFormulas: f0.cycleFormulas.map((moves) => moves.map(corner)),
    flip: f0.flip.map(corner),
    solved,
    all: allTurnsOf(shape),
    holdings: cubeOrientations(solved),
  }
  const cornerTurns = (f.all.turns as Move[]).filter((m) => !f.tips || m.wide)
  /** How the solved puzzle is held: the way whose corners show the same
   *  colors as this state's (they never move, only turn). */
  function holdingOf(cube: Cube): Cube {
    const at = new Map(cube.filter(isCenter).map((c) => [vecKey(c.position), colorsOf(c)]))
    const held = f.holdings.find((h) =>
      h.filter(isCenter).every((c) => at.get(vecKey(c.position)) === colorsOf(c)),
    )
    if (!held) throw new Error('vto: its corners match no way of holding it')
    return held
  }

  /** Each sticker's wanted color, by position and normal. */
  const sticker = (c: Cubie, normal: Vec3) =>
    c.stickers.find((s) => normalIndex(s.normal) === normalIndex(normal))?.color

  /** Whether every piece of a kind (they only turn in place) shows its
   *  faces' colors. */
  const facingRight = (kind: (c: Cubie) => boolean) => (cube: Cube) => {
    const held = new Map(holdingOf(cube).map((c) => [vecKey(c.position), c]))
    return cube
      .filter(kind)
      .every((c) =>
        c.stickers.every((s) => sticker(held.get(vecKey(c.position))!, s.normal) === s.color),
      )
  }
  const centersDone = facingRight(isCenter)

  /** Each piece of a kind turned until it faces right, by `turn` (its
   *  corner's, or its tip's alone), 1 to 3 quarters. */
  const turnEach =
    (kind: (c: Cubie) => boolean, turn: (m: Move) => Move) =>
    (cube: Cube): Move[] => {
      const held = new Map(holdingOf(cube).map((c) => [vecKey(c.position), c]))
      const moves: Move[] = []
      let state = cube
      for (const home of f.solved.filter(kind)) {
        const face = faceOfNormal(mapVec(home.position, Math.sign))
        const want = held.get(vecKey(home.position))!
        const right = (s: Cube) => {
          const c = s.find((p) => vecKey(p.position) === vecKey(home.position))!
          return c.stickers.every((st) => sticker(want, st.normal) === st.color)
        }
        if (right(state)) continue
        const amount = ([1, 2, 3] as const).find((a) =>
          right(applyMoves(state, [turn({ face, amount: a })])),
        )
        if (!amount) throw new Error('vto: a piece cannot face right')
        moves.push(turn({ face, amount }))
        state = applyMoves(state, [turn({ face, amount })])
      }
      return moves
    }

  /** Where each edge slot's piece belongs: the slot of its colors when solved
   *  as the puzzle is held. */
  const edgeHomes = (cube: Cube) => uniqueHomes(holdingOf(cube), isEdge)(cube)

  /** A formula as seen from each way of holding the puzzle: its faces carried
   *  by the whole-puzzle turn. */
  const fromEverySide = (moves: readonly Move[]): Move[][] =>
    heldEveryWay(moves, (m, by) => ({ ...m, face: turnedFace(m.face, by) }))

  /** Every 3-cycle of edges, from the page's (built once). */
  const edgeCycles = once(() =>
    cycleTable(f.solved, isEdge, f.cycleFormulas.flatMap(fromEverySide), cornerTurns),
  )

  /** Whether every edge sits home: placed, maybe flipped. */
  const edgesPlaced = (cube: Cube) => [...edgeHomes(cube)].every(([at, home]) => at === home)

  /** The edges standing flipped (placed, their colors on the wrong faces). */
  function flipped(cube: Cube): string[] {
    const held = new Map(holdingOf(cube).map((c) => [vecKey(c.position), c]))
    return cube
      .filter(isEdge)
      .filter((c) =>
        c.stickers.some((s) => sticker(held.get(vecKey(c.position))!, s.normal) !== s.color),
      )
      .map((c) => vecKey(c.position))
  }

  let flips: Map<string, Move[]> | undefined

  /**
   * Every pair of edges flipped in place, nothing else touched: the page's
   * formula from every side, then set up by turns (undone after) until no pair
   * is new, keyed by the two slots.
   */
  function flipTable(): Map<string, Move[]> {
    if (flips) return flips
    const found = new Map<string, Move[]>()
    const pairOf = (moves: readonly Move[]) => {
      const after = applyMoves(f.solved, moves)
      const changed = f.solved.flatMap((c, i) => {
        const now = after[i]!
        const same =
          vecKey(now.position) === vecKey(c.position) &&
          now.stickers.every((s, k) => normalIndex(s.normal) === normalIndex(c.stickers[k]!.normal))
        return same ? [] : [{ c, now }]
      })
      // Only two edges, each back in its slot, turned over.
      if (
        changed.length !== 2 ||
        !changed.every(({ c, now }) => isEdge(c) && vecKey(now.position) === vecKey(c.position))
      ) {
        return null
      }
      return changed
        .map(({ c }) => vecKey(c.position))
        .sort()
        .join('|')
    }
    let frontier: Move[][] = fromEverySide(f.flip)
    while (frontier.length) {
      const next: Move[][] = []
      for (const moves of frontier) {
        const pair = pairOf(moves)
        if (!pair || found.has(pair)) continue
        found.set(pair, moves)
        for (const turn of cornerTurns) next.push([turn, ...moves, ...invertMoves([turn])])
      }
      frontier = next
    }
    flips = found
    return found
  }

  /** The flipped edges turned over, two at a time. */
  function flipEdges(cube: Cube): Move[] {
    const moves: Move[] = []
    let state = cube
    for (let wrong = flipped(state); wrong.length > 0; wrong = flipped(state)) {
      const pair = [wrong[0]!, wrong[1]!].sort().join('|')
      const sequence = flipTable().get(pair)
      if (!sequence) throw new Error('vto: an edge alone cannot be flipped')
      moves.push(...sequence)
      state = applyMoves(state, sequence)
    }
    return moves
  }

  const edgesDone = (cube: Cube) =>
    centersDone(cube) && edgesPlaced(cube) && flipped(cube).length === 0
  return [
    {
      key: 'stepVtoCenters',
      goal: centersDone,
      moves: f.all,
      phases: [turnEach(isCenter, corner)],
    },
    {
      key: 'stepVtoEdges',
      goal: (cube) => centersDone(cube) && edgesPlaced(cube),
      moves: f.all,
      phases: [(cube) => placeByCycles(cube, edgeCycles(), edgeHomes)],
    },
    { key: 'stepVtoFlips', goal: edgesDone, moves: f.all, phases: [flipEdges] },
    ...(f.tips
      ? [
          {
            key: 'stepVtoTips',
            goal: (cube: Cube) => edgesDone(cube) && facingRight(isTip)(cube),
            moves: f.all,
            phases: [turnEach(isTip, (m) => m)],
          },
        ]
      : []),
  ]
}

export const VTO_PLAN = centersThenEdges('vto', {
  cycleFormulas: [FACE_CYCLE, CORNER_CYCLE],
  flip: EDGE_FLIP,
  tips: true,
})

export const GEM_PLAN = centersThenEdges('gem', {
  cycleFormulas: [GEM_CYCLE],
  flip: EDGE_FLIP,
  tips: false,
})
