import { cubeOrientations, normalIndex, solvedCube } from './cube'
import { SHAPE_DIMS } from './types'
import type { Color, CubeShape, Cubie, Vec3 } from './types'

/**
 * Slot and placement tables backing the guided editor (see editor.ts).
 * Everything here is derived per cube shape from that shape's solved cube and
 * memoized: the fixed slots, every valid piece placement per slot (from the
 * 24 whole-cube orientations), and the physical-piece budgets.
 */

const posKey = (p: Vec3): string => p.join(',')
export const stickerId = (p: Vec3, ni: number): string => `${posKey(p)}:${ni}`

type SlotKind = 'corner' | 'edge' | 'center' | 'core'

interface SlotSticker {
  readonly ni: number
  readonly normal: Vec3
  readonly id: string
  readonly solvedColor: Color
}

export interface Slot {
  readonly key: string
  readonly position: Vec3
  readonly kind: SlotKind
  readonly stickers: readonly SlotSticker[]
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

/** A cubie of a solved cube as a slot (fixed position + exterior normals). */
function toSlot(cubie: Cubie): Slot {
  return {
    key: posKey(cubie.position),
    position: cubie.position,
    kind: kindOf(cubie.stickers.length),
    stickers: cubie.stickers.map((s) => ({
      ni: normalIndex(s.normal),
      normal: s.normal,
      id: stickerId(cubie.position, normalIndex(s.normal)),
      solvedColor: s.color,
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

/** Fixed centers stay pre-filled. A face only has a fixed center piece when
 *  every dimension is odd, so on any other shape the centers move. */
export function centersArePaintable(shape: CubeShape): boolean {
  return !SHAPE_DIMS[shape].every((n) => n % 2 === 1)
}

export function paintableKind(shape: CubeShape, kind: SlotKind): boolean {
  return kind === 'corner' || kind === 'edge' || (kind === 'center' && centersArePaintable(shape))
}

export interface SlotTables {
  readonly slots: readonly Slot[]
  /** Slots the user can paint (corners, edges, movable centers). */
  readonly paintableSlots: readonly Slot[]
  readonly byKey: ReadonlyMap<string, Slot>
  /** Valid piece placements per slot key, from the 24 solved orientations. */
  readonly placements: ReadonlyMap<string, readonly PlacementOption[]>
  /** Physical pieces available per pieceKey (1 each, 4 per center color). */
  readonly budgets: ReadonlyMap<string, number>
}

const TABLES = new Map<CubeShape, SlotTables>()

/** Slot + placement tables of a cube shape, derived from its solved cube. */
export function tablesFor(shape: CubeShape): SlotTables {
  let tables = TABLES.get(shape)
  if (!tables) {
    const slots = solvedCube(shape).map(toSlot)
    const paintableSlots = slots.filter((s) => paintableKind(shape, s.kind))
    tables = {
      slots,
      paintableSlots,
      byKey: new Map(slots.map((s) => [s.key, s])),
      placements: computePlacements(shape, paintableSlots),
      budgets: computeBudgets(shape),
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
      if (!bucket) return // fixed center / core
      const colors: Placement = {}
      for (const s of cubie.stickers) colors[normalIndex(s.normal)] = s.color
      bucket.set(placementKey(colors), { colors, pieceKey: pieceKeyOf(cubie, solved[i]!.position) })
    })
  }
  return new Map([...perSlot].map(([k, m]) => [k, [...m.values()]]))
}

/** Available physical pieces: every unique piece once, centers 4 per color. */
function computeBudgets(shape: CubeShape): Map<string, number> {
  const budgets = new Map<string, number>()
  for (const cubie of solvedCube(shape)) {
    if (!paintableKind(shape, kindOf(cubie.stickers.length))) continue
    const key = pieceKeyOf(cubie, cubie.position)
    budgets.set(key, (budgets.get(key) ?? 0) + 1)
  }
  return budgets
}
