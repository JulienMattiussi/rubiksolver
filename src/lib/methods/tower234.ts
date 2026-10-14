import { isBoxed, isSolved, solvedCube } from '../cube'
import { normalIndex } from '../geometry'
import { invertMoves, parseMoves } from '../moves'
import { allTurnsOf, moveSet } from '../moveSet'
import { atHome, homesOf } from '../pieces'
import { solvePieces } from '../pieceSearch'
import type { MethodPlan } from '../solverKit'
import { applyMoves, turnAllowed } from '../turn'
import type { Cube, Cubie, Move } from '../types'

/**
 * 2x3x4 tower, as fan2cube.fr solves it (tower2342), in its box:
 *
 *   A. Shape    the side columns stood back up (the fewest turns)
 *   B. Centers  the four centers of the front and the back
 *   C. Corners  with P(H*D.G.H*D)3P and P(H*G'.D'.H*G')3P
 *   D. Edges    the top's and the bottom's middle edges: (D2H)3, (D2A)3,
 *               PB.(D2A)3.BP
 *   E. Equator  ((D2h)2P)2, ((G2h)2P)2, hA.(D2h)2.Ah, (HA)3, and one of
 *               our own that leaves the box and comes back
 *
 * Only its side columns turn by quarters (the page writes X for X2 where
 * a turn only goes by halves, and D2 for a column's): H B = U2 D2, H* B* =
 * Uw2 Dw2 (the top or bottom half), h = 2U2 (the page's h = H*H'), D G =
 * R L (the side columns, a quarter out of the box and back in the corners'
 * formulas), A P = Fw2 Bw2 (the front or back half). Each step searches the pieces it places
 * and those placed before, with the box's turns and its formulas (each set
 * up by a turn of the box, undone after, kept when it leaves nothing seen
 * moved but what the step may move).
 * Each formula's effect is asserted in tests/unit/tower234.test.ts.
 */

const SHAPE = '234'
const SOLVED = solvedCube(SHAPE)

/** A formula in the app's notation, `(...)n` repeated. */
const formula = (text: string): Move[] => {
  let s = text
  for (;;) {
    const t = s.replace(/\(([^()]*)\)(\d)/g, (_, g: string, n: string) =>
      Array(Number(n)).fill(g).join(' '),
    )
    if (t === s) return parseMoves(s)
    s = t
  }
}

export const TOWER234_FORMULAS = {
  cornersD: formula('Bw2 (Uw2 R L Uw2 R)3 Bw2'),
  cornersG: formula("Bw2 (Uw2 L' R' Uw2 L')3 Bw2"),
  edgesTop: formula('(R2 U2)3'),
  edgesFront: formula('(R2 Fw2)3'),
  edgesBack: formula('Bw2 D2 (R2 Fw2)3 D2 Bw2'),
  equatorD: formula('((R2 2U2)2 Bw2)2'),
  equatorG: formula('((L2 2U2)2 Bw2)2'),
  equatorH: formula('2U2 Fw2 (R2 2U2)2 Fw2 2U2'),
  equatorA: formula('(U2 Fw2)3'),
  // Not the page's: found from a scramble the page's formulas could not
  // finish (the scramble and the steps before, which only left the equator
  // wrong), the shortest of a few hundred.
  equatorParity: formula("Bw2 Fw2 Dw2 R' Fw2 R Fw2 R2 Fw2 Bw2 L' D2 L Uw2 L Uw2 L Uw2 L2 D2"),
}

/** The box's turns, every one a half. */
const BOX = moveSet('U2 D2 Uw2 Dw2 R2 L2 Fw2 Bw2')
const BOX_TURNS = BOX.turns as Move[]

const kindOf = (c: Cubie) =>
  c.stickers.length === 3
    ? 'corner'
    : c.stickers.length === 1
      ? 'center'
      : Math.abs(c.position[1]) === 3
        ? 'edge'
        : 'equator'

const homes = (...kinds: string[]) => homesOf(SHAPE, (c) => kinds.includes(kindOf(c)))
const isHome = (c: Cubie) => atHome(c, SHAPE)

/** Where some pieces stand and how they are turned, twins merged. */
const layoutKey = (pieces: readonly Cubie[]) =>
  pieces
    .map(
      (c) =>
        `${c.position.join(',')}:${c.stickers
          .map((s) => `${normalIndex(s.normal)}${s.color}`)
          .sort()
          .join('')}`,
    )
    .sort()
    .join(' ')

