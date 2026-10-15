import { FACE_NORMAL, FACE_SPEC, mapVec } from '../../core/geometry'
import { MARK, isMark } from '../../core/types'
import { stateKey } from '../../core/cube'
import { simplifyMoves } from '../../core/moves'
import { applyMove, inSlab, moveSlab } from '../../core/turn'
import type { Cube, Cubie, Face, Move, Vec3 } from '../../core/types'
import { stickerColors } from '../../core/pieces'

/**
 * The bandaged 3x3x3s (fan2cube.fr's "Bandaged" puzzles): a 3x3x3 whose
 * neighbouring cubies are fused into blocks, a corner and an edge into a
 * bar ("barre"), an edge and a center into a tab ("languette"), four
 * cubies into a square ("carré"), eight into a 2x2x2 ("Fused"). A turn only
 * goes when it cuts no block: each block wholly in its slab or out of it.
 *
 * Model: the 3x3x3's cubies, each fused one marked by a hidden sticker
 * pointing to every neighbour it is fused to (as the RoadBlock-I's centers,
 * roadblock.ts): every turn carries the marks, so a state says where its
 * blocks lie. The marks are never drawn nor painted.
 */

/** A block, by the names of its cubies (`'DFL'` a corner, `'F'` a center,
 *  `'O'` the hidden core, which a 2x2x2 holds). */
export type Block = readonly string[]

/** Where a named cubie sits when solved. */
function cellOf(name: string): Vec3 {
  return [...name.replace('O', '')].reduce<Vec3>(
    (p, f) => mapVec(p, (v, i) => v + FACE_NORMAL[f as Face][i]!),
    [0, 0, 0],
  )
}

const same = (a: readonly number[], b: readonly number[]) => a.every((v, i) => v === b[i])

/** Whether two cells touch face to face. */
const touching = (a: readonly number[], b: readonly number[]) =>
  a.reduce((n, v, i) => n + Math.abs(v - b[i]!), 0) === 1

/** The solved 3x3x3 `cube` with its `blocks` fused: each cubie marked
 *  towards every neighbour of its block. */
export function withBlocks(cube: Cube, blocks: readonly Block[]): Cube {
  const cells = blocks.map((block) => block.map(cellOf))
  return cube.map((c) => {
    const block = cells.find((b) => b.some((p) => same(p, c.position)))
    if (!block) return c
    const marks = block
      .filter((p) => touching(p, c.position))
      .map((p) => ({ normal: mapVec(p, (v, i) => v - c.position[i]!), color: MARK }))
    return { ...c, stickers: [...c.stickers, ...marks] }
  })
}

/** The 3x3x3 it is, its marks set aside. */
export const withoutMarks = (cube: Cube): Cube =>
  cube.map((c) =>
    c.stickers.some(isMark) ? { ...c, stickers: c.stickers.filter((s) => !isMark(s)) } : c,
  )

/** Whether a turn cuts no block: no cubie it turns is fused across its cut. */
export function cutsNoBlock(cube: Cube, move: Move): boolean {
  const axis = FACE_SPEC[move.face].coordIndex
  const slab = moveSlab(move, [3, 3, 3])
  return cube.every((c) =>
    c.stickers.every(
      (s) =>
        !isMark(s) ||
        s.normal[axis] === 0 ||
        inSlab(c.position[axis]!, slab) === inSlab(c.position[axis]! + s.normal[axis]!, slab),
    ),
  )
}

const FACES: readonly Face[] = ['U', 'D', 'L', 'R', 'F', 'B']
const QUARTERS: readonly Move[] = FACES.map((face) => ({ face, amount: 1 }))

/** The fused cubies alone, colors erased: what decides which turns go. */
const blocksOf = (cube: Cube): Cube =>
  cube.flatMap((c) =>
    c.stickers.some(isMark) ? [{ position: c.position, stickers: c.stickers.filter(isMark) }] : [],
  )

/** A state of the blocks, however its cubies are listed. */
const keyOf = (blocks: Cube): string =>
  blocks
    .map((c) => `${c.position.join()}:${c.stickers.map((s) => s.normal.join()).join(';')}`)
    .sort()
    .join(' ')

/** Every arrangement of the blocks reached from `solved`, each once (its
 *  "forms", fan2cube's "formes": a state with its colors erased). */
