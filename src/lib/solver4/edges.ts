import { applyMoves } from '../cube'
import { invertMoves, parseMoves } from '../moves'
import { colorAt, faceGenerators, sameColorSet, search, solveWithAlgs } from '../solverKit'
import { centersDone } from './centers'
import type { Cube, Cubie, Face, Move, Vec3 } from '../types'

/**
 * 4x4 edge pairing: join the 24 wing edges into 12 composite edges, keeping
 * the centers solved. Outer turns move a slot's two wings together (they can
 * permute pairs but never split them), so only the inner-slice joins below
 * touch pairing; every application is goal-checked, never trusted.
 *
 * One pairing round works at the FR slot. The two JOIN sequences below
 * ("slice, exchange with an outer algorithm, slice back") have a tiny exact
 * net effect, verified empirically and asserted per application: they swap
 * the FR-bottom wing with the BR-top wing (JOIN_U) or with the FL-top wing
 * (JOIN_P), leaving every other wing and every center untouched. So a round
 * is: bring an unpaired wing to FR-top, bring its partner to BR-top or FL-top
 * (the two variants accept its two possible chiralities) and apply the
 * matching JOIN: FR becomes paired, and the swapped-out junk wing lands in
 * the partner's slot, which was unpaired anyway. Net +1, always. When the
 * last unpaired slot holds its own partner crossed (a flip), a last-two-edges
 * algorithm swaps the two wings in place instead.
 */

interface EdgeSlot {
  /** Wing cell on the +1 side of the slot's free axis. */
  readonly top: Vec3
  /** Wing cell on the -1 side. */
  readonly bottom: Vec3
  /** The slot's two exterior faces. */
  readonly faces: readonly [Face, Face]
}

const FACE_OF_AXIS: ReadonlyArray<ReadonlyArray<Face>> = [
  ['L', 'R'], // x: sign -1, +1
  ['D', 'U'],
  ['B', 'F'],
]

function buildSlots(): EdgeSlot[] {
  const slots: EdgeSlot[] = []
  for (let i = 0; i < 3; i++) {
    for (let j = i + 1; j < 3; j++) {
      const k = (3 - i - j) as 0 | 1 | 2
      for (const si of [3, -3]) {
        for (const sj of [3, -3]) {
          const cell = (v: number): Vec3 => {
            const p: [number, number, number] = [0, 0, 0]
            p[i] = si
            p[j] = sj
            p[k] = v
            return p
          }
          slots.push({
            top: cell(1),
            bottom: cell(-1),
            faces: [FACE_OF_AXIS[i]![si > 0 ? 1 : 0]!, FACE_OF_AXIS[j]![sj > 0 ? 1 : 0]!],
          })
        }
      }
    }
  }
  return slots
}

const SLOTS: readonly EdgeSlot[] = buildSlots()
/** The working slot for joins: x = +3 (R), z = +3 (F). */
const FR_SLOT: EdgeSlot = SLOTS.find((s) => s.top[0] === 3 && s.top[2] === 3)!

function at(cube: Cube, p: Vec3): Cubie {
  const found = cube.find(
    (c) => c.position[0] === p[0] && c.position[1] === p[1] && c.position[2] === p[2],
  )
  if (!found) throw new Error('edges: no cubie at expected position')
  return found
}

/** Both wings of `slot` show the same color on each of the slot's faces. */
function edgePaired(cube: Cube, slot: EdgeSlot): boolean {
  const a = at(cube, slot.top)
  const b = at(cube, slot.bottom)
  return slot.faces.every((f) => {
    const ca = colorAt(a, f)
    return ca !== undefined && ca === colorAt(b, f)
  })
}

export function pairedCount(cube: Cube): number {
  return SLOTS.filter((s) => edgePaired(cube, s)).length
}

export function edgesPaired(cube: Cube): boolean {
  return pairedCount(cube) === 12
}

/** Canonical wings-only key (positions + colors); sound for wing-only goals. */
function wingsKey(cube: Cube): string {
  const parts: string[] = []
  for (const c of cube) {
    if (c.stickers.length !== 2) continue
    const p = c.position
    const pos = String.fromCharCode(256 + (p[0] + 3) * 49 + (p[1] + 3) * 7 + (p[2] + 3))
    const stickers = c.stickers
      .map((s) => `${s.normal[0]},${s.normal[1]},${s.normal[2]}:${s.color}`)
      .sort()
      .join('')
    parts.push(pos + stickers)
  }
  return parts.sort().join('|')
}

