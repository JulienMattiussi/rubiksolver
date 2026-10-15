import { solvedCube } from '../core/cube'
import type { Cube, CubeShape, Vec3 } from '../core/types'
import { BLOCKS } from '../puzzles/bandaged/blocks'
import { formsOfBlocks, isMark, MARK } from '../puzzles/bandaged/bonds'

/**
 * Entering a bandaged 3x3x3 (bonds.ts) whose blocks move: first where its
 * blocks are, a click on each joint between two pieces fused together,
 * checked against the forms the puzzle can take; then its colors, painted
 * as on a 3x3x3, the pieces drawn fused as the joints say. A joint is the
 * pair of places it binds, written `x,y,z|x,y,z` (in order).
 */

export type Joint = string

/** The joint between two places. */
export const jointOf = (a: readonly number[], b: readonly number[]): Joint =>
  [a.join(), b.join()].sort().join('|')

/** The joints of a state: each pair of its cubies its marks fuse. */
export function jointsOf(cube: Cube): Joint[] {
  const joints = new Set<Joint>()
  for (const c of cube) {
    for (const s of c.stickers) {
      if (isMark(s))
        joints.add(
          jointOf(
            c.position,
            c.position.map((v, i) => v + s.normal[i]!),
          ),
        )
    }
  }
  return [...joints].sort()
}

/** A state's cubies fused as `joints` say (their marks set again). */
export function withJoints(cube: Cube, joints: readonly Joint[]): Cube {
  const bound = new Map<string, Vec3[]>()
  for (const joint of joints) {
    const [a, b] = joint.split('|').map((p) => p.split(',').map(Number) as unknown as Vec3)
    bound.set(a!.join(), [...(bound.get(a!.join()) ?? []), b!])
    bound.set(b!.join(), [...(bound.get(b!.join()) ?? []), a!])
  }
  return cube.map((c) => {
    const stickers = c.stickers.filter((s) => !isMark(s))
    const marks = (bound.get(c.position.join()) ?? []).map((p) => ({
      normal: p.map((v, i) => v - c.position[i]!) as unknown as Vec3,
      color: MARK,
    }))
    return { ...c, stickers: [...stickers, ...marks] }
  })
}

interface JointTables {
  /** Every form's joints, each set written as one key. */
  readonly forms: ReadonlySet<string>
  /** The joints every form has (a 2x2x2 that never moves). */
  readonly always: readonly Joint[]
  /** The joints some form has, not all: the ones to click. */
  readonly some: readonly Joint[]
  /** The blocks the user can make, by their cells (`cellsKey`): the 2x1s
   *  and 2x2s some form has, and the 2x1s within those 2x2s (the way to
   *  them). */
  readonly blocks: ReadonlySet<string>
}

/** A set of cells, however listed. */
const cellsKey = (cells: readonly (readonly number[])[]) =>
  cells
    .map((c) => c.join())
    .sort()
    .join(' ')

const TABLES = new Map<CubeShape, JointTables>()

function tablesOf(shape: CubeShape): JointTables {
  let tables = TABLES.get(shape)
  if (!tables) {
    const forms = formsOfBlocks(solvedCube(shape)).map(jointsOf)
    const count = new Map<Joint, number>()
    for (const form of forms) for (const j of form) count.set(j, (count.get(j) ?? 0) + 1)
    const always = [...count].filter(([, n]) => n === forms.length).map(([j]) => j)
    const blocks = new Set<string>()
    for (const form of forms) {
      const pieceOf = piecesOf(form)
      for (const joint of form) {
        if (always.includes(joint)) continue
        const piece = pieceOf(joint.split('|')[0]!).map(cellOf)
        blocks.add(cellsKey(piece))
        // A 2x2 is made from a 2x1: each pair of its cells side by side.
        if (piece.length === 4) {
          for (const j of form) {
            const [a, b] = j.split('|') as [string, string]
            if (piece.some((c) => c.join() === a)) blocks.add(cellsKey([cellOf(a), cellOf(b)]))
          }
        }
      }
    }
    tables = {
      forms: new Set(forms.map((f) => f.join(' '))),
      always,
      some: [...count].filter(([, n]) => n < forms.length).map(([j]) => j),
      blocks,
    }
    TABLES.set(shape, tables)
  }
  return tables
}