export function formsOfBlocks(solved: Cube): Cube[] {
  const start = blocksOf(solved)
  const seen = new Map([[keyOf(start), start]])
  let frontier = [start]
  while (frontier.length) {
    const next: Cube[] = []
    for (const state of frontier) {
      for (const quarter of QUARTERS) {
        if (!cutsNoBlock(state, quarter)) continue
        let turned = state
        for (let amount = 1; amount <= 3; amount++) {
          turned = applyMove(turned, quarter, [3, 3, 3])
          const key = keyOf(turned)
          if (seen.has(key)) continue
          seen.set(key, turned)
          next.push(turned)
        }
      }
    }
    frontier = next
  }
  return [...seen.values()]
}

/** The turns that go in some form of the puzzle: its others never do (the
 *  faces a 2x2x2 holds). */
export function turnsEver(solved: Cube): Move[] {
  const forms = formsOfBlocks(solved)
  return QUARTERS.filter((q) => forms.some((form) => cutsNoBlock(form, q))).flatMap((q) =>
    ([1, 2, 3] as const).map((amount) => ({ ...q, amount })),
  )
}

/** A scramble: random turns among those the state lets through, never the
 *  same face twice in a row (unless it alone goes), and none back to a
 *  state already passed
 *  while another goes on: with few turns that go, a plain random walk
 *  keeps undoing itself and hardly mixes the puzzle. */
export function scrambleBandaged(
  turns: readonly Move[],
): (length: number, rng: () => number, start: Cube) => Move[] {
  return (length, rng, start) => {
    let state = start
    const passed = new Set([stateKey(start)])
    const moves: Move[] = []
    // Turns of one face in a row (a dead end's) merge: counted as one.
    for (let tries = 0; simplifyMoves(moves).length < length && tries < 10 * length; tries++) {
      const last = moves[moves.length - 1]
      const going = turns.filter((m) => cutsNoBlock(state, m))
      // The same face again only when it is the one that goes (a dead end).
      const others = going.filter((m) => m.face !== last?.face)
      const free = (others.length ? others : going).map((move) => ({
        move,
        after: applyMove(state, move, [3, 3, 3]),
      }))
      if (!free.length) break
      const fresh = free.filter((f) => !passed.has(stateKey(f.after)))
      const pool = fresh.length ? fresh : free
      const next = pool[Math.floor(rng() * pool.length)]!
      state = next.after
      passed.add(stateKey(state))
      moves.push(next.move)
    }
    return simplifyMoves(moves)
  }
}

/** A piece's colors, marks aside: who it is. */
const colorsOf = (c: Cubie) => stickerColors(c.stickers.filter((s) => !isMark(s)))

/**
 * An entered state's marks, from its colors (`entered`, without marks):
 * every piece is unique on a 3x3x3 (a center by its color), so each fused
 * pair of the solved puzzle is found again, and marked towards each other
 * when they touch. Pieces whose block is broken stay unmarked: their marks
 * then fall short of the solved puzzle's, which validation tells.
 */
export function marksFromColors(entered: Cube, solved: Cube): Cube {
  const at = new Map(entered.map((c) => [colorsOf(c), c.position]))
  return entered.map((c) => {
    // (The core, the one piece without colors, is found the same way.)
    const home = solved.find((s) => colorsOf(s) === colorsOf(c))
    const marks = (home?.stickers.filter(isMark) ?? []).flatMap((mark) => {
      const partnerCell = home!.position.map((v, i) => v + mark.normal[i]!)
      const partner = solved.find((s) => same(s.position, partnerCell))!
      const now = at.get(colorsOf(partner))
      if (!now || !touching(now, c.position)) return []
      return [{ normal: mapVec(now, (v, i) => v - c.position[i]!), color: MARK }]
    })
    return marks.length ? { ...c, stickers: [...c.stickers, ...marks] } : c
  })
}

/** A piece as the editor draws it in its slot: fused as the solved
 *  puzzle's cubie there is (the blocks that never move are pre-filled). */
export const fusedAs = (cubie: Cubie, solved: Cube): Cubie => {
  const marks = solved.find((s) => same(s.position, cubie.position))?.stickers.filter(isMark) ?? []
  return marks.length ? { ...cubie, stickers: [...cubie.stickers, ...marks] } : cubie
}
