// First: moves.ts loads the cube before the models (they read it when loaded).
import { FACES, invertMove, SLICES } from './moves'
import { MODELS } from '../puzzles/models'
import { faceLayers } from './geometry'
import { isFaceTurn, kindOf } from './moveKind'
import type { CubeShape } from './shapes'
import type { Dims, Face, Move, Turn } from './types'

/**
 * How turns are written and read: the notations (international, French),
 * a turn as text (`formatMove`, each kind of moves its own) and text as
 * turns (`parseMove`, the cubes' face turns).
 */

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

/** How a turn's amount is written after its layer: R, R2, R'. */
export const AMOUNT_SUFFIX = { 1: '', 2: '2', 3: "'" } as const

/**
 * Human-readable notation for a move: `U`, `U2`, `U'`, `2U`, `Uw2`... Given
 * the puzzle's `dims`, the inner slice of a 3-layer axis reads as M, E or S
 * (`2L` is M, `2R` is M', which turns the same slice the other way); given
 * its shape, as its model writes it, if it does (the Fashion-V).
 */
export function formatMove(
  move: Turn,
  labels: FaceLabels = NOTATION_US,
  dims?: Dims,
  shape?: CubeShape,
): string {
  if (!isFaceTurn(move)) return kindOf(move)!.format(move, labels)
  if (move.whole) {
    // Held another way, L turns as x' does.
    const back = 'LDB'.includes(move.face)
    return ROTATION_OF[move.face] + AMOUNT_SUFFIX[back ? invertMove(move).amount : move.amount]
  }
  const own = shape && MODELS[shape]?.format
  if (own) return own(move, labels)
  if (dims && move.depth && !move.wide && faceLayers(dims, move.face) === 3) {
    const slice = SLICES.find((s) => s.face === move.face || s.opposite === move.face)!
    const amount = slice.face === move.face ? move.amount : invertMove(move).amount
    return slice.letter + AMOUNT_SUFFIX[amount]
  }
  const suffix = AMOUNT_SUFFIX[move.amount]
  // A wide turn of three layers is written 3Rw (a 6x6's), of two Rw.
  const slice = move.depth && (!move.wide || move.depth === 3) ? String(move.depth) : ''
  const wide = move.wide ? 'w' : ''
  return slice + labels[move.face] + wide + suffix
}

/** The whole puzzle's rotations, by the face they turn as: x, y, z. */
const ROTATION_OF: Record<Face, string> = { R: 'x', L: 'x', U: 'y', D: 'y', F: 'z', B: 'z' }

/** Format a sequence, space-separated. */
export function formatMoves(
  moves: readonly Turn[],
  labels: FaceLabels = NOTATION_US,
  dims?: Dims,
): string {
  return moves.map((m) => formatMove(m, labels, dims)).join(' ')
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
 * Parse a single token like `R`, `R2`, `2R'`, `Rw2`, `M'` into a Move
 * (undefined if invalid). Only the canonical spellings are accepted: a wide
 * turn is `Rw`, never `2Rw` (`3Rw` takes three layers). M, E and S are the middle slices of a 3x3.
 */
export function parseMove(token: string, labels: FaceLabels = NOTATION_US): Move | undefined {
  const rotation = /^([xyz])(2|')?$/.exec(token.trim())
  if (rotation) {
    const face = (['R', 'U', 'F'] as const)[['x', 'y', 'z'].indexOf(rotation[1]!)]!
    const amount = rotation[2] === '2' ? 2 : rotation[2] === "'" ? 3 : 1
    return { face, amount, whole: true }
  }
  let t = token.trim()
  let depth: 2 | 3 | undefined
  if (t.length > 1 && (t.startsWith('2') || t.startsWith('3'))) {
    depth = Number(t[0]) as 2 | 3
    t = t.slice(1)
  }
  const slice = depth !== undefined
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
  const middle = SLICES.find((s) => s.letter === t)
  if (middle) return slice || wide ? undefined : { face: middle.face, amount, depth: 2 }
  const face = faceOfLabel(labels, t)
  if (!face || (wide && depth === 2)) return undefined
  if (wide) return { face, amount, depth: depth ?? 2, wide: true }
  if (depth) return { face, amount, depth }
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
