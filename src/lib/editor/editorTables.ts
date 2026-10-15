import { cubeOrientations, solvedCube } from '../core/cube'
import { MODELS } from '../puzzles/models'
import { lookOf } from './forms'
import { AXIS_ROTATIONS, normalIndex, vecKey } from '../core/geometry'
import { layerTurnsOf } from '../core/moves'
import { applyMove } from '../core/turn'
import {
  isGear,
  isStar,
  SHAPE_SHIFTS,
  type Color,
  type Cube,
  type CubeShape,
  type Cubie,
  type Vec3,
} from '../core/types'

/**
 * Slot and placement tables backing the guided editor (see editor.ts).
 * Everything here is derived per cube shape from that shape's solved cube and
 * memoized: the fixed slots, every valid piece placement per slot (from the
 * whole-puzzle orientations), and the physical-piece budgets.
 *
 * A shape-shifting puzzle is entered in the form it stands in (forms.ts):
 * its slots are then that form's, and a slot takes any piece of its kind
 * turned so its stickers face the slot's (no whole-puzzle orientation puts a
 * piece there, the box being broken); validation tells the reachable ones.
 */

export const stickerId = (p: Vec3, ni: number): string => `${vecKey(p)}:${ni}`

type SlotKind = 'corner' | 'edge' | 'center' | 'core'

interface SlotSticker {
  readonly ni: number
  readonly normal: Vec3
  readonly id: string
  readonly solvedColor: Color
  /** Never seen nor clicked: the editor fills it in itself (see `hiddenSticker`). */
  readonly hidden: boolean
}

export interface Slot {
  readonly key: string
  readonly position: Vec3
  readonly kind: SlotKind
  readonly stickers: readonly SlotSticker[]
  /** The user paints it: a piece with stickers that some turn can move or
   *  turn over. A fixed one (a 3x3 center) stays pre-filled. */
  readonly paintable: boolean
}

/** Three stickers or more (a 1x2x3 piece can show four) is a corner: a unique
 *  piece with an orientation. Two is an edge, one an interchangeable center. */
function kindOf(stickerCount: number): SlotKind {
  return stickerCount >= 3
    ? 'corner'
    : stickerCount === 2
      ? 'edge'
      : stickerCount === 1
        ? 'center'
        : 'core'
}

/** The face of a 4-star inner point that faces up or down: covered by the
 *  outer layer, it only records which way up the piece sits (star.ts), so
 *  painting its two sides fills it in. */
function hiddenSticker(shape: CubeShape, position: Vec3, normal: Vec3): boolean {
  return isStar(shape) && Math.abs(position[1]) === 1 && normal[1] !== 0
}

/** The solved puzzle the editor works on, as it shows it: without the
 *  RoadBlock-I's bars' marks (it is entered at START, its bars as solved),
 *  nor a bandaged puzzle's. */
function entrySolved(shape: CubeShape): Cube {
  const seen = MODELS[shape]?.entry?.seen
  return seen ? seen(solvedCube(shape), (c) => c) : solvedCube(shape)
}

/** A cubie of a solved cube as a slot (fixed position + exterior normals). */
function toSlot(shape: CubeShape, cubie: Cubie, fixed: boolean): Slot {
  return {
    key: vecKey(cubie.position),
    position: cubie.position,
    kind: kindOf(cubie.stickers.length),
    paintable: cubie.stickers.length > 0 && !fixed,
    stickers: cubie.stickers.map((s) => ({
      ni: normalIndex(s.normal),
      normal: s.normal,
      id: stickerId(cubie.position, normalIndex(s.normal)),
      solvedColor: s.color,
      hidden: hiddenSticker(shape, cubie.position, s.normal),
    })),
  }
}

/** A placement maps each of a slot's normal indices to a color. */
export type Placement = Record<number, Color>

/** A placement plus the identity of the physical piece it corresponds to. */
export interface PlacementOption {
  readonly colors: Placement
  /** 'P:<solved position>' for unique pieces, 'C:<color>' for centers. */
  readonly pieceKey: string
}

