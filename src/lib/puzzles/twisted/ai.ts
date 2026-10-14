import { FACE_SPEC } from '../../core/geometry'
import { applyMove, moveSlab } from '../../core/turn'
import type { Color, Cube, Cubie, Move, Vec3 } from '../../core/types'

/**
 * The AI Cube (fan2cube.fr/AIcube1): "un bandaged du Revenge 4x4x4". Of
 * the 4x4x4's eight octants (2x2x2 each), the four of one tetrahedron are
 * fused into big blocks; the other four stay small cubes: a small corner,
 * three wings (one per edge: every edge joins a big corner and a small one)
 * and three centers (two of each color). Solved, the big blocks stand in
 * quincunx. A turn only goes when it cuts no big block: a half of the cube
 * always (its cut is the middle), an outer layer or a slice only when no
 * block stands across its cuts.
 *
 * A big block is one cubie at its octant's middle ((2, 2, 2) and the like,
 * on the 4x4x4's grid, which runs -3, -1, 1, 3), a sticker per outer face;
 * the small ones are the 4x4x4's.
 */

/** Whether a cubie is a big block: on no layer of the grid. */
export const isBlock = (c: Cubie): boolean => c.position.every((v) => Math.abs(v) === 2)

/** The solved AI Cube, from the solved 4x4x4 (`solved4`): the octants of
 *  even sign fused, the hidden middle cubies left out. */
export function solvedAi(solved4: Cube): Cube {
  const even = (p: Vec3) => p[0] * p[1] * p[2] > 0
  const small = solved4.filter((c) => c.stickers.length > 0 && !even(c.position))
  const blocks = solved4
    .filter((c) => c.stickers.length === 3 && even(c.position))
    .map((c): Cubie => ({
      position: c.position.map((v) => Math.sign(v) * 2) as unknown as Vec3,
      stickers: c.stickers.map((s) => ({ normal: s.normal, color: s.color as Color })),
    }))
  return [...small, ...blocks]
}

/** Whether a turn cuts no big block: each wholly in its slab or out of it. */
export function aiTurns(cube: Cube, move: Move): boolean {
  const slab = moveSlab(move, [4, 4, 4])
  const axis = FACE_SPEC[move.face].coordIndex
  return cube.every((c) => {
    if (!isBlock(c)) return true
    const [lo, hi] = [c.position[axis]! - 2, c.position[axis]! + 2]
    return (lo >= slab.lo && hi <= slab.hi) || hi <= slab.lo || lo >= slab.hi
  })
}

const FACES = ['U', 'D', 'L', 'R', 'F', 'B'] as const
const AMOUNTS = [1, 2, 3] as const
const HALVES: Move[] = FACES.flatMap((face) =>
  AMOUNTS.map((amount): Move => ({ face, amount, depth: 2, wide: true })),
)
const THIN: Move[] = FACES.flatMap((face) =>
  AMOUNTS.flatMap((amount): Move[] => [
    { face, amount },
    { face, amount, depth: 2 },
  ]),
)

/** The big blocks alone (what decides which turns go). */
const blocksOf = (cube: Cube) => cube.filter(isBlock)
const thinTurns = (blocks: Cube) => THIN.filter((m) => aiTurns(blocks, m))

/** The fewest half turns to big blocks that `wanted`, one of them at
 *  random (none when they already are). */
function halvesTo(blocks: Cube, rng: () => number, wanted: (blocks: Cube) => boolean): Move[] {
  let frontier: { blocks: Cube; moves: Move[] }[] = [{ blocks, moves: [] }]
  const seen = new Set([
    blocks
      .map((c) => c.position.join())
      .sort()
      .join('|'),
  ])
  for (let depth = 0; depth < 6; depth++) {
    const found = frontier.filter((n) => wanted(n.blocks))
    if (found.length) return found[Math.floor(rng() * found.length)]!.moves
    const next: typeof frontier = []
    for (const node of frontier) {
      for (const move of HALVES) {
        const moved = applyMove(node.blocks, move, [4, 4, 4])
        const key = moved
          .map((c) => c.position.join())
          .sort()
          .join('|')
        if (seen.has(key)) continue
        seen.add(key)
        next.push({ blocks: moved, moves: [...node.moves, move] })
      }
    }
    frontier = next
  }
  return [HALVES[Math.floor(rng() * HALVES.length)]!]
}

/** Big blocks spread out: two in each half of the cube, on every axis. */
const spread = (blocks: Cube) =>
  [0, 1, 2].every((axis) => blocks.filter((c) => c.position[axis]! > 0).length === 2)

/**
 * An AI Cube scramble. Random turns alone hardly ever free a half of its
 * big blocks (solved, only the halves turn), so the puzzle would stay
 * barely mixed: whenever an outer layer or a slice can turn, it mostly
 * does; when none can, the fewest half turns that free one come first.
 * It ends with the big blocks spread out again (two in each half), as they
 * would never be left grouped.
 */
export function scrambleAi(length: number, rng: () => number, start: Cube): Move[] {
  let blocks: Cube = blocksOf(start)
  const moves: Move[] = []
  while (moves.length < length) {
    // Never the same layer twice in a row (the top and its slice may).
    const last = moves[moves.length - 1]
    const thin = thinTurns(blocks).filter(
      (m) => m.face !== last?.face || m.depth !== last.depth || !!last.wide,
    )
    const next =
      thin.length && rng() < 0.75
        ? [thin[Math.floor(rng() * thin.length)]!]
        : thin.length
          ? [HALVES[Math.floor(rng() * HALVES.length)]!]
          : thinTurns(blocks).length
            ? // Only the last face's layers turn: a half first.
              [HALVES[Math.floor(rng() * HALVES.length)]!]
            : halvesTo(blocks, rng, (b) => thinTurns(b).length > 0)
    for (const move of next) {
      blocks = applyMove(blocks, move, [4, 4, 4])
      moves.push(move)
    }
  }
  return [...moves, ...halvesTo(blocks, rng, spread)]
}
