import { MEGA_SLOTS, megaAround } from '../../puzzles/polyhedron/megaminx'
import type { MegaFace } from '../../core/types'
import {
  STAR,
  CORNER,
  EQUATOR,
  SIDE_CORNERS,
  TOP_EDGES,
  TOP_FLIP,
  TOP_CORNERS,
  TOP_TWIST,
  CRYSTAL_FORMULAS,
  CORNER_CYCLE,
  CORNER_TWIST,
  EDGE_CYCLE,
  EDGE_FLIP,
  EDGE_CYCLE_BACK,
  CORNER_CYCLE_BACK,
} from './megaminxFormulas'

/**
 * The steps of the Megaminx's method and the Crystal's (megaminx.ts): each
 * its slots, in the order they are filled, and the page's formulas it
 * plays (`placed`: the pieces only brought to their slots, turned after).
 */

const keyOf = (faces: readonly MegaFace[]) => [...faces].sort().join()

/** The slots of a step, in the order they are filled. */
type Slots = readonly (readonly MegaFace[])[]

const LOWER = megaAround('D')
const UPPER = megaAround('U')
const has = (slot: readonly MegaFace[], faces: readonly MegaFace[]) =>
  slot.filter((f) => faces.includes(f)).length
const edges = MEGA_SLOTS.filter((s) => s.length === 2)
const corners = MEGA_SLOTS.filter((s) => s.length === 3)

const STAR_SLOTS = edges.filter((s) => s.includes('D'))
const CORNER_SLOTS = corners.filter((s) => s.includes('D'))
const LOW_SLOTS = edges.filter((s) => has(s, LOWER) === 2)
/** Each face around the bottom finished in turn: the corner it shares
 *  with the next one down, its edges up, its top corner. */
const SIDE_SLOTS: Slots = (() => {
  const out: (readonly MegaFace[])[] = []
  const listed = new Set<string>()
  const add = (slot: readonly MegaFace[]) => {
    if (!listed.has(keyOf(slot))) out.push(slot)
    listed.add(keyOf(slot))
  }
  for (const face of LOWER) {
    const mine = MEGA_SLOTS.filter((s) => s.includes(face) && !s.includes('D') && s.length > 1)
    mine.filter((s) => s.length === 3 && has(s, LOWER) === 2).forEach(add)
    mine.filter((s) => s.length === 2 && has(s, UPPER) === 1).forEach(add)
    mine.filter((s) => s.length === 3 && has(s, UPPER) === 2).forEach(add)
  }
  return out
})()
const HIGH_SLOTS = edges.filter((s) => has(s, UPPER) === 2)
const TOP_EDGE_SLOTS = edges.filter((s) => s.includes('U'))
const TOP_CORNER_SLOTS = corners.filter((s) => s.includes('U'))

export interface Step {
  readonly key: string
  readonly slots: Slots
  readonly formulas: readonly string[]
  readonly placed?: true
}

export const MEGA_STEPS: readonly Step[] = [
  { key: 'stepMegaStar', slots: STAR_SLOTS, formulas: STAR },
  { key: 'stepMegaCorners', slots: CORNER_SLOTS, formulas: CORNER },
  { key: 'stepMegaLowEdges', slots: LOW_SLOTS, formulas: EQUATOR },
  { key: 'stepMegaSides', slots: SIDE_SLOTS, formulas: [...SIDE_CORNERS, ...EQUATOR] },
  { key: 'stepMegaHighEdges', slots: HIGH_SLOTS, formulas: EQUATOR },
  { key: 'stepMegaTopEdges', slots: TOP_EDGE_SLOTS, formulas: TOP_EDGES, placed: true },
  { key: 'stepMegaTopFlip', slots: TOP_EDGE_SLOTS, formulas: TOP_FLIP },
  { key: 'stepMegaTopCorners', slots: TOP_CORNER_SLOTS, formulas: TOP_CORNERS, placed: true },
  { key: 'stepMegaTopTwist', slots: TOP_CORNER_SLOTS, formulas: TOP_TWIST },
]

/** The top's 3-cycles, then each followed by itself or its inverse a turn
 *  of the top further on: sharing two pieces, two 3-cycles make a 3-cycle
 *  of pieces side by side, which the formula alone cannot reach. */
const withShifted = (cycle: string, back: string) => [
  cycle,
  ...[
    ['H', "H'"],
    ['H2', "H'2"],
    ["H'2", 'H2'],
    ["H'", 'H'],
  ].flatMap(([k, undo]) => [cycle, back].map((then) => `${cycle} ${k} ${then} ${undo}`)),
]
const CRYSTAL_TOP_CORNERS = [...withShifted(CORNER_CYCLE, CORNER_CYCLE_BACK), CORNER_TWIST]
const CRYSTAL_TOP_EDGES = [...withShifted(EDGE_CYCLE, EDGE_CYCLE_BACK), EDGE_FLIP]

/** The Crystal, "les sommets d'abord": as the Megaminx, each layer's
 *  corners before its edges. */
export const CRYSTAL_STEPS: readonly Step[] = [
  { key: 'stepCrystalCorners', slots: CORNER_SLOTS, formulas: CRYSTAL_FORMULAS },
  { key: 'stepCrystalEdges', slots: STAR_SLOTS, formulas: CRYSTAL_FORMULAS },
  {
    key: 'stepCrystalLowCorners',
    slots: corners.filter((s) => !s.includes('D') && has(s, LOWER) === 2),
    formulas: CRYSTAL_FORMULAS,
  },
  {
    key: 'stepCrystalHighCorners',
    slots: corners.filter((s) => !s.includes('U') && has(s, UPPER) === 2),
    formulas: CRYSTAL_FORMULAS,
  },
  {
    key: 'stepMegaSides',
    slots: edges.filter((s) => !s.includes('D') && has(s, LOWER) >= 1),
    formulas: CRYSTAL_FORMULAS,
  },
  {
    key: 'stepMegaTopCorners',
    slots: TOP_CORNER_SLOTS,
    formulas: CRYSTAL_TOP_CORNERS,
    placed: true,
  },
  { key: 'stepMegaTopTwist', slots: TOP_CORNER_SLOTS, formulas: CRYSTAL_TOP_CORNERS },
  { key: 'stepMegaHighEdges', slots: HIGH_SLOTS, formulas: CRYSTAL_FORMULAS },
  { key: 'stepMegaTopEdges', slots: TOP_EDGE_SLOTS, formulas: CRYSTAL_TOP_EDGES, placed: true },
  { key: 'stepMegaTopFlip', slots: TOP_EDGE_SLOTS, formulas: CRYSTAL_TOP_EDGES },
]