// JOIN_U net-swaps FR-bottom with BR-top; the wing arriving at FR-bottom
// keeps its R-face sticker on R and its B-face sticker lands on F. So the FR
// slot pairs when FR-top and BR-top agree as below. JOIN_P is the mirror
// through FL-top (L lands on R... its L sticker faces R, its F sticker stays
// on F), accepting the other chirality of the partner.
function joinReadyU(cube: Cube): boolean {
  const wa = at(cube, FR_SLOT.top)
  const wb = at(cube, [3, 1, -3])
  if (wb.stickers.length !== 2) return false
  return colorAt(wa, 'R') === colorAt(wb, 'R') && colorAt(wa, 'F') === colorAt(wb, 'B')
}

function joinReadyP(cube: Cube): boolean {
  const wa = at(cube, FR_SLOT.top)
  const wb = at(cube, [-3, 1, 3])
  if (wb.stickers.length !== 2) return false
  return colorAt(wa, 'R') === colorAt(wb, 'L') && colorAt(wa, 'F') === colorAt(wb, 'F')
}

// "Slice, exchange, slice back": net effect verified empirically (see module
// comment) and asserted after every application.
const JOIN_U = parseMoves("2U R U R' F R' F' R 2U'")
const JOIN_P = parseMoves("2U' R U R' F R' F' R 2U")

// Last-two-edges flip: swaps the two wings of the FR slot in place, centers
// preserved (the D slice comes back after mutually cancelling outer turns).
const L2E = parseMoves("2D R F' U R' F 2D'")
const L2E_WIDE = parseMoves("Dw R F' U R' F Dw'")
const L2E_ALGS = [L2E, L2E_WIDE, invertMoves(L2E), invertMoves(L2E_WIDE)]

const OUTER_GENERATORS = faceGenerators(['U', 'D', 'L', 'R', 'F', 'B'])
/** Setup turns that leave the staged wing at FR-bottom untouched. */
const SETUP_GENERATORS = faceGenerators(['U', 'D', 'B', 'L'])

/** Position of the other wing carrying the same two colors as `wing`. */
function partnerPosition(cube: Cube, wing: Cubie): Vec3 {
  const colors = wing.stickers.map((s) => s.color)
  const partner = cube.find((c) => c !== wing && c.stickers.length === 2 && sameColorSet(c, colors))
  if (!partner) throw new Error('edges: wing has no partner')
  return partner.position
}

function samePos(a: Vec3, b: Vec3): boolean {
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2]
}

/** Pair all 12 edges. Precondition: centers solved (asserted per join). */
export function pairEdges(cube: Cube): Move[] {
  let state = cube
  const all: Move[] = []
  const push = (moves: Move[]) => {
    state = applyMoves(state, moves)
    all.push(...moves)
  }
  for (let guard = 0; pairedCount(state) < 12; guard++) {
    if (guard > 24) throw new Error('pairEdges: no progress')
    const before = pairedCount(state)
    // Bring some unpaired slot to FR (outer turns: nothing can unpair).
    push(search(state, (c) => !edgePaired(c, FR_SLOT), OUTER_GENERATORS, 4, wingsKey))
    const partnerAt = partnerPosition(state, at(state, FR_SLOT.top))
    if (samePos(partnerAt, FR_SLOT.bottom)) {
      // Crossed in place (flip case): swap the slot's two wings.
      push(solveWithAlgs(state, L2E_ALGS, (c) => pairedCount(c) > before && centersDone(c), 2))
    } else {
      push(search(state, (c) => joinReadyU(c) || joinReadyP(c), SETUP_GENERATORS, 5, wingsKey))
      const join = joinReadyU(state) ? JOIN_U : JOIN_P
      const next = applyMoves(state, join)
      if (pairedCount(next) <= before || !centersDone(next)) {
        throw new Error('pairEdges: join failed')
      }
      state = next
      all.push(...join)
    }
    if (pairedCount(state) <= before) throw new Error('pairEdges: no progress')
  }
  return all
}