/** Whether a puzzle is entered joints first: a bandaged 3x3x3 whose blocks
 *  move (one whose blocks never do has a single form, drawn as it is). */
export const entersJoints = (shape: CubeShape): boolean =>
  shape in BLOCKS && tablesOf(shape).forms.size > 1

/** The joints an entry starts with: those every form has. */
export const fixedJoints = (shape: CubeShape): readonly Joint[] => tablesOf(shape).always

/** The joints one can click: those some form has, not every one. */
export const jointsToClick = (shape: CubeShape): readonly Joint[] => tablesOf(shape).some

/** Whether entered joints are those of a form the puzzle takes. */
export const jointsFit = (shape: CubeShape, joints: readonly Joint[]): boolean =>
  tablesOf(shape).forms.has([...joints].sort().join(' '))

/** Whether a built state's blocks are where its joints were entered (its
 *  pieces' colors may say otherwise). */
export const matchesJoints = (cube: Cube, joints: readonly Joint[]): boolean =>
  jointsOf(cube).join(' ') === [...joints].sort().join(' ')

// ---------------------------------------------------------------------------
// Pieces: what the joints make, how they grow and split
// ---------------------------------------------------------------------------

const cellOf = (key: string): Vec3 => key.split(',').map(Number) as unknown as Vec3

/** The pieces `joints` make: each cell's piece (its cells' keys), a cell no
 *  joint holds standing alone. */
function piecesOf(joints: readonly Joint[]): (cell: string) => readonly string[] {
  const parent = new Map<string, string>()
  const find = (k: string): string => {
    const p = parent.get(k) ?? k
    if (p === k) return k
    const root = find(p)
    parent.set(k, root)
    return root
  }
  for (const joint of joints) {
    const [a, b] = joint.split('|') as [string, string]
    parent.set(find(a), find(b))
  }
  const members = new Map<string, string[]>()
  for (const k of new Set(joints.flatMap((j) => j.split('|')))) {
    members.set(find(k), [...(members.get(find(k)) ?? []), k])
  }
  return (cell) => members.get(find(cell)) ?? [cell]
}

/** A joint one can click: some form of the puzzle has it, or every form. */
const allowed = (shape: CubeShape) => {
  const tables = tablesOf(shape)
  const set = new Set([...tables.some, ...tables.always])
  return (joint: Joint) => set.has(joint)
}

/** Whether a piece is one the user made: none of its joints every form has
 *  (a 2x2x2 that never moves is not taken apart). */
const madeByUser = (shape: CubeShape, joints: readonly Joint[], cells: readonly string[]) => {
  const always = new Set(tablesOf(shape).always)
  return !joints.some((j) => always.has(j) && cells.includes(j.split('|')[0]!))
}

/** A joint offered: the pieces on its two sides, fused into one by `add`. */
export interface Handle {
  readonly add: readonly Joint[]
  readonly sides: readonly [readonly Vec3[], readonly Vec3[]]
}

const UNITS: readonly Vec3[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
]
const inside = (p: readonly number[]) => p.every((v) => Math.abs(v) <= 1) && p.some((v) => v !== 0)
const plus = (p: readonly number[], d: readonly number[]) =>
  p.map((v, i) => v + d[i]!) as unknown as Vec3

/**
 * The joints offered while entering a bandaged puzzle's blocks: between two
 * pieces alone (they make a 2x1), or along a 2x1's whole length, beside it
 * two pieces alone or another 2x1 (they make a 2x2). A 2x1 grows no longer,
 * a 2x2 no more; only blocks some form of the puzzle has are offered (a
 * 2x1 within a 2x2 of some form too: the way to it).
 */
