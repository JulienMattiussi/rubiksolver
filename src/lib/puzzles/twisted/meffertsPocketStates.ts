import { solvedCube } from '../../core/cube'
import { applyMove } from '../../core/turn'
import { AXIS_ROTATIONS, FACE_NORMAL } from '../../core/geometry'
import { type Cube, type Face, type Move, type Vec3 } from '../../core/types'
import { SHAPE_DIMS } from '../../core/shapes'
import { meffertsPocketBoxed, meffertsPocketTurns } from './meffertsPocket'

/**
 * Meffert's Pocket Cube's states as one sees them (its big cubes alike): few enough
 * (41760) to search whole, for its solutions, the editor's check, and its
 * scramble.
 *
 * The scramble. Random turns undo each other: most of its turns
 * jam, so a random walk keeps folding back into the cube, A whole. This one
 * never comes back to a state it went through (the cube it starts from
 * included), so it can only wander off, and goes on past its length until
 * A is broken up.
 */

const FACES: readonly Face[] = ['U', 'D', 'L', 'R', 'F', 'B']
const TURNS: readonly Move[] = FACES.flatMap((face) =>
  ([1, 2, 3] as const).map((amount): Move => ({ face, amount })),
)

/** A state as one sees it: the big cubes are alike, so only where they
 *  stand counts, then A's minis, each where it stands with its colors and
 *  where they face (sorted: whatever order the pieces are listed in, an
 *  entered puzzle's included). */
function lookOf(cube: Cube): string {
  const bigs: number[] = []
  const minis: string[] = []
  for (const c of cube) {
    const [x, y, z] = c.position
    const at = (x + 4) * 81 + (y + 4) * 9 + (z + 4)
    if (Math.abs(x) % 2 === 1) bigs.push(at)
    else {
      const stickers = c.stickers.map(
        (s) =>
          String.fromCharCode(
            48 + (s.normal[0] + 1) * 9 + (s.normal[1] + 1) * 3 + s.normal[2] + 1,
          ) + s.color,
      )
      minis.push(String.fromCharCode(256 + at) + stickers.sort().join(''))
    }
  }
  bigs.sort((p, q) => p - q)
  return String.fromCharCode(...bigs.map((v) => 256 + v)) + minis.sort().join('')
}

/** Whether a mini stands out of A's corner (centers 0 or 2 on each axis). */
export const aBroken = (cube: Cube) =>
  cube.some((c) => c.position.every((v) => v % 2 === 0) && c.position.some((v) => v < 0))

/** Each reachable state (41760, by its look) and the turn that first
 *  reached it from the solved puzzle, with the look it came from: a tree of
 *  shortest paths, found once by a breadth-first search (about a second). */
let tree: Map<string, { readonly from: string; readonly move: Move } | null> | null = null

function searchTree() {
  if (tree) return tree
  const solved = solvedCube('meffertsPocket')
  tree = new Map([[lookOf(solved), null]])
  let frontier = [{ state: solved, look: lookOf(solved) }]
  while (frontier.length) {
    const next: typeof frontier = []
    for (const { state, look: from } of frontier) {
      for (const move of TURNS) {
        // Its own jam test and mechanism: no need to tell its shape again.
        if (!meffertsPocketTurns(state, move)) continue
        const after = applyMove(state, move, SHAPE_DIMS.meffertsPocket)
        const look = lookOf(after)
        if (tree.has(look)) continue
        tree.set(look, { from, move })
        next.push({ state: after, look })
      }
    }
    frontier = next
  }
  return tree
}

/** The state held another way about its core, and its turns' faces back. */
function heldBy(cube: Cube, rotate: (v: Vec3) => Vec3): Cube {
  return cube.map((c) => ({
    position: rotate(c.position),
    stickers: c.stickers.map((s) => ({ normal: rotate(s.normal), color: s.color })),
  }))
}

/** A shortest solution: the tree's path to the state, undone (a turn that
 *  went still goes back: the pieces it moved stay clear of every cut). Held
 *  otherwise than the tree's states (both halves of an axis turned), it is
 *  solved as held the tree's way, its turns' faces turned back. Throws on a
 *  state no turns reach. */
export function solveMeffertsPocket(cube: Cube): Move[] {
  const paths = searchTree()
  for (const rotate of AXIS_ROTATIONS) {
    let look = lookOf(heldBy(cube, rotate))
    if (!paths.has(look)) continue
    // The face that, held this way, is the tree's.
    const back = (face: Face) =>
      FACES.find((f) => rotate(FACE_NORMAL[f]).join() === FACE_NORMAL[face].join())!
    const moves: Move[] = []
    for (let at = paths.get(look); at; at = paths.get(look)) {
      moves.push({ face: back(at.move.face), amount: (4 - at.move.amount) as 1 | 2 | 3 })
      look = at.from
    }
    return moves
  }
  throw new Error('solveMeffertsPocket: no turns reach this state')
}

/** The fewest turns that make Meffert's Pocket Cube a cube again, whatever A's colors. */
export function meffertsPocketToCube(cube: Cube): Move[] {
  const seen = new Set([lookOf(cube)])
  let frontier = [{ state: cube, moves: [] as Move[] }]
  while (frontier.length) {
    const next: typeof frontier = []
    for (const { state, moves } of frontier) {
      if (meffertsPocketBoxed(state)) return moves
      for (const move of TURNS) {
        if (!meffertsPocketTurns(state, move)) continue
        const after = applyMove(state, move, SHAPE_DIMS.meffertsPocket)
        const look = lookOf(after)
        if (seen.has(look)) continue
        seen.add(look)
        next.push({ state: after, moves: [...moves, move] })
      }
    }
    frontier = next
  }
  throw new Error('meffertsPocketToCube: no turns make it a cube')
}

/** Turns past `length` before giving up on breaking A (never reached in
 *  practice: a few turns do). */
const EXTRA = 30

export function scrambleMeffertsPocket(length: number, rng: () => number, start: Cube): Move[] {
  const seen = new Set([lookOf(start)])
  const moves: Move[] = []
  let state = start
  while (moves.length < length || (!aBroken(state) && moves.length < length + EXTRA)) {
    const last = moves[moves.length - 1]?.face
    const ahead = TURNS.filter((m) => meffertsPocketTurns(state, m)).map((move) => ({
      move,
      after: applyMove(state, move, SHAPE_DIMS.meffertsPocket),
    }))
    // Somewhere new by another face than the last; else somewhere new; else
    // (a dead end of the walk, rare) anywhere.
    const fresh = ahead.filter(({ after }) => !seen.has(lookOf(after)))
    const other = fresh.filter(({ move }) => move.face !== last)
    const pool = other.length > 0 ? other : fresh.length > 0 ? fresh : ahead
    const pick = pool[Math.floor(rng() * pool.length)]!
    seen.add(lookOf(pick.after))
    moves.push(pick.move)
    state = pick.after
  }
  return moves
}
