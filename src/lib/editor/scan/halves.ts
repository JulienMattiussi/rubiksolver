import { solvedCube } from '../../core/cube'
import { AXIS_ROTATIONS, cross, dot, FACE_NORMAL, normalIndex } from '../../core/geometry'
import type { CubeShape } from '../../core/shapes'
import type { Color, Cube, Cubie, Face, Vec3 } from '../../core/types'
import { stickerId, tablesFor } from '../editorTables'
import { stepOf, type Cuts, type CutsSpec } from '../entry'
import { anchorsOf } from './anchors'
import { readFaces, type ScanReading } from './classify'
import { distance, type Lab } from './color'
import { gridLayout, type Point } from './layout'
import { orderFor, scanPlan, type ScanFace } from './plan'
import { HALVES } from './planFaces'
import type { CellSample } from './sample'

/**
 * A puzzle whose cells hold two halves or one whole piece (the Fashion-V:
 * its `cuts` step, lib/editor/entry.ts), read from its scan (pure). Each
 * face is taken as a grid of 6 x 6, each cell of its 3 x 3 in two each
 * way: a half fills the part of its cell on its side of the cut, so a face
 * across the cut shows the two halves side by side, the face the cut faces
 * the outer half alone. Two halves often show one color there, but their
 * other faces tell them: each way a cell can hold its pieces makes pieces
 * of the colors read, which a real piece shows or not (green and white is
 * no whole edge, green and red is one). The cheapest way of each cell,
 * the cheapest together that the puzzle can stand in, gives its form,
 * read whole as forms.ts does (classify.ts).
 */

/** A face's sub-cells, across and down. */
const SUBS = HALVES

/** The sub-cells a piece fills across an axis, from its coordinate along
 *  it (signed, the face's way): the middle cell's two, the outer half's
 *  one, the inner half's one (its cell cut across this axis), or its
 *  cell's two. */
function subsAlong(v: number, cut: boolean): number[] {
  if (v === 0) return [2, 3]
  const out = v > 0
  if (Math.abs(v) === 2) return [out ? 5 : 0]
  if (cut) return [out ? 4 : 1]
  return out ? [4, 5] : [0, 1]
}

/** The axis a cell is cut across: where one of its pieces stands out at 2
 *  (none: whole). */
const cutAxis = (cell: readonly Cubie[]): number =>
  [0, 1, 2].find((a) => cell.some((c) => Math.abs(c.position[a]!) === 2)) ?? -1

const cellKeyOf = (p: Vec3) => p.map(Math.sign).join()

/** The sub-cells of a face (`front`, `up` on top) each sticker of `pieces`
 *  fills, its cell's pieces telling its cut: by sticker id, the indexes
 *  read left to right, top down. */
function filled(pieces: readonly Cubie[], front: Face, up: Face): Map<string, number[]> {
  const n = FACE_NORMAL[front]
  const u = FACE_NORMAL[up]
  const r = cross(u, n)
  const cells = new Map<string, Cubie[]>()
  for (const c of pieces) {
    const key = cellKeyOf(c.position)
    cells.set(key, [...(cells.get(key) ?? []), c])
  }
  const out = new Map<string, number[]>()
  for (const c of pieces) {
    if (!c.stickers.some((s) => s.normal.join() === n.join())) continue
    const cut = cutAxis(cells.get(cellKeyOf(c.position))!)
    const along = (v: Vec3) => {
      const axis = v.findIndex((x) => x !== 0)
      return subsAlong(dot(c.position, v), axis === cut)
    }
    const cols = along(r)
    const rows = along(u).map((s) => SUBS - 1 - s)
    out.set(
      stickerId(c.position, normalIndex(n)),
      rows.flatMap((row) => cols.map((col) => row * SUBS + col)),
    )
  }
  return out
}

/** Each sub-cell of a face of a state: the sticker it shows. */
export function subStickers(cube: Cube, front: Face, up: Face): string[] {
  const out = Array<string>(SUBS * SUBS).fill('')
  for (const [id, subs] of filled(cube, front, up)) for (const s of subs) out[s] = id
  return out
}

