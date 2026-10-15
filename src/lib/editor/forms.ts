import { cubeShape, isBoxed, solvedCube, turnDims } from '../core/cube'
import { gearsAligned } from '../puzzles/gear/gear'
import { AXIS_ROTATIONS, normalIndex } from '../core/geometry'
import { layerTurnsOf } from '../core/moves'
import { applyMove, turnAllowed } from '../core/turn'
import { SHAPE_SHIFTS, type Cube, type CubeShape } from '../core/types'

/**
 * The forms a shape-shifting puzzle takes (the 2x2x4 tower), for the editor:
 * one enters such a puzzle as it physically stands, so its form is chosen
 * first, then its colors painted on it.
 *
 * A form is what the puzzle looks like with its colors erased: where its
 * pieces stand, and which of their faces bear a sticker. Every form reached
 * from the box is found by a breadth-first search over forms alone (the
 * tower's 2187), then forms that differ only by how the puzzle is held (a
 * whole-puzzle rotation, mirrors left apart: they are other forms) are
 * merged: 102 for the tower. Each keeps the first state that reached it.
 * They come sorted by how many pieces stick out alone (`tips`: a piece
 * touching at most one other), what one sees first on a deformed puzzle,
 * then by how many turns they lie from the box.
 */

export interface Form {
  /** A state of that form (its colors are whatever reached it first). */
  readonly cube: Cube
  /** Turns from the box. */
  readonly distance: number
  /** Pieces sticking out alone: touching at most one other piece. */
  readonly tips: number
}

/** How many pieces of a state touch at most one other (face to face, on
 *  the mechanism's grid). */
function tipsOf(cube: Cube, shape: CubeShape): number {
  const steps = turnDims(shape).map((n) => (n % 2 === 0 ? 2 : 1))
  const cells = new Set(cube.map((c) => c.position.join()))
  return cube.filter((c) => {
    let touching = 0
    for (let a = 0; a < 3; a++) {
      for (const side of [-1, 1]) {
        const next = c.position.map((v, b) => (b === a ? v + side * steps[a]! : v))
        if (cells.has(next.join())) touching++
      }
    }
    return touching <= 1
  }).length
}

/** A state with its colors erased, independent of how its pieces are listed. */
export function lookOf(cube: Cube): string {
  return cube
    .map(
      (c) =>
        `${c.position.join()}:${c.stickers
          .map((s) => normalIndex(s.normal))
          .sort((a, b) => a - b)
          .join('.')}`,
    )
    .sort()
    .join(' ')
}

/** The look of a state however the puzzle is held: the least of its turns. */
function heldLook(cube: Cube): string {
  let least = ''
  for (const turn of AXIS_ROTATIONS) {
    const look = lookOf(
      cube.map((c) => ({
        position: turn(c.position),
        stickers: c.stickers.map((s) => ({ normal: turn(s.normal), color: s.color })),
      })),
    )
    if (!least || look < least) least = look
  }
  return least
}

const FORMS = new Map<CubeShape, readonly Form[]>()

/** Shape-shifting puzzles with too many forms to offer (the Camouflage's,
 *  hundreds of thousands): entered in their box only. */
const BOX_ONLY: readonly CubeShape[] = ['camo']

/** Why a state cannot be entered as it stands ("from the current state"),
 *  if so: a Gear Cube's gears askew, a puzzle entered in its box out of it. */
export function notEnterable(cube: Cube): 'gears' | 'box' | null {
  if (!gearsAligned(cube)) return 'gears'
  return BOX_ONLY.includes(cubeShape(cube)) && !isBoxed(cube) ? 'box' : null
}

/** The forms of a shape, the box first, then by tips and distance; a
 *  puzzle that keeps its box (or is entered in it) has that one only. */
export function formsOf(shape: CubeShape): readonly Form[] {
  let forms = FORMS.get(shape)
  if (forms) return forms
  const solved = solvedCube(shape)
  // The Fashion-V's, millions, are entered cell by cell (cutsEditor.ts).
  if (!SHAPE_SHIFTS[shape] || BOX_ONLY.includes(shape) || shape === 'fashion') {
    forms = [{ cube: solved, distance: 0, tips: 0 }]
  } else {
    const turns = layerTurnsOf(shape)
    const seen = new Set([lookOf(solved)])
    const held = new Map<string, Form>([
      [heldLook(solved), { cube: solved, distance: 0, tips: tipsOf(solved, shape) }],
    ])
    let frontier = [solved]
    for (let distance = 1; frontier.length; distance++) {
      const next: Cube[] = []
      for (const state of frontier) {
        for (const turn of turns) {
          if (!turnAllowed(state, turn)) continue
          const cube = applyMove(state, turn)
          const look = lookOf(cube)
          if (seen.has(look)) continue
          seen.add(look)
          next.push(cube)
          const key = heldLook(cube)
          if (!held.has(key)) held.set(key, { cube, distance, tips: tipsOf(cube, shape) })
        }
      }
      frontier = next
    }
    // A stable sort: by distance within the same number of tips.
    forms = [...held.values()].sort((a, b) => a.tips - b.tips)
  }
  FORMS.set(shape, forms)
  return forms
}

/** The form a state stands in, for the editor: none when it is its puzzle's
 *  original one (the box), or when it never shifts (its hidden marks, the
 *  RoadBlock-I's, turn with it). */
export function formOf(cube: Cube): Cube | undefined {
  const shape = cubeShape(cube)
  return !SHAPE_SHIFTS[shape] || lookOf(cube) === lookOf(solvedCube(shape)) ? undefined : cube
}
