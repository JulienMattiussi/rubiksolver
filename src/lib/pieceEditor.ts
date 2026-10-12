import { stateKey, turnDims } from './cube'
import { stickerId, tablesFor } from './editorTables'
import { normalIndex } from './geometry'
import { layerTurnsOf } from './moves'
import { applyMove } from './turn'
import type { Color, Cube, CubeShape, Cubie } from './types'

/**
 * Piece-by-piece entry, for a puzzle whose pieces are told apart by their
 * shape alone: the Floppy Ghost, all silver, whose thousands of forms could
 * never be offered to pick from (forms.ts). Instead of painting stickers,
 * one puts a piece in each slot: a click on a slot moves on to the next
 * pose that fits there (another piece, or the same one lying the other way),
 * skipping pieces already placed elsewhere.
 *
 * A pose is a piece as some sequence of turns leaves it, found by turning
 * that piece alone from its home. The edit stays a map of painted stickers
 * (editor.ts): a slot holds the stickers of its pose, so everything that
 * reads an edit (from the current state, validation) works unchanged.
 */

/** Whether a shape is entered piece by piece rather than painted. */
export const entersByPieces = (shape: CubeShape): boolean => shape === 'ghost'

interface Pose {
  /** The piece's index in the solved puzzle: its identity. */
  readonly piece: number
  readonly cubie: Cubie
}

const POSES = new Map<CubeShape, ReadonlyMap<string, readonly Pose[]>>()

/** Every pose each slot takes, piece by piece, its home pose first. */
function posesBySlot(shape: CubeShape): ReadonlyMap<string, readonly Pose[]> {
  let poses = POSES.get(shape)
  if (poses) return poses
  const tables = tablesFor(shape)
  const mechanism = turnDims(shape)
  const bySlot = new Map<string, Pose[]>(tables.paintableSlots.map((s) => [s.key, []]))
  const solved = tables.slots.map((slot) => ({
    position: slot.position,
    stickers: slot.stickers.map((s) => ({ normal: s.normal, color: s.solvedColor })),
  }))
  solved.forEach((home, piece) => {
    if (!tables.slots[piece]!.paintable) return
    const seen = new Set([stateKey([home])])
    const queue: Cubie[] = [home]
    for (let i = 0; i < queue.length; i++) {
      const cubie = queue[i]!
      bySlot.get(cubie.position.join(','))?.push({ piece, cubie })
      for (const turn of layerTurnsOf(shape)) {
        const [next] = applyMove([cubie], turn, mechanism)
        const key = stateKey([next!])
        if (seen.has(key)) continue
        seen.add(key)
        queue.push(next!)
      }
    }
  })
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
 *  the pieces placed elsewhere; the same edit when none is left. */
export function nextPiece(edit: Edit, shape: CubeShape, slotKey: string): Edit {
  const poses = posesBySlot(shape).get(slotKey) ?? []
  const current = poseIn(edit, shape, slotKey)
  const used = new Set(
    [...posesBySlot(shape).keys()]
      .filter((key) => key !== slotKey)
      .flatMap((key) => poseIn(edit, shape, key)?.piece ?? []),
  )
  const start = current ? poses.indexOf(current) + 1 : 0
  for (let n = 0; n < poses.length; n++) {
    const pose = poses[(start + n) % poses.length]!
    if (used.has(pose.piece)) continue
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