/** The cuts spec of a puzzle read by halves. */
const specOf = (shape: CubeShape): CutsSpec => stepOf(shape, 'cuts')!.cuts

/** Each way a cell's halves can lie, in click order. */
function waysOf(spec: CutsSpec, key: string): number[] {
  const ways: number[] = []
  let cuts = spec.start()
  while (!ways.includes(cuts[key]!)) {
    ways.push(cuts[key]!)
    cuts = spec.next(cuts, key)
  }
  return ways
}

/** How far a set of sub-cells reads from a color. */
const off = (labs: readonly Lab[], color: Lab) => labs.reduce((s, l) => s + distance(l, color), 0)

/** What a cell's pieces, laid one way, cost as the pictures show them: each
 *  piece the real piece of its kind that fits it best,
 *  turned any way that puts its stickers on its faces. */
function wayCost(
  shape: CubeShape,
  pieces: readonly Cubie[],
  taken: readonly (readonly CellSample[])[],
  order: ReturnType<typeof orderFor>,
  anchor: ReadonlyMap<Color, Lab>,
): number {
  // The sub-cells of each sticker, by normal: each piece's.
  const faces = order.map(({ front, up }) => filled(pieces, front, up))
  const kinds = kindsIn(pieces)
  let total = 0
  for (const piece of pieces) {
    const read = piece.stickers.map((s) => {
      const f = order.findIndex(({ front }) => FACE_NORMAL[front].join() === s.normal.join())
      const subs = faces[f]?.get(stickerId(piece.position, normalIndex(s.normal))) ?? []
      return { normal: s.normal.join(), labs: subs.map((i) => taken[f]![i]!.lab) }
    })
    let best = Infinity
    for (const real of realPieces(shape)) {
      if (real.stickers.length !== piece.stickers.length) continue
      if (realKinds(shape).get(real) !== kinds.get(piece)) continue
      for (const turn of AXIS_ROTATIONS) {
        const colors = new Map(real.stickers.map((s) => [turn(s.normal).join(), s.color]))
        if (!read.every((r) => colors.has(r.normal))) continue
        const cost = read.reduce((s, r) => s + off(r.labs, anchor.get(colors.get(r.normal)!)!), 0)
        best = Math.min(best, cost)
      }
    }
    total += best
  }
  return total
}

/** Each piece's kind: its cell's (a corner's, an edge's) and its part in
 *  it, an outer half (at 2), the inner one beside it, or a whole piece (a
 *  pair's outer half, green and white, is never a whole edge, green and
 *  red). */
function kindsIn(pieces: readonly Cubie[]): Map<Cubie, string> {
  const cells = new Map<string, Cubie[]>()
  for (const c of pieces) {
    const key = cellKeyOf(c.position)
    cells.set(key, [...(cells.get(key) ?? []), c])
  }
  return new Map(
    pieces.map((c) => {
      const cell = cells.get(cellKeyOf(c.position))!
      const part = c.position.some((v) => Math.abs(v) === 2)
        ? 'outer'
        : cutAxis(cell) >= 0
          ? 'inner'
          : 'whole'
      return [c, `${c.position.filter((v) => v !== 0).length}:${part}`]
    }),
  )
}

const KINDS = new Map<CubeShape, Map<Cubie, string>>()
const realKinds = (shape: CubeShape) => {
  let kinds = KINDS.get(shape)
  if (!kinds) KINDS.set(shape, (kinds = kindsIn(realPieces(shape))))
  return kinds
}

const REAL = new Map<CubeShape, Cube>()
/** The pieces a puzzle has (its solved state's, with colors). */
const realPieces = (shape: CubeShape): Cube => {
  let real = REAL.get(shape)
  if (!real) REAL.set(shape, (real = solvedCube(shape).filter((c) => c.stickers.length)))
  return real
}

/** How many ways together, cheapest first, are tried for a form. */
const TRIES = 60

