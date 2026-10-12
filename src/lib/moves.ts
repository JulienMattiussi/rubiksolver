import { scrambleViolet } from './violetScramble'
import { solvedCube, turnDims } from './cube'
import { faceAxis, faceLayers, quarterTurnFits } from './geometry'
import { applyMove, turnAllowed } from './turn'
import {
  invertPyraMove,
  pyraTurnsOf,
  samePyraLayer,
  scramblePyraminx,
  simplifyPyraMoves,
} from './pyraminx'
import { formatPyraMove } from './pyraNotation'
import { formatGhostMove, GHOST_TURNS, scrambleGhost, simplifyGhostMoves } from './ghost'
import {
  formatRainbowMove,
  invertRainbowMove,
  RAINBOW_TURNS,
  scrambleRainbow,
  simplifyRainbowMoves,
} from './rainbow'
import { formatStarMove, invertStarMove, scrambleStar, simplifyStarMoves, STAR_RINGS } from './star'
import {
  isGhostMove,
  isGridless,
  isRainbowMove,
  isPyraMove,
  isPyraminx,
  isStar,
  isStarMove,
  SHAPE_ADVANCED_TURNS,
  SHAPE_INNER_TURNS,
  SHAPE_SHIFTS,
} from './types'
import type {
  Cube,
  CubeShape,
  Dims,
  Face,
  GhostMove,
  Move,
  PyraMove,
  RainbowMove,
  StarMove,
  Turn,
} from './types'

export const FACES: readonly Face[] = ['U', 'D', 'L', 'R', 'F', 'B']

/**
 * Turns a face can take, from the shape alone (the mechanism's, see
 * `turnDims`: a tower turns like a 4x4x4).
 *
 * A face on a one-layer axis has no turn at all: its only layer is the whole
 * puzzle, so turning it just looks at the puzzle from elsewhere. A quarter
 * turn needs the two other dimensions to be equal, otherwise the slab does not
 * land back in the box; a shape-shifting puzzle's mechanism is a cube, so it
 * always has them. Everything else is limited to half turns.
 */
export function amountsFor(shape: CubeShape, face: Face): readonly (1 | 2 | 3)[] {
  const dims = turnDims(shape)
  if (faceLayers(dims, face) < 2) return []
  return quarterTurnFits(dims, faceAxis(face)) ? [1, 2, 3] : [2]
}

/** What a turn turns: the outer face, the inner slice (2R) or both (Rw). */
export type LayerKind = 'outer' | 'slice' | 'wide'

export function layerKindOf(move: Move): LayerKind {
  return move.wide ? 'wide' : move.depth ? 'slice' : 'outer'
}

type LayerVariant = Pick<Move, 'depth' | 'wide'>

/** The layers a face turn can take: its outer face, plus the inner layers
 *  the shape's mechanism turns (SHAPE_INNER_TURNS) on an axis of 3 layers
 *  or more. */
function layerVariants(shape: CubeShape, face: Face): readonly LayerVariant[] {
  if (faceLayers(turnDims(shape), face) < 3) return [{}]
  return [
    {},
    ...SHAPE_INNER_TURNS[shape].map((kind): LayerVariant =>
      kind === 'wide' ? { depth: 2, wide: true } : { depth: 2 },
    ),
  ]
}

/**
 * The shape's advanced turns (SHAPE_ADVANCED_TURNS), every amount: the wide
 * turn of each face, and each middle slice once, by the face it follows (M
 * by L, E by D, S by F: `2R` is just M').
 */
export function advancedMovesFor(shape: CubeShape): readonly Move[] {
  const dims = turnDims(shape)
  const kinds = SHAPE_ADVANCED_TURNS[shape]
  return (['slice', 'wide'] as const)
    .filter((kind) => kinds.includes(kind))
    .flatMap((kind) =>
      (kind === 'wide' ? FACES : SLICES.map((s) => s.face))
        .filter((face) => faceLayers(dims, face) >= 3)
        .flatMap((face) =>
          amountsFor(shape, face).map((amount): Move =>
            kind === 'wide' ? { face, amount, depth: 2, wide: true } : { face, amount, depth: 2 },
          ),
        ),
    )
}

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

/**
 * Middle slices of a 3-layer axis, named after the face they turn like (the
 * standard convention): M follows L, E follows D, S follows F. The same
 * letters in every notation. Internally a slice is the inner layer `2L`,
 * `2D` or `2F`, so the engine needs nothing new.
 */
