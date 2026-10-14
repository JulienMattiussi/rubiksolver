import { tallAxis } from './camo'
import { FACE_SPEC, layerCoords } from '../../core/geometry'
import { invertMove, layerTurnsOf } from '../../core/moves'
import { applyMove, moveSlab } from '../../core/turn'
import type { Cube, Move, Vec3 } from '../../core/types'

/**
 * The Camouflage's shape alone (camo.ts), for the search that puts it back
 * in its box. Each piece is one unit high along one axis (`tallAxis`), and
 * only there does it straddle a cut, the outer layer's: its other sides
 * are thick or thin and straddle nothing. So a turn by blocks (half the
 * puzzle) always goes, and a layer alone is jammed only by a piece tall on
 * its axis, on its side. The shape is, cell by cell (the 4x4x4's, where
 * each piece stands), the tall axis of the piece there, or nothing: its
 * box follows. In the box every piece is tall on y.
 *
 * Shapes grow six-fold a turn (some 280 000 six turns from the box), so
 * the way back is searched from both ends: from the box once, a few turns
 * deep (kept), then from the shape until the two meet.
 */

const MECHANISM = [4, 4, 4] as const

/** The cells a piece can stand in (no piece stands in a 4x4x4 corner's). */
const CELLS: Vec3[] = []
for (const x of layerCoords(4)) {
  for (const y of layerCoords(4)) {
    for (const z of layerCoords(4)) {
      if ([x, y, z].some((v) => Math.abs(v) === 1)) CELLS.push([x, y, z])
    }
  }
}
const CELL = new Map(CELLS.map((c, i) => [c.join(), i]))

/** A shape: per cell, 0 if empty, else 1 + the tall axis of its piece. */
type Shape = Uint8Array

function shapeOf(cube: Cube): Shape {
  const shape = new Uint8Array(CELLS.length)
  for (const c of cube) shape[CELL.get(c.position.join())!] = 1 + tallAxis(c)
  return shape
}

/** A turn on shapes: the cells it carries (from, to), where it sends each
 *  axis, and the cells whose piece, tall on its axis, jams it. */
interface ShapeTurn {
  readonly move: Move
  readonly carry: readonly (readonly [number, number])[]
  readonly axes: readonly number[]
  readonly jam: readonly number[]
  readonly axis: number
}

let TURNS: ShapeTurn[] | undefined
function shapeTurns(): ShapeTurn[] {
  TURNS ??= (layerTurnsOf('camo') as Move[]).map((move) => {
    const axis = FACE_SPEC[move.face].coordIndex
    const slab = moveSlab(move, MECHANISM)
    const inside = (p: Vec3) => p[axis]! > slab.lo && p[axis]! < slab.hi
    const carry = CELLS.flatMap((p, i): [number, number][] => {
      if (!inside(p)) return []
      const [moved] = applyMove([{ position: p, stickers: [] }], move, MECHANISM)
      return [[i, CELL.get(moved!.position.join())!]]
    })
    // Where the turn sends each axis: a sticker turned with a cell inside.
    const cell = CELLS.find(inside)!
    const axes = [0, 1, 2].map((a) => {
      const normal = [0, 1, 2].map((d) => (d === a ? 1 : 0)) as unknown as Vec3
      const [moved] = applyMove(
        [{ position: cell, stickers: [{ normal, color: 'W' }] }],
        move,
        MECHANISM,
      )
      return moved!.stickers[0]!.normal.findIndex((v) => v !== 0)
    })
    // A layer alone has a cut at +-2 (the mechanism's): pieces tall on its
    // axis on that side straddle it. A block's only cut is the middle.
    const cut = [slab.lo, slab.hi].find((c) => Number.isFinite(c) && c !== 0)
    const jam =
      cut === undefined ? [] : CELLS.flatMap((p, i) => (p[axis] === Math.sign(cut) ? [i] : []))
    return { move, carry, axes, jam, axis }
  })
  return TURNS
}