/** A slot's look: its piece's colors by direction. */
const lookAt = (cube: Cube) =>
  new Map(
    cube.map((c) => [
      c.position.join(),
      c.stickers
        .map((s) => `${normalIndex(s.normal)}${s.color}`)
        .sort()
        .join(''),
    ]),
  )

/** A formula and its setups by a turn of the box (undone after), those
 *  that only change what `may` lets move (the rest, twins aside, as seen). */
function variants(base: readonly Move[], may: (c: Cubie) => boolean): Move[][] {
  const home = lookAt(SOLVED)
  const out: Move[][] = []
  for (const setup of [[], ...BOX_TURNS.map((m) => [m])]) {
    const moves = [...setup, ...base, ...invertMoves(setup)]
    const after = lookAt(applyMoves(SOLVED, moves))
    const ok = SOLVED.every(
      (c) => may(c) || after.get(c.position.join()) === home.get(c.position.join()),
    )
    if (ok) out.push(moves)
  }
  return out
}

/** A. Back in the box: the fewest turns there, on the shape alone (where
 *  the pieces stand). */
function standUp(cube: Cube): Move[] {
  const shapeOf = (c: Cube) =>
    c
      .map((p) => p.position.join())
      .sort()
      .join(' ')
  const turns = allTurnsOf(SHAPE).turns as Move[]
  const seen = new Set([shapeOf(cube)])
  let frontier: { cube: Cube; moves: Move[] }[] = [{ cube, moves: [] }]
  while (frontier.length) {
    const next: typeof frontier = []
    for (const at of frontier) {
      if (isBoxed(at.cube)) return at.moves
      for (const m of turns) {
        if (!turnAllowed(at.cube, m)) continue
        const after = applyMoves(at.cube, [m])
        const id = shapeOf(after)
        if (seen.has(id)) continue
        seen.add(id)
        next.push({ cube: after, moves: [...at.moves, m] })
      }
    }
    frontier = next
  }
  throw new Error('tower234: it cannot stand back in its box')
}

/** A step: its pieces home, those before kept, by the box's turns and its
 *  formulas (`setups`: the box's turns too). */
const step =
  (kinds: string[], macros: readonly (readonly Move[])[], setups: boolean, maxDepth: number) =>
  (cube: Cube): Move[] =>
    solvePieces(cube, {
      track: homes(...kinds),
      moves: setups ? BOX : moveSet(''),
      macros,
      goal: (p) => p.every(isHome),
      key: layoutKey,
      maxDepth,
    })

const done =
  (...kinds: string[]) =>
  (cube: Cube) =>
    isBoxed(cube) && cube.filter((c) => kinds.includes(kindOf(c))).every(isHome)

const F = TOWER234_FORMULAS
const CORNER_MACROS = [F.cornersD, F.cornersG].flatMap((f) => [f, invertMoves(f)])
const EDGE_MACROS = [F.edgesTop, F.edgesFront, F.edgesBack].flatMap((f) =>
  variants(f, (c) => kindOf(c) === 'edge' || kindOf(c) === 'equator'),
)
// The page's equator formulas keep it in the box: they reach only a third
// of what it can be once the rest is done. One that leaves the box (a
// column a quarter out and back) takes it to the rest.
const EQUATOR_MACROS = [
  F.equatorD,
  F.equatorG,
  F.equatorH,
  F.equatorA,
  F.equatorParity,
  invertMoves(F.equatorParity),
].flatMap((f) => variants(f, (c) => kindOf(c) === 'equator'))

export const TOWER234_PLAN: MethodPlan = [
  {
    key: 'stepT234Shape',
    goal: isBoxed,
    moves: allTurnsOf(SHAPE),
    phases: [standUp],
    optional: true,
  },
  {
    key: 'stepT234Centers',
    goal: done('center'),
    moves: allTurnsOf(SHAPE),
    phases: [step(['center'], [], true, 8)],
  },
  {
    key: 'stepT234Corners',
    goal: done('center', 'corner'),
    moves: allTurnsOf(SHAPE),
    phases: [step(['center', 'corner'], CORNER_MACROS, true, 10)],
  },
  {
    key: 'stepT234Edges',
    goal: done('center', 'corner', 'edge'),
    moves: allTurnsOf(SHAPE),
    phases: [step(['center', 'corner', 'edge'], EDGE_MACROS, true, 8)],
  },
  {
    key: 'stepT234Equator',
    goal: isSolved,
    moves: allTurnsOf(SHAPE),
    phases: [step(['center', 'corner', 'edge', 'equator'], EQUATOR_MACROS, false, 8)],
  },
]
