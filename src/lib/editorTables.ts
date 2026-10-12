import { cubeOrientations, solvedCube } from './cube'
import { normalIndex } from './geometry'
import { layerTurnsOf } from './moves'
import { applyMove } from './turn'
import { isStar, type Color, type CubeShape, type Cubie, type Vec3 } from './types'

/**
 * Slot and placement tables backing the guided editor (see editor.ts).
 * Everything here is derived per cube shape from that shape's solved cube and
 * memoized: the fixed slots, every valid piece placement per slot (from the
 * whole-puzzle orientations), and the physical-piece budgets.
 */

const posKey = (p: Vec3): string => p.join(',')
export const stickerId = (p: Vec3, ni: number): string => `${posKey(p)}:${ni}`

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

/** A cubie of a solved cube as a slot (fixed position + exterior normals). */
function toSlot(shape: CubeShape, cubie: Cubie, fixed: boolean): Slot {
  return {
    key: posKey(cubie.position),
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
 * (a half turn flips it in place).
 */
function fixedPieces(shape: CubeShape): Set<number> {
  const solved = solvedCube(shape)
  // Turns keep the sticker order, so each sticker's normal can be compared.
  const pose = (c: Cubie) => [c.position, ...c.stickers.map((s) => s.normal)].join('|')
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

const TABLES = new Map<CubeShape, SlotTables>()

/** Slot + placement tables of a cube shape, derived from its solved cube. */
export function tablesFor(shape: CubeShape): SlotTables {
  let tables = TABLES.get(shape)
  if (!tables) {
    const fixed = fixedPieces(shape)
    const slots = solvedCube(shape).map((c, i) => toSlot(shape, c, fixed.has(i)))
    const paintableSlots = slots.filter((s) => s.paintable)
    tables = {
      slots,
      paintableSlots,
      byKey: new Map(slots.map((s) => [s.key, s])),
      placements: computePlacements(shape, paintableSlots),
      budgets: computeBudgets(shape, paintableSlots),
    }
    TABLES.set(shape, tables)
  }
  return tables
}

function placementKey(p: Placement): string {
  return Object.keys(p)
    .map(Number)
    .sort((a, b) => a - b)
    .map((ni) => ni + p[ni]!)
    .join('')
}

/** Identity of the physical piece a solved-cube cubie is. */
function pieceKeyOf(cubie: Cubie, solvedPosition: Vec3): string {
  return cubie.stickers.length === 1
    ? `C:${cubie.stickers[0]!.color}`
    : `P:${posKey(solvedPosition)}`
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
  const solved = solvedCube(shape)
  const perSlot = new Map<string, Map<string, PlacementOption>>()
  for (const slot of paintableSlots) perSlot.set(slot.key, new Map())
  for (const cube of cubeOrientations(solved)) {
    cube.forEach((cubie, i) => {
      const bucket = perSlot.get(posKey(cubie.position))
      if (!bucket) return // fixed piece / core
      const colors: Placement = {}
      for (const s of cubie.stickers) colors[normalIndex(s.normal)] = s.color
      bucket.set(placementKey(colors), { colors, pieceKey: pieceKeyOf(cubie, solved[i]!.position) })
    })
  }
  return new Map([...perSlot].map(([k, m]) => [k, [...m.values()]]))
}

/** Available physical pieces: every unique piece once, centers 4 per color. */
function computeBudgets(shape: CubeShape, paintableSlots: readonly Slot[]): Map<string, number> {
  const paintable = new Set(paintableSlots.map((s) => s.key))
  const budgets = new Map<string, number>()
  for (const cubie of solvedCube(shape)) {
    if (!paintable.has(posKey(cubie.position))) continue
    const key = pieceKeyOf(cubie, cubie.position)
    budgets.set(key, (budgets.get(key) ?? 0) + 1)
  }
  return budgets
}
