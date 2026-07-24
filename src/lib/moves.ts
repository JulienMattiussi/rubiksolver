import type { Face, Move } from './types'

export const FACES: readonly Face[] = ['U', 'D', 'L', 'R', 'F', 'B']

/** All 18 basic face turns, in a stable order (for UI buttons and tests). */
export const ALL_MOVES: readonly Move[] = FACES.flatMap((face) =>
  ([1, 2, 3] as const).map((amount) => ({ face, amount })),
)

/** Human-readable notation for a move: `U`, `U2`, `U'`. */
export function formatMove(move: Move): string {
  const suffix = move.amount === 1 ? '' : move.amount === 2 ? '2' : "'"
  return move.face + suffix
}

/** Format a sequence, space-separated. */
export function formatMoves(moves: readonly Move[]): string {
  return moves.map(formatMove).join(' ')
}

/** Parse a single token like `R`, `R2`, `R'` into a Move (undefined if invalid). */
export function parseMove(token: string): Move | undefined {
  const m = /^([UDLRFB])(2|')?$/.exec(token.trim())
  if (!m) return undefined
  const face = m[1] as Face
  const amount = m[2] === '2' ? 2 : m[2] === "'" ? 3 : 1
  return { face, amount }
}

/** Parse a whitespace-separated algorithm string. Skips empty tokens. */
export function parseMoves(input: string): Move[] {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((tok) => {
      const move = parseMove(tok)
      if (!move) throw new Error(`Invalid move: "${tok}"`)
      return move
    })
}

/** The move that undoes `move` (same face, opposite amount). */
export function invertMove(move: Move): Move {
  const amount = move.amount === 2 ? 2 : move.amount === 1 ? 3 : 1
  return { face: move.face, amount }
}

/** The sequence that undoes `moves` (reversed and each inverted). */
export function invertMoves(moves: readonly Move[]): Move[] {
  return [...moves].reverse().map(invertMove)
}

/**
 * Collapse trivially redundant consecutive moves on the same face
 * (e.g. `R R` -> `R2`, `R R'` -> nothing, `R2 R2` -> nothing). Keeps generated
 * solutions tidy without changing what they do.
 */
export function simplifyMoves(moves: readonly Move[]): Move[] {
  const out: Move[] = []
  for (const move of moves) {
    const last = out[out.length - 1]
    if (last && last.face === move.face) {
      const total = (last.amount + move.amount) % 4
      out.pop()
      if (total !== 0) out.push({ face: move.face, amount: total as 1 | 2 | 3 })
    } else {
      out.push(move)
    }
  }
  return out
}

/**
 * Random scramble of `length` moves. Avoids consecutive turns of the same face
 * (they would collapse) so the length is meaningful. `rng` is injectable for
 * deterministic tests; defaults to Math.random.
 */
export function scramble(length = 25, rng: () => number = Math.random): Move[] {
  const moves: Move[] = []
  let prevFace: Face | undefined
  for (let i = 0; i < length; i++) {
    let face: Face
    do {
      face = FACES[Math.floor(rng() * FACES.length)]!
    } while (face === prevFace)
    prevFace = face
    const amount = (Math.floor(rng() * 3) + 1) as 1 | 2 | 3
    moves.push({ face, amount })
  }
  return moves
}