/** The shape after a turn, or null when it is jammed. */
function turned(shape: Shape, turn: ShapeTurn): Shape | null {
  for (const i of turn.jam) if (shape[i] === 1 + turn.axis) return null
  const out = new Uint8Array(shape)
  for (const [from] of turn.carry) out[from] = 0
  for (const [from, to] of turn.carry) {
    const v = shape[from]!
    if (v) out[to] = 1 + turn.axes[v - 1]!
  }
  return out
}

const keyOf = (shape: Shape) => String.fromCharCode(...shape)
const boxed = (shape: Shape) => shape.every((v) => v === 0 || v === 2)

/** Shapes a few turns from the box: the turn each was reached by (its
 *  index), and the shape before it. */
let FROM_BOX: Map<string, { turn: number; before: string }> | undefined
function fromBox(box: Shape, depth: number) {
  if (FROM_BOX) return FROM_BOX
  const turns = shapeTurns()
  const seen = new Map([[keyOf(box), { turn: -1, before: '' }]])
  let frontier = [box]
  for (let d = 0; d < depth; d++) {
    const next: Shape[] = []
    for (const s of frontier) {
      const before = keyOf(s)
      turns.forEach((t, turn) => {
        const n = turned(s, t)
        if (!n) return
        const key = keyOf(n)
        if (seen.has(key)) return
        seen.set(key, { turn, before })
        next.push(n)
      })
    }
    frontier = next
  }
  return (FROM_BOX = seen)
}

/** Turns putting the puzzle back in its box (null past the search's
 *  reach). `box` is the solved puzzle. */
export function backToBox(cube: Cube, box: Cube, deep = 5, nodes = 600_000): Move[] | null {
  const start = shapeOf(cube)
  if (boxed(start)) return []
  const turns = shapeTurns()
  const back = fromBox(shapeOf(box), deep)
  const seen = new Map([[keyOf(start), { turn: -1, before: '' }]])
  // The way from the box to a meeting shape, played backwards.
  const home = (key: string): Move[] => {
    const path: Move[] = []
    for (let k = key; back.get(k)!.turn >= 0; k = back.get(k)!.before) {
      path.push(invertMove(turns[back.get(k)!.turn]!.move) as Move)
    }
    return path
  }
  const way = (key: string): Move[] => {
    const path: Move[] = []
    for (let k = key; seen.get(k)!.turn >= 0; k = seen.get(k)!.before) {
      path.unshift(turns[seen.get(k)!.turn]!.move)
    }
    return path
  }
  if (back.has(keyOf(start))) return home(keyOf(start))
  let frontier = [start]
  while (frontier.length && seen.size < nodes) {
    const next: Shape[] = []
    for (const s of frontier) {
      const before = keyOf(s)
      for (let turn = 0; turn < turns.length; turn++) {
        const n = turned(s, turns[turn]!)
        if (!n) continue
        const key = keyOf(n)
        if (seen.has(key)) continue
        seen.set(key, { turn, before })
        if (back.has(key)) return [...way(key), ...home(key)]
        next.push(n)
      }
    }
    frontier = next
  }
  return null
}

/** Whether a sequence can be played from the box, every turn going, and
 *  ends in the box: a formula for any state in the box (the shape alone
 *  says what goes). */
export function loopsBack(box: Cube, moves: readonly Move[]): boolean {
  const turns = shapeTurns()
  let shape: Shape | null = shapeOf(box)
  for (const move of moves) {
    const turn = turns.find((t) => sameTurn(t.move, move))
    if (!turn || !(shape = turned(shape, turn))) return false
  }
  return boxed(shape)
}

const sameTurn = (a: Move, b: Move) =>
  a.face === b.face &&
  a.amount === b.amount &&
  (a.depth ?? 1) === (b.depth ?? 1) &&
  !a.wide === !b.wide
