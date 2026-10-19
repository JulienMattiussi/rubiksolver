import { MODELS } from '../../puzzles/models'
import { stateKey, turnDims } from '../../core/cube'
import { stickerId, tablesFor } from '../editorTables'
import { normalIndex } from '../../core/geometry'
import { layerTurnsOf } from '../../core/moves'
import { applyMove } from '../../core/turn'
import type { Color, Cube, CubeShape, Cubie } from '../../core/types'

/**
 * Entry piece by piece (a model's paint `by: 'pieces'`), for a puzzle whose
 * pieces are told apart by their shape alone: the Floppy Ghost, all silver,
 * whose thousands of forms could never be offered to pick from
 * (modes/form.ts); the Z-Twist, whose pieces show the colors of its twisted
 * sides, not a 3x3's stickers. Instead of painting stickers, one puts a
 * piece in each slot: a click on a slot moves on to the next
 * pose that fits there (another piece, or the same one lying the other way),
 * skipping pieces already placed elsewhere.
 *
 * A pose is a piece as some sequence of turns leaves it, found by turning
 * that piece alone from its home. The edit stays a map of painted stickers
 * (edit.ts): a slot holds the stickers of its pose, so everything that
 * reads an edit (from the current state, validation) works unchanged.
 */

interface Pose {
  /** The piece's look: its colors (twins, alike, share it). */
  readonly kind: string
  readonly cubie: Cubie
}

const kindOf = (cubie: Cubie) =>
  cubie.stickers
    .map((s) => s.color)
    .sort()
    .join('')

const POSES = new Map<CubeShape, ReadonlyMap<string, readonly Pose[]>>()
/** How many pieces of each kind a puzzle has (twins count twice). */
const BUDGETS = new Map<CubeShape, Map<string, number>>()

/** Every pose each slot takes, piece by piece, its home pose first. A
 *  piece's kind is its colors and the slots it reaches: twins share it, an
 *  edge and a corner of the same colors (the Floppy Ghost's) do not. */
function posesBySlot(shape: CubeShape): ReadonlyMap<string, readonly Pose[]> {
  let poses = POSES.get(shape)
  if (poses) return poses
  const budget = new Map<string, number>()
  const tables = tablesFor(shape)
  const mechanism = turnDims(shape)
  const bySlot = new Map<string, Pose[]>(tables.paintableSlots.map((s) => [s.key, []]))
  const solved = tables.slots.map((slot) => ({
    position: slot.position,
    stickers: slot.stickers.map((s) => ({ normal: s.normal, color: s.solvedColor })),
  }))
  // A pose twins share is offered once (the Hockey Puck's plain pieces).
  const offered = new Set<string>()
  solved.forEach((home, piece) => {
    if (!tables.slots[piece]!.paintable) return
    const seen = new Set([stateKey([home])])
    const queue: Cubie[] = [home]
    for (let i = 0; i < queue.length; i++) {
      const cubie = queue[i]!
      for (const turn of layerTurnsOf(shape)) {
        const [next] = applyMove([cubie], turn, mechanism)
        const key = stateKey([next!])
        if (seen.has(key)) continue
        seen.add(key)
        queue.push(next!)
      }
    }
    const kind = `${kindOf(home)}|${[...new Set(queue.map((c) => c.position.join()))].sort()}`
    budget.set(kind, (budget.get(kind) ?? 0) + 1)
    const asSeen = MODELS[shape]?.entry?.seen
    for (const cubie of queue) {
      // Only a pose as the editor shows it: a Z-Twist's thin edge one way
      // round, a Master Morphinx's small corner upright (the other ways
      // never show).
      const look = stateKey([cubie])
      const seen = !asSeen || stateKey(asSeen([cubie], (c) => c)) === look
      if (seen && !offered.has(look)) {
        offered.add(look)
        bySlot.get(cubie.position.join(','))?.push({ kind, cubie })
      }
    }
  })
  BUDGETS.set(shape, budget)
  poses = bySlot
  POSES.set(shape, poses)
  return poses
}

type Edit = Record<string, Color>

const idsOf = (cubie: Cubie) =>
  cubie.stickers.map((s) => stickerId(cubie.position, normalIndex(s.normal)))

/** The pose a slot holds in an edit, if it holds exactly one. */
function poseIn(edit: Edit, shape: CubeShape, slotKey: string): Pose | undefined {
  const painted = Object.keys(edit).filter((id) => id.startsWith(`${slotKey}:`)).length
  return posesBySlot(shape)
    .get(slotKey)
    ?.find(
      (pose) =>
        pose.cubie.stickers.length === painted &&
        pose.cubie.stickers.every((s, i) => edit[idsOf(pose.cubie)[i]!] === s.color),
    )
}

/** The edit with a slot emptied. */
function cleared(edit: Edit, slotKey: string): Edit {
  return Object.fromEntries(Object.entries(edit).filter(([id]) => !id.startsWith(`${slotKey}:`)))
}

/** Put the next pose that fits in a slot (after the one it holds), skipping
 *  the pieces all placed elsewhere; the same edit when none is left. */
export function nextPiece(edit: Edit, shape: CubeShape, slotKey: string): Edit {
  const poses = posesBySlot(shape).get(slotKey) ?? []
  const current = poseIn(edit, shape, slotKey)
  const used = new Map<string, number>()
  for (const key of posesBySlot(shape).keys()) {
    const kind = key === slotKey ? undefined : poseIn(edit, shape, key)?.kind
    if (kind) used.set(kind, (used.get(kind) ?? 0) + 1)
  }
  const start = current ? poses.indexOf(current) + 1 : 0
  for (let n = 0; n < poses.length; n++) {
    const pose = poses[(start + n) % poses.length]!
    if ((used.get(pose.kind) ?? 0) >= (BUDGETS.get(shape)!.get(pose.kind) ?? 0)) continue
    const next = cleared(edit, slotKey)
    idsOf(pose.cubie).forEach((id, i) => (next[id] = pose.cubie.stickers[i]!.color))
    return next
  }
  return edit
}

/** The piece each slot holds, or none: what the entry view draws. */
export function piecesIn(edit: Edit, shape: CubeShape): Map<string, Cubie | undefined> {
  return new Map(
    [...posesBySlot(shape).keys()].map((key) => [key, poseIn(edit, shape, key)?.cubie]),
  )
}

/** Slots holding a piece, out of those to fill. */
export function placedCount(edit: Edit, shape: CubeShape): { placed: number; total: number } {
  const pieces = [...piecesIn(edit, shape).values()]
  return { placed: pieces.filter(Boolean).length, total: pieces.length }
}

/** The puzzle an edit holds, each slot's piece as placed (undefined while
 *  a slot is empty). */
export function piecesCube(edit: Edit, shape: CubeShape): Cube | undefined {
  const pieces = piecesIn(edit, shape)
  const cube: Cubie[] = []
  for (const slot of tablesFor(shape).slots) {
    const placed = slot.paintable
      ? pieces.get(slot.key)
      : {
          position: slot.position,
          stickers: slot.stickers.map((s) => ({ normal: s.normal, color: s.solvedColor })),
        }
    if (!placed) return undefined
    cube.push(placed)
  }
  return cube
}
