import { colorsOf, cubieAt, homesOf } from '../../core/pieces'
import { solvePieces } from '../../solve/pieceSearch'
import { mapVec, normalIndex, TET_NORMALS } from '../../core/geometry'
import { NOTATION_FR } from '../../core/moves'
import type { MoveSet } from '../../core/moveSet'
import { PYRA_CORNERS, PYRA_VERTICES } from '../../puzzles/pyramid/pyraminx'
import { parsePyraMoves } from '../../puzzles/pyramid/pyraNotation'
import { applyMoves } from '../../core/turn'
import type { Color, Cube, Cubie, PyraMove, PyraVertex, Vec3 } from '../../core/types'

/**
 * Bricks shared by the Pyraminx methods (pyraminx.ts, pyraminx4.ts, pyraminx5.ts): the
 * colors the faces take, the corners (tip and center piece, the Master's
 * co-tip) twisted into place, the formulas seen from every side.
 */

/** A fan2cube formula on a Pyraminx of `size` layers. */
export const formula =
  (size: number) =>
  (text: string): PyraMove[] =>
    parsePyraMoves(text, NOTATION_FR, size)

export const undo = (m: PyraMove): PyraMove => ({ ...m, amount: m.amount === 1 ? 2 : 1 })
const undoAll = (moves: readonly PyraMove[]): PyraMove[] => [...moves].reverse().map(undo)

/** The same formula played from another side: the puzzle turned so that its
 *  corners trade places as `to` says. */
const relabel = (moves: readonly PyraMove[], to: Record<PyraVertex, PyraVertex>): PyraMove[] =>
  moves.map((m) => ({ ...m, vertex: to[m.vertex] }))

/** The puzzle turned a third about its top: the same formula from the next side. */
export const AROUND_TOP: Record<PyraVertex, PyraVertex> = { U: 'U', L: 'R', R: 'B', B: 'L' }
/** ... and a third about its left corner. */
const AROUND_LEFT: Record<PyraVertex, PyraVertex> = { U: 'R', L: 'L', R: 'B', B: 'U' }

/** A formula from each of the three sides around the top, and each undone. */
export function aroundTop(moves: readonly PyraMove[]): PyraMove[][] {
  const sides = [
    [...moves],
    relabel(moves, AROUND_TOP),
    relabel(relabel(moves, AROUND_TOP), AROUND_TOP),
  ]
  return [...sides, ...sides.map(undoAll)]
}

/** A formula from each of the 12 ways to hold the puzzle, and each undone. */
export function fromEverySide(moves: readonly PyraMove[]): PyraMove[][] {
  const seen = new Map<string, PyraMove[]>([[JSON.stringify(moves), [...moves]]])
  let frontier = [[...moves]]
  while (frontier.length) {
    frontier = frontier.flatMap((m) =>
      [AROUND_TOP, AROUND_LEFT].flatMap((to) => {
        const turned = relabel(m, to)
        const key = JSON.stringify(turned)
        if (seen.has(key)) return []
        seen.set(key, turned)
        return [turned]
      }),
    )
  }
  const sides = [...seen.values()]
  return [...sides, ...sides.map(undoAll)]
}

/** A move set of Pyraminx turns: one per corner, both ways. */
export function pyraSet(turn: (vertex: PyraVertex) => Omit<PyraMove, 'amount'>): MoveSet {
  const turns = PYRA_VERTICES.flatMap((vertex) =>
    ([1, 2] as const).map((amount): PyraMove => ({ ...turn(vertex), amount })),
  )
  return { generators: turns.filter((t) => t.amount === 1), turns }
}

/** The searches play formulas only. */
export const FORMULAS_ONLY: MoveSet = { generators: [], turns: [] }

/** Where a corner's center piece (the Master's co-tip) sits, or its tip; on
 *  the Jing (size 2), its one corner piece, at v. */
const cornerAt = (v: PyraVertex, size: number, tip: boolean): Vec3 =>
  mapVec(PYRA_CORNERS[v], (x) => x * (size === 2 ? 1 : tip ? size - 1 : size - 2))

/**
 * The color each face (by normal index) takes. The center pieces never leave
 * their corner (on the Master, as long as no face turns, and a face turn is
 * just the whole puzzle turned with the other slices; on the Jing, its
 * corners), so they say it: the face opposite a corner wears the one color
 * its center piece lacks.
 */
export function faceColors(cube: Cube, size: number): Map<number, Color> {
  const colors = new Set(cube.flatMap((c) => c.stickers.map((s) => s.color)))
  return new Map(
    PYRA_VERTICES.map((v, i) => {
      const center = cubieAt(cube, cornerAt(v, size, false))!
      const lacking = [...colors].find((color) => !center.stickers.some((s) => s.color === color))
      return [normalIndex(TET_NORMALS[i]!), lacking!]
    }),
  )
}

export const showsFaces = (faces: Map<number, Color>) => (c: Cubie) =>
  c.stickers.every((s) => s.color === faces.get(normalIndex(s.normal)))

/** Whether every center piece (and, with `tips`, every tip) matches its faces. */
export function cornersDone(cube: Cube, size: number, tips: boolean): boolean {
  const right = showsFaces(faceColors(cube, size))
  const at = (v: PyraVertex, tip: boolean) => right(cubieAt(cube, cornerAt(v, size, tip))!)
  return PYRA_VERTICES.every((v) => at(v, false) && (!tips || at(v, true)))
}

/** Turn each corner's piece (with `turn`, its center piece's slice or its
 *  tip) until it matches its faces. */
export const alignCorners =
  (size: number, tip: boolean, turn: (vertex: PyraVertex) => Omit<PyraMove, 'amount'>) =>
  (cube: Cube): PyraMove[] => {
    const right = showsFaces(faceColors(cube, size))
    return PYRA_VERTICES.flatMap((vertex): PyraMove[] => {
      const turns = ([1, 2] as const).map((amount): PyraMove[] => [{ ...turn(vertex), amount }])
      // The piece stays at its corner, only twisting: look it up there.
      const fix = [[], ...turns].find((m) =>
        right(cubieAt(applyMoves(cube, m), cornerAt(vertex, size, tip))!),
      )
      if (!fix) throw new Error(`pyraminx: the ${vertex} corner cannot match`)
      return fix
    })
  }

/** Where a piece stands and which colors it wears, whichever way round. */
const placeOf = (c: Cubie) => `${c.position.join()}:${colorsOf(c)}`

/** Whether a piece is in the slot of its colors, whichever way round. */
const inSlot = (faces: Map<number, Color>) => (c: Cubie) =>
  c.stickers.every((s) => c.stickers.some((t) => t.color === faces.get(normalIndex(s.normal))))

/**
 * A search over the pieces `among` selects on a big Pyraminx: every one
 * home, or (`placed`) only in its slot, whichever way round (the search
 * then reads nothing else, which keeps it tiny).
 */
export const groupSolver =
  (shape: 'pyra4' | 'pyra5') =>
  (
    among: (c: Cubie) => boolean,
    moves: MoveSet,
    macros: PyraMove[][],
    maxDepth: number,
    placed = false,
  ) =>
  (cube: Cube): PyraMove[] => {
    const faces = faceColors(cube, shape === 'pyra4' ? 4 : 5)
    const right = placed ? inSlot(faces) : showsFaces(faces)
    return solvePieces<PyraMove>(cube, {
      track: homesOf(shape, among),
      among,
      moves,
      macros,
      goal: (pieces) => pieces.every(right),
      ...(placed && { key: (pieces: readonly Cubie[]) => pieces.map(placeOf).join(' ') }),
      maxDepth,
    })
  }
