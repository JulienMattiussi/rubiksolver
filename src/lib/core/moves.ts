import { solvedCube, turnDims } from './cube'
import { MODELS } from '../puzzles/models'
import { isFaceTurn, kindOf } from './moveKind'
import { faceAxis, faceLayers, quarterTurnFits } from './geometry'
import { applyMove, turnAllowed } from './turn'
import {
  type InnerTurn,
  isGridless,
  SHAPE_ADVANCED_TURNS,
  SHAPE_INNER_TURNS,
  SHAPE_SHIFTS,
} from './shapes'
import type { Cube, Face, Move, Turn } from './types'
import type { CubeShape } from './shapes'

export const FACES: readonly Face[] = ['U', 'D', 'L', 'R', 'F', 'B']

/**
 * Middle slices of a 3-layer axis, named after the face they turn like (the
 * standard convention): M follows L, E follows D, S follows F. The same
 * letters in every notation. Internally a slice is the inner layer `2L`,
 * `2D` or `2F`, so the engine needs nothing new.
 */
export const SLICES: ReadonlyArray<{ letter: string; face: Face; opposite: Face }> = [
  { letter: 'M', face: 'L', opposite: 'R' },
  { letter: 'E', face: 'D', opposite: 'U' },
  { letter: 'S', face: 'F', opposite: 'B' },
]

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
  const own = MODELS[shape]?.amounts
  if (own) return own(face)
  return quarterTurnFits(dims, faceAxis(face)) ? [1, 2, 3] : [2]
}

/** What a turn turns: the outer face, an inner slice (2R, a 6x6's 3R) or
 *  the face with the layers behind it (Rw, a 6x6's 3Rw). */
export type LayerKind = 'outer' | InnerTurn

export function layerKindOf(move: Move): LayerKind {
  const third = move.depth === 3
  if (move.wide) return third ? 'wide3' : 'wide'
  return move.depth ? (third ? 'slice3' : 'slice') : 'outer'
}

/** The turn of `face` taking the layers `kind` names. */
export function layerMove(face: Face, amount: 1 | 2 | 3, kind: LayerKind): Move {
  const depth = kind === 'slice3' || kind === 'wide3' ? 3 : 2
  if (kind === 'outer') return { face, amount }
  return kind === 'wide' || kind === 'wide3'
    ? { face, amount, depth, wide: true }
    : { face, amount, depth }
}

type LayerVariant = Pick<Move, 'depth' | 'wide'>

/** The layers a face turn can take: its outer face, plus the inner layers
 *  the shape's mechanism turns (SHAPE_INNER_TURNS) on an axis of 3 layers
 *  or more. */
function layerVariants(shape: CubeShape, face: Face): readonly LayerVariant[] {
  const n = faceLayers(turnDims(shape), face)
  if (n < 3) return [{}]
  const own = MODELS[shape]?.layers
  if (own) return own(face)
  return [
    {},
    ...SHAPE_INNER_TURNS[shape].flatMap((kind): LayerVariant[] => {
      const { depth, wide } = layerMove('U', 1, kind)
      if (wide) return depth! < n ? [{ depth, wide }] : []
      // A slice past the middle is the opposite face's (a 4x4x5's 3R is its
      // 2L); the middle one is named once, by R, U or F.
      const middle = 2 * depth! === n + 1
      if (2 * depth! > n + 1 || (middle && !['R', 'U', 'F'].includes(face))) return []
      return [{ depth }]
    }),
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

/** Whether two moves turn the same layers (whatever their amounts). */
export function sameLayer(a: Turn, b: Turn): boolean {
  const kind = kindOf(a)
  // Of two kinds: never the same layers.
  if (kind !== kindOf(b)) return false
  if (kind) return kind.sameLayer(a, b)
  const [m, n] = [a as Move, b as Move]
  return m.face === n.face && m.depth === n.depth && m.wide === n.wide && m.whole === n.whole
}

/** The move that undoes `move` (same layers, opposite amount). */
export function invertMove(move: Move): Move {
  const amount = move.amount === 2 ? 2 : move.amount === 1 ? 3 : 1
  return { ...move, amount }
}

/** The sequence that undoes `moves` (reversed and each inverted). */
export function invertMoves<T extends Turn>(moves: readonly T[]): T[] {
  return [...moves]
    .reverse()
    .map((m) => (isFaceTurn(m) ? invertMove(m) : kindOf(m)!.invert(m)) as T)
}

/**
 * Collapse trivially redundant consecutive moves of the same layers
 * (e.g. `R R` -> `R2`, `R R'` -> nothing, `R2 R2` -> nothing). Moves that
 * share a face but not their layers (`R` then `2R`) are left alone. Keeps
 * generated solutions tidy without changing what they do.
 */
export function simplifyMoves<T extends Turn>(moves: readonly T[]): T[] {
  // A list holding another kind's moves: that kind's (it may mix in face
  // turns, as the Gear Cube Extreme does).
  const kind = moves.map(kindOf).find((k) => k)
  if (kind) return kind.simplify(moves) as T[]
  return simplifyCubeMoves(moves as readonly Move[]) as T[]
}

/** Face turns merged, those of the same layers in a row (R R -> R2). */
export function simplifyCubeMoves(moves: readonly Move[]): Move[] {
  const out: Move[] = []
  for (const move of moves) {
    const last = out[out.length - 1]
    if (last && sameLayer(last, move)) {
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
    // the one left (the Purple often jams all others).
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

/** A scramble of any puzzle, face moves or its own turns (its model's
 *  scramble: a star prism's, the Pyraminx's, the Floppy Ghost's...). */
export function scrambleTurns(
  shape: CubeShape,
  length: number,
  rng: () => number,
  start: Cube,
): Turn[] {
  const own = MODELS[shape]?.scramble
  if (own) return own(length, rng, start)
  return scramble(shape, length, rng, start)
}

/** One turn of every layer a puzzle has, gridless ones included: what moves
 *  or turns its pieces at all (the editor's fixed pieces). */
export function layerTurnsOf(shape: CubeShape): readonly Turn[] {
  const own = MODELS[shape]?.turns
  if (own) return own()
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
