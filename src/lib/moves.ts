import { faceAxis, faceLayers, quarterTurnFits } from './cube'
import { SHAPE_DIMS } from './types'
import type { CubeShape, Dims, Face, Move } from './types'

export const FACES: readonly Face[] = ['U', 'D', 'L', 'R', 'F', 'B']

/**
 * Turns a face can take, from the shape alone. A face on a one-layer axis has
 * no turn at all (its only layer is the whole puzzle, so turning it just looks
 * at the puzzle from elsewhere), and a face whose axis cannot take a quarter
 * turn is limited to half turns. On a cube this is always the three amounts.
 */
function amountsFor(dims: Dims, face: Face): readonly (1 | 2 | 3)[] {
  if (faceLayers(dims, face) < 2) return []
  return quarterTurnFits(dims, faceAxis(face)) ? [1, 2, 3] : [2]
}

/** All 18 basic face turns, in a stable order (for UI buttons and tests). */
export const ALL_MOVES: readonly Move[] = FACES.flatMap((face) =>
  ([1, 2, 3] as const).map((amount) => ({ face, amount })),
)

/**
 * How each face is labelled in a given notation. Layered moves decorate the
 * face label the same way in every notation: prefix `2` for the inner slice
 * (`2R`, FR `2D`), suffix `w` for the wide turn (`Rw`, FR `Dw`), then the
 * usual amount suffix (`2` or `'`).
 */
export type FaceLabels = Record<Face, string>

/** International (US) notation, also the internal move letters. */
export const NOTATION_US: FaceLabels = { U: 'U', D: 'D', L: 'L', R: 'R', F: 'F', B: 'B' }
/** Traditional French notation: Haut, Bas, Gauche, Droite, Face, Arrière. */
export const NOTATION_FR: FaceLabels = { U: 'H', D: 'B', L: 'G', R: 'D', F: 'F', B: 'Ar' }

/** Human-readable notation for a move: `U`, `U2`, `U'`, `2U`, `Uw2`... */
export function formatMove(move: Move, labels: FaceLabels = NOTATION_US): string {
  const suffix = move.amount === 1 ? '' : move.amount === 2 ? '2' : "'"
  const slice = move.depth && !move.wide ? '2' : ''
  const wide = move.wide ? 'w' : ''
  return slice + labels[move.face] + wide + suffix
}

/** Format a sequence, space-separated. */
export function formatMoves(moves: readonly Move[], labels: FaceLabels = NOTATION_US): string {
  return moves.map((m) => formatMove(m, labels)).join(' ')
}

/** Memoized reverse lookup of a notation's labels. */
const LABEL_FACES = new WeakMap<FaceLabels, Map<string, Face>>()
function faceOfLabel(labels: FaceLabels, label: string): Face | undefined {
  let map = LABEL_FACES.get(labels)
  if (!map) {
    map = new Map(FACES.map((f) => [labels[f], f]))
    LABEL_FACES.set(labels, map)
  }
  return map.get(label)
}

/**
 * Parse a single token like `R`, `R2`, `2R'`, `Rw2` into a Move (undefined if
 * invalid). Only the canonical spellings are accepted: a wide turn is `Rw`,
 * never `2Rw`.
 */
export function parseMove(token: string, labels: FaceLabels = NOTATION_US): Move | undefined {
  let t = token.trim()
  let slice = false
  if (t.length > 1 && t.startsWith('2')) {
    slice = true
    t = t.slice(1)
  }
  let amount: 1 | 2 | 3 = 1
  if (t.endsWith("'")) {
    amount = 3
    t = t.slice(0, -1)
  } else if (t.endsWith('2')) {
    amount = 2
    t = t.slice(0, -1)
  }
  let wide = false
  if (t.endsWith('w')) {
    wide = true
    t = t.slice(0, -1)
  }
  const face = faceOfLabel(labels, t)
  if (!face || (slice && wide)) return undefined
  if (wide) return { face, amount, depth: 2, wide: true }
  if (slice) return { face, amount, depth: 2 }
  return { face, amount }
}

/** Parse a whitespace-separated algorithm string. Skips empty tokens. */
export function parseMoves(input: string, labels: FaceLabels = NOTATION_US): Move[] {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((tok) => {
      const move = parseMove(tok, labels)
      if (!move) throw new Error(`Invalid move: "${tok}"`)
      return move
    })
}

/** The move that undoes `move` (same layers, opposite amount). */
export function invertMove(move: Move): Move {
  const amount = move.amount === 2 ? 2 : move.amount === 1 ? 3 : 1
  return { ...move, amount }
}

/** The sequence that undoes `moves` (reversed and each inverted). */
export function invertMoves(moves: readonly Move[]): Move[] {
  return [...moves].reverse().map(invertMove)
}

/**
 * Collapse trivially redundant consecutive moves of the same layers
 * (e.g. `R R` -> `R2`, `R R'` -> nothing, `R2 R2` -> nothing). Moves that
 * share a face but not their layers (`R` then `2R`) are left alone. Keeps
 * generated solutions tidy without changing what they do.
 */
export function simplifyMoves(moves: readonly Move[]): Move[] {
  const out: Move[] = []
  for (const move of moves) {
    const last = out[out.length - 1]
    if (last && last.face === move.face && last.depth === move.depth && last.wide === move.wide) {
      const total = (last.amount + move.amount) % 4
      out.pop()
      if (total !== 0) out.push({ ...move, amount: total as 1 | 2 | 3 })
    } else {
      out.push(move)
    }
  }
  return out
}

/**
 * Random scramble of `length` moves for a cube of `size`. Avoids consecutive
 * turns of the same face (they could collapse) so the length is meaningful.
 * On a 4x4 half the moves are outer turns and the rest inner slices and wide
 * turns, so centers and wing edges get shuffled too. `rng` is injectable for
 * deterministic tests; defaults to Math.random.
 */
export function scramble(shape: CubeShape, length = 25, rng: () => number = Math.random): Move[] {
  const dims = SHAPE_DIMS[shape]
  const faces = FACES.filter((face) => faceLayers(dims, face) >= 2)
  const moves: Move[] = []
  let prevFace: Face | undefined
  for (let i = 0; i < length; i++) {
    let face: Face
    do {
      face = faces[Math.floor(rng() * faces.length)]!
    } while (face === prevFace && faces.length > 1)
    prevFace = face
    const amounts = amountsFor(dims, face)
    const amount = amounts[Math.floor(rng() * amounts.length)]!
    const kind = faceLayers(dims, face) >= 4 ? rng() : 0
    if (kind < 0.5) moves.push({ face, amount })
    else if (kind < 0.75) moves.push({ face, amount, depth: 2 })
    else moves.push({ face, amount, depth: 2, wide: true })
  }
  return moves
}

/**
 * Every distinct turn available on a shape, in a stable order. Inner slices
 * and wide turns need at least four layers on the axis, so only the 4x4 has
 * them; a 1x2x3 is left with the four half turns of its two turnable axes.
 */
export function movesFor(shape: CubeShape): readonly Move[] {
  const dims = SHAPE_DIMS[shape]
  return FACES.flatMap((face) =>
    amountsFor(dims, face).flatMap((amount): Move[] =>
      faceLayers(dims, face) >= 4
        ? [
            { face, amount },
            { face, amount, depth: 2 },
            { face, amount, depth: 2, wide: true },
          ]
        : [{ face, amount }],
    ),
  )
}