const SLICES: ReadonlyArray<{ letter: string; face: Face; opposite: Face }> = [
  { letter: 'M', face: 'L', opposite: 'R' },
  { letter: 'E', face: 'D', opposite: 'U' },
  { letter: 'S', face: 'F', opposite: 'B' },
]

const AMOUNT_SUFFIX = { 1: '', 2: '2', 3: "'" } as const

/**
 * Human-readable notation for a move: `U`, `U2`, `U'`, `2U`, `Uw2`... Given
 * the puzzle's `dims`, the inner slice of a 3-layer axis reads as M, E or S
 * (`2L` is M, `2R` is M', which turns the same slice the other way).
 */
export function formatMove(move: Turn, labels: FaceLabels = NOTATION_US, dims?: Dims): string {
  if (isStarMove(move)) return formatStarMove(move, labels)
  if (isPyraMove(move)) return formatPyraMove(move, labels)
  if (isGhostMove(move)) return formatGhostMove(move, labels)
  if (isRainbowMove(move)) return formatRainbowMove(move, labels)
  if (dims && move.depth && !move.wide && faceLayers(dims, move.face) === 3) {
    const slice = SLICES.find((s) => s.face === move.face || s.opposite === move.face)!
    const amount = slice.face === move.face ? move.amount : invertMove(move).amount
    return slice.letter + AMOUNT_SUFFIX[amount]
  }
  const suffix = AMOUNT_SUFFIX[move.amount]
  const slice = move.depth && !move.wide ? String(move.depth) : ''
  const wide = move.wide ? 'w' : ''
  return slice + labels[move.face] + wide + suffix
}

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
 * turn is `Rw`, never `2Rw`. M, E and S are the middle slices of a 3x3.
 */
