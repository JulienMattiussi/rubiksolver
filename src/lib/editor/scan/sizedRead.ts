import { solvedCube } from '../../core/cube'
import { AXIS_ROTATIONS, cross, FACE_NORMAL } from '../../core/geometry'
import { LAYER_THICKNESS } from '../../core/shape'
import type { Cubie, CubeColor, Face, Sticker, Vec3 } from '../../core/types'
import { cubeToEdit } from '../edit'
import { validateCube } from '../validate'
import { cheapestAssignment } from './assign'
import type { ScanReading } from './classify'
import { sizedOrder } from './plan'

/**
 * A mirror 3x3 read from what its stickers measure (pure, sized.ts): each
 * piece, known by its layers' thicknesses (LAYER_THICKNESS.mirror, those
 * of the real puzzle), put where it fits the measures best, all at once
 * (the Hungarian method, assign.ts), held each way that might show it.
 *
 * A picture is not the puzzle: a sticker is its layer less its black frame
 * (the frame's share, a brand's own, is fitted), and its thick layers read
 * a little short. Both are fitted on the scan, among a few values: the
 * cheapest reading that makes a cube wins. How it was held, its sizes
 * cannot tell (its centers all measure the same, and turning every other
 * piece round them is a cube too): the scan names each face by its
 * thickness, which its center's depth shows.
 */

/** A face's stickers measured, in middle layers: each place ("row,col",
 *  -1 top, left) its width and height, the middle ones null. */
export type Sizes = ReadonlyMap<string, readonly [number | null, number | null]>

/** The frame's share of a sticker's layer, on each side, and how much of
 *  their difference to the middle the layers show: the values fitted. */
const FRAMES = [0.02, 0.04, 0.06, 0.08, 0.1]
const SHOWN = [1, 0.95, 0.9]

const SOLVED = solvedCube('3')
const PIECES = SOLVED.flatMap((c, i) => (c.stickers.length > 1 ? [i] : []))
const axisOf = (v: Vec3) => v.findIndex((x) => x !== 0)

/** The faces as the scan asks them, each its face and the one on top. */
const held = (behind: boolean) => sizedOrder(behind).map(({ front, up }) => [front, up] as const)
/** The faces as a phone's camera brings them, or one facing the user. */
const WAYS = [held(false), held(true)]

interface Measure {
  readonly at: string
  readonly axis: number
  readonly value: number
}

/** The measures of every face, held as `held` says, a sticker's frame
 *  `frame` of its layer each side. */
function measuresOf(
  faces: readonly Sizes[],
  held: readonly (readonly [Face, Face])[],
  frame: number,
) {
  const layer = (v: number) => v * (1 - 2 * frame) + 2 * frame
  const out: Measure[] = []
  faces.forEach((sizes, f) => {
    const [front, up] = held[f]!
    const [n, u] = [FACE_NORMAL[front], FACE_NORMAL[up]]
    const r = cross(u, n)
    for (const [key, [w, h]] of sizes) {
      const [row, col] = key.split(',').map(Number) as [number, number]
      const at = [0, 1, 2].map((i) => n[i]! - u[i]! * row + r[i]! * col).join()
      if (w !== null) out.push({ at, axis: axisOf(r), value: layer(w) })
      if (h !== null) out.push({ at, axis: axisOf(u), value: layer(h) })
    }
  })
  return out
}

/** The cheapest pieces for the measures: the state, and its cost. */
function cheapest(measures: readonly Measure[], shown: number) {
  const thickness = (c: CubeColor) => 1 + (LAYER_THICKNESS.mirror[c] - 1) * shown
  const where = new Map<string, Measure[]>()
  for (const m of measures) where.set(m.at, [...(where.get(m.at) ?? []), m])
  // Each piece at each place: its best way round there, and its cost.
  const ways = PIECES.map((i) =>
    PIECES.map((j) => {
      const [piece, place] = [SOLVED[i]!, SOLVED[j]!.position]
      let best: { stickers: Sticker[]; cost: number } | undefined
      for (const turn of AXIS_ROTATIONS) {
        if (turn(piece.position).join() !== place.join()) continue
        const stickers = piece.stickers.map((s) => ({ ...s, normal: turn(s.normal) }))
        const along = (axis: number) => {
          const s = stickers.find((x) => x.normal[axis] !== 0)
          return s ? thickness(s.color as CubeColor) : 1
        }
        const cost = (where.get(place.join()) ?? []).reduce(
          (t, m) => t + Math.abs(m.value - along(m.axis)),
          0,
        )
        if (!best || cost < best.cost) best = { stickers, cost }
      }
      return best
    }),
  )
  const costs = ways.map((row) => row.map((w) => w?.cost ?? Infinity))
  const pick = cheapestAssignment(
    costs.map((row) => row.map((c) => (Number.isFinite(c) ? c : 1e6))),
  )
  const state: Cubie[] = SOLVED.map((c) => ({ ...c }))
  let cost = 0
  pick.forEach((j, a) => {
    state[PIECES[a]!] = { position: SOLVED[PIECES[j]!]!.position, stickers: ways[a]![j]!.stickers }
    cost += costs[a]![j]!
  })
  return { state, cost }
}

/** How the faces were held as they were taken: each its face, and the one
 *  on top. */
export type Held = readonly (readonly [Face, Face])[]

/** A mirror 3x3 read from its faces' measures, held as the scan asked
 *  (`sizedOrder`, each face named by its thickness: its centers all alike,
 *  the sizes alone cannot tell how it was held), the camera facing the user
 *  or not, unless `ways` says otherwise:
 *  the cheapest reading that makes a cube, else the face with the fewest
 *  stickers measured, to take again. */
export function readSized(faces: readonly Sizes[], ways: readonly Held[] = WAYS): ScanReading {
  const tries = ways.flatMap((held) =>
    FRAMES.flatMap((frame) => {
      const measures = measuresOf(faces, held, frame)
      return SHOWN.map((shown) => cheapest(measures, shown))
    }),
  )
  tries.sort((a, b) => a.cost - b.cost)
  for (const { state } of tries) {
    if (validateCube(state).ok) return { ok: true, edit: cubeToEdit(state) }
  }
  const fewest = faces.reduce((worst, s, f) => (s.size < faces[worst]!.size ? f : worst), 0)
  return { ok: false, face: fewest }
}