/**
 * Indices of the solved cubies no turn ever moves nor turns over: each keeps
 * its position and the normals of its stickers. The 3x3's centers (which only
 * spin), the Domino's, the Floppy's, a star prism's left screw half (the
 * slash only turns the right one); never a 4x4 center, nor a Floppy edge
 * (a half turn flips it in place). A Gear Cube's centers too: its slices
 * move them, but always as a whole (a slice's quarter turn turns all six
 * about its axis), so holding the cube right puts them home, as the editor
 * does (`withFixedHome`).
 */
function fixedPieces(shape: CubeShape): Set<number> {
  const solved = entrySolved(shape)
  // (Not the Extreme's: its slices move its centers off the top and bottom,
  // which its middle layer, never moving, holds where they are.)
  if (isGear(shape) && shape !== 'gearX') {
    return new Set([...solved.keys()].filter((i) => solved[i]!.stickers.length === 1))
  }
  // Turns keep the sticker order, so each sticker's normal can be compared.
  const fixed = new Set(solved.keys())
  for (const move of layerTurnsOf(shape)) {
    applyMove(solved, move).forEach((c, i) => {
      if (pose(c) !== pose(solved[i]!)) fixed.delete(i)
    })
  }
  return fixed
}

export interface SlotTables {
  readonly slots: readonly Slot[]
  /** Slots the user can paint (see `Slot.paintable`). */
  readonly paintableSlots: readonly Slot[]
  readonly byKey: ReadonlyMap<string, Slot>
  /** Valid piece placements per slot key, from the solved puzzle's orientations. */
  readonly placements: ReadonlyMap<string, readonly PlacementOption[]>
  /** Physical pieces available per pieceKey (1 each, 4 per center color). */
  readonly budgets: ReadonlyMap<string, number>
}

const TABLES = new Map<string, SlotTables>()

/** Slot + placement tables of a cube shape, derived from its solved cube, or
 *  of one of its forms (a state of it: its colors are not read). */
export function tablesFor(shape: CubeShape, form?: Cube): SlotTables {
  const solved = entrySolved(shape)
  const look = form ? lookOf(form) : ''
  const boxed = !form || look === lookOf(solved)
  const key = boxed ? shape : `${shape}|${look}`
  let tables = TABLES.get(key)
  if (!tables) {
    const fixed = fixedPieces(shape)
    const fixedPoses = new Set([...fixed].map((i) => pose(solved[i]!)))
    const slots = boxed
      ? solved.map((c, i) => toSlot(shape, c, fixed.has(i)))
      : form.map((c) => toSlot(shape, c, fixedPoses.has(pose(c))))
    const paintableSlots = slots.filter((s) => s.paintable)
    tables = {
      slots,
      paintableSlots,
      byKey: new Map(slots.map((s) => [s.key, s])),
      // A puzzle that shifts can come back to its box with pieces turned in
      // place (the Purple's minis): any turn of a piece, the check after.
      placements:
        boxed && !SHAPE_SHIFTS[shape]
          ? computePlacements(shape, paintableSlots)
          : turnedPlacements(shape, paintableSlots, fixed),
      budgets: computeBudgets(shape, fixed),
    }
    TABLES.set(key, tables)
  }
  return tables
}

/** Where a piece stands and where its stickers face, in order. */
const pose = (c: Cubie) => [c.position, ...c.stickers.map((s) => s.normal)].join('|')

/**
 * Placements in a form's slots: every piece (but the fixed ones) turned by
 * any whole-cube rotation that lays its stickers on the slot's faces. Each
 * keeps its identity, as `computePlacements` does.
 */
function turnedPlacements(
  shape: CubeShape,
  paintableSlots: readonly Slot[],
  fixed: Set<number>,
): Map<string, PlacementOption[]> {
  const solved = entrySolved(shape)
  return new Map(
    paintableSlots.map((slot) => {
      const faces = slot.stickers
        .map((s) => s.ni)
        .sort((a, b) => a - b)
        .join()
      const options = new Map<string, PlacementOption>()
      solved.forEach((cubie, i) => {
        if (fixed.has(i) || cubie.stickers.length !== slot.stickers.length) return
        if (parities(cubie.position) !== parities(slot.position)) return
        for (const turn of AXIS_ROTATIONS) {
          const colors: Placement = {}
          for (const s of cubie.stickers) colors[normalIndex(turn(s.normal))] = s.color
          const turnedFaces = Object.keys(colors)
            .map(Number)
            .sort((a, b) => a - b)
            .join()
          if (turnedFaces !== faces) continue
          options.set(`${placementKey(colors)}|${i}`, {
            colors,
            pieceKey: pieceKeyOf(cubie, cubie.position),
          })
        }
      })
      return [slot.key, [...options.values()]]
    }),
  )
}