/** The cuts that cost least, each cell its cheapest way, that the puzzle
 *  can stand in: its form, or null. */
function cheapestForm(spec: CutsSpec, costs: Map<string, { way: number; cost: number }[]>) {
  const keys = [...costs.keys()]
  const total = (pick: number[]) => pick.reduce((s, k, i) => s + costs.get(keys[i]!)![k]!.cost, 0)
  const queue = [{ pick: keys.map(() => 0), cost: 0 }]
  queue[0]!.cost = total(queue[0]!.pick)
  const seen = new Set([queue[0]!.pick.join()])
  for (let tries = 0; tries < TRIES && queue.length; tries++) {
    queue.sort((a, b) => a.cost - b.cost)
    const { pick } = queue.shift()!
    const cuts: Cuts = Object.fromEntries(keys.map((k, i) => [k, costs.get(k)![pick[i]!]!.way]))
    const form = spec.form(cuts)
    if (form) return form
    // Each cell its next cheapest way, one at a time.
    keys.forEach((k, i) => {
      if (pick[i]! + 1 >= costs.get(k)!.length) return
      const next = pick.map((p, j) => (j === i ? p + 1 : p))
      if (seen.has(next.join())) return
      seen.add(next.join())
      queue.push({ pick: next, cost: total(next) })
    })
  }
  return null
}

/** A puzzle read by halves (see above): its colors and its form, else the
 *  face to take again. */
export function readHalves(
  shape: CubeShape,
  taken: readonly (readonly CellSample[])[],
  behind = false,
): ScanReading {
  const plan = scanPlan(shape, 'classic', behind)
  const order = orderFor(behind)
  const spec = specOf(shape)
  const anchor = anchorsOf({ shape, plan }, taken)
  const start = spec.start()
  const costs = new Map(
    Object.keys(start).map((key) => {
      const ways = waysOf(spec, key).map((way) => {
        const pieces = spec
          .pieces({ ...start, [key]: way })
          .filter((p) => p.cell === key)
          .map((p) => p.cubie)
        return { way, cost: wayCost(shape, pieces, taken, order, anchor) }
      })
      return [key, ways.sort((a, b) => a.cost - b.cost)] as const
    }),
  )
  const form = cheapestForm(spec, costs)
  if (!form) return { ok: false, face: 0 }
  return readFaces(
    { shape, plan: platesOf(plan, form, order), tables: tablesFor(shape, form), form },
    order.map(({ front, up }, f) =>
      [...filled(form, front, up).values()].map((subs) => ({
        lab: mean(subs.map((i) => taken[f]![i]!.lab)),
      })),
    ),
  ).reading
}

const mean = (labs: readonly Lab[]): Lab => {
  const of = (c: 0 | 1 | 2) => labs.reduce((s, l) => s + l[c], 0) / labs.length
  return [of(0), of(1), of(2)]
}

/** The faces as a form shows them: a cell per sticker, read where its
 *  sub-cells are, as held (no turn); its center the sticker that fills the
 *  middle. */
function platesOf(
  plan: readonly ScanFace[],
  form: Cube,
  order: ReturnType<typeof orderFor>,
): ScanFace[] {
  const grid = gridLayout(SUBS, SUBS)
  return order.map(({ front, up }, f) => {
    const stickers = [...filled(form, front, up)]
    const middle = (SUBS / 2 - 1) * SUBS + SUBS / 2 - 1
    return {
      ...plan[f]!,
      points: stickers.map(([, subs]) => middleOf(subs.map((i) => grid.points[i]!))),
      cells: stickers.map(([id]) => id),
      center: stickers.findIndex(([, subs]) => subs.includes(middle)),
      turns: [stickers.map((_, j) => j)],
      halves: undefined,
    }
  })
}

const middleOf = (points: readonly Point[]): Point => [
  points.reduce((s, p) => s + p[0], 0) / points.length,
  points.reduce((s, p) => s + p[1], 0) / points.length,
]
