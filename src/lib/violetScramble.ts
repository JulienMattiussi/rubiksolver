import { applyMove } from './turn'
import { SHAPE_DIMS, type Cube, type Face, type Move } from './types'
import { violetTurns } from './violet'

/**
 * The Violet's scramble. Random turns undo each other: most of its turns
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
 *  stand counts (sorted), then A's minis in order with their colors' normals
 *  (each mini is told apart by its colors). */
function lookOf(cube: Cube): string {
  const bigs: number[] = []
  let minis = ''
  for (const c of cube) {
    const [x, y, z] = c.position
    const at = (x + 4) * 81 + (y + 4) * 9 + (z + 4)
    if (Math.abs(x) % 2 === 1) bigs.push(at)
    else {
      minis += String.fromCharCode(256 + at)
      for (const s of c.stickers) {
        minis += String.fromCharCode(
          48 + (s.normal[0] + 1) * 9 + (s.normal[1] + 1) * 3 + s.normal[2] + 1,
        )
      }
    }
  }
  bigs.sort((p, q) => p - q)
  return String.fromCharCode(...bigs.map((v) => 256 + v)) + minis
}

/** Whether a mini stands out of A's corner (centers 0 or 2 on each axis). */
export const aBroken = (cube: Cube) =>
  cube.some((c) => c.position.every((v) => v % 2 === 0) && c.position.some((v) => v < 0))

/** Turns past `length` before giving up on breaking A (never reached in
 *  practice: a few turns do). */
const EXTRA = 30

export function scrambleViolet(length: number, rng: () => number, start: Cube): Move[] {
  const seen = new Set([lookOf(start)])
  const moves: Move[] = []
  let state = start
  while (moves.length < length || (!aBroken(state) && moves.length < length + EXTRA)) {
    const last = moves[moves.length - 1]?.face
    const ahead = TURNS.filter((m) => violetTurns(state, m.face)).map((move) => ({
      move,
      after: applyMove(state, move, SHAPE_DIMS.violet),
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