export function parseMove(token: string, labels: FaceLabels = NOTATION_US): Move | undefined {
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
  if (!face || (slice && wide)) return undefined
  if (wide) return { face, amount, depth: 2, wide: true }
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

/** Whether two moves turn the same layers (whatever their amounts). */
export function sameLayer(a: Turn, b: Turn): boolean {
  if (isStarMove(a) || isStarMove(b)) {
    if (!isStarMove(a) || !isStarMove(b)) return false
    return 'ring' in a && 'ring' in b ? a.ring === b.ring : 'slash' in a && 'slash' in b
  }
  if (isPyraMove(a) || isPyraMove(b)) return isPyraMove(a) && isPyraMove(b) && samePyraLayer(a, b)
  if (isGhostMove(a) || isGhostMove(b)) return isGhostMove(a) && isGhostMove(b) && a.side === b.side
  if (isRainbowMove(a) || isRainbowMove(b)) {
    return isRainbowMove(a) && isRainbowMove(b) && a.triangle === b.triangle
  }
  return a.face === b.face && a.depth === b.depth && a.wide === b.wide
}

/** The move that undoes `move` (same layers, opposite amount). */
export function invertMove(move: Move): Move {
  const amount = move.amount === 2 ? 2 : move.amount === 1 ? 3 : 1
  return { ...move, amount }
}

/** The sequence that undoes `moves` (reversed and each inverted). */
export function invertMoves<T extends Turn>(moves: readonly T[]): T[] {
  return [...moves].reverse().map(
    (m) =>
      (isStarMove(m)
        ? invertStarMove(m)
        : isPyraMove(m)
          ? invertPyraMove(m)
          : isGhostMove(m)
            ? m // a half turn
            : isRainbowMove(m)
              ? invertRainbowMove(m)
              : invertMove(m)) as T,
  )
}

/**
 * Collapse trivially redundant consecutive moves of the same layers
 * (e.g. `R R` -> `R2`, `R R'` -> nothing, `R2 R2` -> nothing). Moves that
 * share a face but not their layers (`R` then `2R`) are left alone. Keeps
 * generated solutions tidy without changing what they do.
 */
export function simplifyMoves<T extends Turn>(moves: readonly T[]): T[] {
  if (moves.some(isStarMove)) return simplifyStarMoves(moves as readonly StarMove[]) as T[]
  if (moves.some(isPyraMove)) return simplifyPyraMoves(moves as readonly PyraMove[]) as T[]
  if (moves.some(isGhostMove)) return simplifyGhostMoves(moves as readonly GhostMove[]) as T[]
  if (moves.some(isRainbowMove)) {
    return simplifyRainbowMoves(moves as readonly RainbowMove[]) as T[]
  }
  const out: Move[] = []
  for (const move of moves as readonly Move[]) {
    const last = out[out.length - 1]
    if (last && sameLayer(last, move)) {
      const total = (last.amount + move.amount) % 4
      out.pop()
      if (total !== 0) out.push({ ...move, amount: total as 1 | 2 | 3 })
    } else {
      out.push(move)
    }
  }
  return out as T[]
}

/**
 * Random scramble of `length` moves for `shape`, played from `start`. Avoids
 * consecutive turns of the same face (they could collapse) so the length is
 * meaningful. Half the moves are outer turns, the rest shared by the other
 * layer variants (slices and wide turns on a 4x4, wide turns on a tower), so
 * centers and wings get shuffled too. A tower only draws turns it can make
 * from where it stands. `rng` is injectable for deterministic tests.
 */
export function scramble(
  shape: CubeShape,
  length = 25,
  rng: () => number = Math.random,
  start: Cube = solvedCube(shape),
): Move[] {
  if (isGridless(shape)) throw new Error(`scramble: ${shape} has no face layers, see scrambleTurns`)
  const faces = FACES.filter((face) => amountsFor(shape, face).length > 0)
  // A shape-shifting puzzle jams some turns once out of its box, so its
  // scramble plays along from `start` and only draws turns it can make.
  const shifts = SHAPE_SHIFTS[shape]
  let state = start
  const moves: Move[] = []
  let prevFace: Face | undefined
  while (moves.length < length) {
    // Another face than the last one, among those that can turn (all of
    // them, on a puzzle that keeps its box); the same again only when it is
    // the one left (the Violet often jams all others).
    const turnable = shifts
      ? faces.filter((f) =>
          layerVariants(shape, f).some((variant) =>
            turnAllowed(state, { face: f, amount: amountsFor(shape, f)[0]!, ...variant }),
          ),
        )
      : faces
    const others = turnable.filter((f) => f !== prevFace)
    const choices = others.length > 0 ? others : turnable
    const face = choices[Math.floor(rng() * choices.length)]!
    const amounts = amountsFor(shape, face)
    const amount = amounts[Math.floor(rng() * amounts.length)]!
    // Half outer turns, the rest shared by the other layer variants.
    const variants = layerVariants(shape, face)
    const roll = variants.length > 1 ? rng() : 0
    const variant =
      roll < 0.5
        ? variants[0]!
        : variants[1 + Math.floor((roll - 0.5) * 2 * (variants.length - 1))]!
    const move: Move = { face, amount, ...variant }
    if (shifts) {
      if (!turnAllowed(state, move)) continue
      state = applyMove(state, move)
    }
    prevFace = face
    moves.push(move)
  }
  return moves
}

/** A scramble of any puzzle, face moves or a star prism's, the Pyraminx's
 *  or the Floppy Ghost's turns (the store's). */
export function scrambleTurns(
  shape: CubeShape,
  length: number,
  rng: () => number,
  start: Cube,
): Turn[] {
  if (isStar(shape)) return scrambleStar(shape, length, rng)
  if (isPyraminx(shape)) return scramblePyraminx(shape, length, rng)
  if (shape === 'ghost') return scrambleGhost(length, rng)
  if (shape === 'rainbow') return scrambleRainbow(length, rng)
  if (shape === 'violet') return scrambleViolet(length, rng, start)
  return scramble(shape, length, rng, start)
}

/** One turn of every layer a puzzle has, gridless ones included: what moves
 *  or turns its pieces at all (the editor's fixed pieces). */
export function layerTurnsOf(shape: CubeShape): readonly Turn[] {
  if (isStar(shape)) {
    return [...STAR_RINGS[shape].map((ring) => ({ ring, amount: 1 as const })), { slash: true }]
  }
  if (isPyraminx(shape)) return pyraTurnsOf(shape)
  if (shape === 'ghost') return GHOST_TURNS
  if (shape === 'rainbow') return RAINBOW_TURNS
  return movesFor(shape)
}

/**
 * Every distinct turn available on a shape, in a stable order. Inner slices
 * and wide turns need at least four layers on the axis (the 4x4, and the
 * tower's 4x4x4 mechanism, which only keeps the wide ones); a 1x2x3 is left
 * with the four half turns of its two turnable axes. On a shape-shifting
 * puzzle some of these jam depending on the state (`turnAllowed`).
 */
export function movesFor(shape: CubeShape): readonly Move[] {
  if (isGridless(shape)) return [] // it turns in its own way (star.ts, pyraminx.ts, ghost.ts)
  return FACES.flatMap((face) =>
    amountsFor(shape, face).flatMap((amount) =>
      layerVariants(shape, face).map((variant): Move => ({ face, amount, ...variant })),
    ),
  )
}