/** The parities of a position's coordinates, in any order: no turn changes
 *  them, so a piece only ever reaches slots that share them (the Purple's
 *  big cubes, on odd coordinates, never stand where a mini does). */
const parities = (p: readonly number[]) =>
  p
    .map((v) => Math.abs(v) % 2)
    .sort()
    .join()

function placementKey(p: Placement): string {
  return Object.keys(p)
    .map(Number)
    .sort((a, b) => a - b)
    .map((ni) => ni + p[ni]!)
    .join('')
}

/** Identity of the physical piece a solved-cube cubie is. One-sticker
 *  pieces of one color are interchangeable, within their kind, told by
 *  their coordinates' sizes (a 5x5's cross and diagonal centers, the
 *  4-Trajber's corners, edges and face middles). */
function pieceKeyOf(cubie: Cubie, solvedPosition: Vec3): string {
  const kind = solvedPosition
    .map(Math.abs)
    .sort((a, b) => a - b)
    .join(',')
  return cubie.stickers.length === 1
    ? `C:${kind}${handOf(solvedPosition)}:${cubie.stickers[0]!.color}`
    : `P:${vecKey(solvedPosition)}`
}

/** Which of two mirror kinds a center is, when its face holds both (a
 *  6x6's obliques, off the diagonals): the sign of the turn from its nearer
 *  coordinate to its farther one, seen from its face (the axis it is
 *  farthest along), which no turn changes. Empty for any other piece. */
function handOf(at: Vec3): string {
  const size = at.map(Math.abs)
  const axis = size.indexOf(Math.max(...size))
  const [u, v] = [(axis + 1) % 3, (axis + 2) % 3]
  const [a, b] = [at[u]!, at[v]!]
  if (a === 0 || b === 0 || size[u] === size[v] || size[u] === size[axis]) return ''
  // u then v is a positive turn about the axis: (axis, u, v) is cyclic.
  const sign = Math.sign(at[axis]!) * Math.sign(a) * Math.sign(b) * (size[u]! < size[v]! ? 1 : -1)
  return sign > 0 ? '+' : '-'
}

/**
 * For each paintable slot, all valid piece placements. Whole-cube rotations
 * keep the cubie array indexed in place, so index `i` of every orientation is
 * the same physical piece as index `i` of the solved cube: each placement is
 * tagged with that identity (wings of one color pair stay distinguishable by
 * chirality, interchangeable centers share one key).
 */
function computePlacements(
  shape: CubeShape,
  paintableSlots: readonly Slot[],
): Map<string, PlacementOption[]> {
  const solved = entrySolved(shape)
  const perSlot = new Map<string, Map<string, PlacementOption>>()
  for (const slot of paintableSlots) perSlot.set(slot.key, new Map())
  for (const cube of cubeOrientations(solved)) {
    cube.forEach((cubie, i) => {
      const bucket = perSlot.get(vecKey(cubie.position))
      if (!bucket) return // fixed piece / core
      const colors: Placement = {}
      for (const s of cubie.stickers) colors[normalIndex(s.normal)] = s.color
      bucket.set(placementKey(colors), { colors, pieceKey: pieceKeyOf(cubie, solved[i]!.position) })
    })
  }
  return new Map([...perSlot].map(([k, m]) => [k, [...m.values()]]))
}

/** Available physical pieces (all but the fixed ones and the core): every
 *  unique piece once, centers 4 per color. */
function computeBudgets(shape: CubeShape, fixed: Set<number>): Map<string, number> {
  const budgets = new Map<string, number>()
  entrySolved(shape).forEach((cubie, i) => {
    if (fixed.has(i) || cubie.stickers.length === 0) return
    const key = pieceKeyOf(cubie, cubie.position)
    budgets.set(key, (budgets.get(key) ?? 0) + 1)
  })
  return budgets
}
