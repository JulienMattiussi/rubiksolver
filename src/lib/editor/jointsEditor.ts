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
}

const TABLES = new Map<CubeShape, JointTables>()

function tablesOf(shape: CubeShape): JointTables {
  let tables = TABLES.get(shape)
  if (!tables) {
    const forms = formsOfBlocks(solvedCube(shape)).map(jointsOf)
    const count = new Map<Joint, number>()
    for (const form of forms) for (const j of form) count.set(j, (count.get(j) ?? 0) + 1)
    tables = {
      forms: new Set(forms.map((f) => f.join(' '))),
      always: [...count].filter(([, n]) => n === forms.length).map(([j]) => j),
      some: [...count].filter(([, n]) => n < forms.length).map(([j]) => j),
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