export function handlesOf(shape: CubeShape, joints: readonly Joint[]): Handle[] {
  const pieceOf = piecesOf(joints)
  const ok = allowed(shape)
  const { blocks } = tablesOf(shape)
  const alone = (p: Vec3) => pieceOf(p.join()).length === 1
  const handles = new Map<string, Handle>()
  const offer = (add: Joint[], sides: [Vec3[], Vec3[]]) => {
    if (!blocks.has(cellsKey(sides.flat()))) return
    const fresh = add.filter((j) => !joints.includes(j))
    // Once per place: a 2x2 of two 2x1s is offered from either.
    const at = sides
      .flat()
      .map((p) => p.join())
      .sort()
      .join(' ')
    if (fresh.length && add.every(ok)) handles.set(at, { add: fresh, sides })
  }
  for (const k of new Set(tablesOf(shape).some.flatMap((j) => j.split('|')))) {
    const a = cellOf(k)
    const piece = pieceOf(k)
    if (piece.length === 1) {
      for (const d of UNITS) {
        const b = plus(a, d)
        if (inside(b) && alone(b) && a.join() < b.join()) offer([jointOf(a, b)], [[a], [b]])
      }
    } else if (piece.length === 2 && madeByUser(shape, joints, piece) && piece[0] === k) {
      const b = cellOf(piece[1]!)
      const along = a.findIndex((v, i) => v !== b[i])
      for (const d of UNITS.filter((u) => u[along] === 0)) {
        const [a2, b2] = [plus(a, d), plus(b, d)]
        if (!inside(a2) || !inside(b2)) continue
        const beside = pieceOf(a2.join())
        const pair = beside.length === 2 && beside.includes(b2.join())
        if (!((alone(a2) && alone(b2)) || (pair && madeByUser(shape, joints, beside)))) continue
        offer(
          [jointOf(a, a2), jointOf(b, b2), jointOf(a2, b2)],
          [
            [a, b],
            [a2, b2],
          ],
        )
      }
    }
  }
  return [...handles.values()]
}

/** Whether the piece at `cell` can be taken apart: one the user made. */
export function splits(shape: CubeShape, joints: readonly Joint[], cell: Vec3): boolean {
  const piece = piecesOf(joints)(cell.join())
  return piece.length > 1 && madeByUser(shape, joints, piece)
}

/** The joints with the piece at `cell` taken apart: a 2x1 into its two
 *  cubes, a 2x2 into two 2x1s, cut across `axis` (its cells apart along
 *  it). A piece the user did not make stays. */
export function splitAt(
  shape: CubeShape,
  joints: readonly Joint[],
  cell: Vec3,
  axis: number,
): Joint[] {
  if (!splits(shape, joints, cell)) return [...joints]
  const piece = piecesOf(joints)(cell.join())
  const cut = (j: Joint) => {
    const [a, b] = j.split('|').map(cellOf) as [Vec3, Vec3]
    return piece.includes(a.join()) && (piece.length === 2 || a[axis] !== b[axis])
  }
  return joints.filter((j) => !cut(j))
}

/** The pieces the user makes, by kind: how many 2x1s and 2x2s `joints`
 *  hold (the pieces that never move left out). */
function madeOf(shape: CubeShape, joints: readonly Joint[]): { pairs: number; squares: number } {
  const pieceOf = piecesOf(joints)
  const pieces = new Map(
    joints.map((j) => {
      const piece = pieceOf(j.split('|')[0]!)
      return [[...piece].sort().join(' '), piece] as const
    }),
  )
  const made = [...pieces.values()].filter((p) => madeByUser(shape, joints, p))
  return {
    pairs: made.filter((p) => p.length === 2).length,
    squares: made.filter((p) => p.length === 4).length,
  }
}

/** The 2x1s and 2x2s a puzzle has, and those left to make: its own (as
 *  solved) less those `joints` make, none below zero. */
export function piecesLeft(shape: CubeShape, joints: readonly Joint[]) {
  const all = madeOf(shape, jointsOf(solvedCube(shape)))
  const made = madeOf(shape, joints)
  return {
    pairs: { total: all.pairs, left: Math.max(0, all.pairs - made.pairs) },
    squares: { total: all.squares, left: Math.max(0, all.squares - made.squares) },
  }
}

/** The other cells of the tile a cell's sticker of normal `normal` is part
 *  of: its piece's cells on that face. A block's face is one tile, one
 *  color. */
export function tileMates(joints: readonly Joint[], cell: Vec3, normal: Vec3): Vec3[] {
  const axis = normal.findIndex((v) => v !== 0)
  return piecesOf(joints)(cell.join())
    .map(cellOf)
    .filter((c) => c.join() !== cell.join() && c[axis] === cell[axis])
}
