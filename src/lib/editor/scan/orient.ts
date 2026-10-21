import { tablesFor } from '../editorTables'
import { distance, type Lab } from './color'
import { scanPlan, type ScanFace } from './plan'
import type { CellSample } from './sample'
import type { Color } from '../../core/types'
import type { CubeShape } from '../../core/shapes'

/**
 * Faces scanned held turned, found back (pure): the instruction says which
 * color goes on top, but a face held a quarter turn off reads as well. Each
 * face may have been turned (a quarter at a time, a half on a face that is
 * not square); the right turns are those that make real pieces of the
 * corners and edges, which sit on several faces. Its centers turn within
 * their face, so they tell nothing.
 *
 * Every combination of turns is tried, but cheaply: a piece sits on two or
 * three faces only, so what it costs is worked out once for each turn of
 * those (64 at most), and a combination is a sum of those. On a 6x6, 4096
 * combinations of 56 pieces take some 25 ms (2026-10-21).
 */

/** A face's cells, row by row, once its picture is turned a quarter
 *  clockwise `quarters` times (a half turn only, on a face not square). */
export function turnCells<T>(cells: readonly T[], face: ScanFace, quarters: number): T[] {
  const turn = quarters % 4
  if (turn === 0) return [...cells]
  // A half turn reads it backward; three quarters, a half then a quarter.
  const back = [...cells].reverse()
  if (turn === 2) return back
  const from = turn === 1 ? cells : back
  const n = face.cols
  // Row r of the picture turned a quarter is column r of this one, upward.
  return from.map((_, i) => from[(n - 1 - (i % n)) * n + Math.floor(i / n)]!)
}

/** The quarter turns each face can have been held off by. */
const turnsOf = (face: ScanFace): readonly number[] =>
  face.rows === face.cols ? [0, 1, 2, 3] : [0, 2]

/** Each face's cells as held the way the instruction says: turned back by
 *  the turns that make the cheapest real pieces of the stickers seen
 *  (`anchor`: each color as this light shows it). */
export function orientFaces(
  shape: CubeShape,
  faces: readonly (readonly CellSample[])[],
  anchor: ReadonlyMap<Color, Lab>,
): CellSample[][] {
  const plan = scanPlan(shape)
  const tables = tablesFor(shape)
  const faceOf = new Map(plan.flatMap((face, f) => face.cells.map((id) => [id, f] as const)))
  // Per face and turn, each sticker's cost in each color.
  const costs = plan.map((face, f) =>
    turnsOf(face).map((turn) => {
      const cells = turnCells(faces[f] ?? [], face, turn)
      return new Map(
        face.cells.map((id, i) => {
          const lab = cells[i]?.lab
          const of = new Map<Color, number>()
          for (const [color, ref] of anchor) of.set(color, lab ? distance(lab, ref) : 0)
          return [id, of] as const
        }),
      )
    }),
  )
  const ways = plan.map((face) => turnsOf(face).length)
  // A combination's index, digit by digit, over some faces.
  const digits = (index: number, over: readonly number[]) => {
    const out: number[] = []
    for (const f of over) {
      out.push(index % ways[f]!)
      index = Math.floor(index / ways[f]!)
    }
    return out
  }
  const indexOf = (ks: readonly number[], over: readonly number[]) =>
    over.reduceRight((index, f, j) => index * ways[f]! + ks[j]!, 0)

  // What each piece on several faces costs, for each turn of those faces.
  const pieces = tables.paintableSlots.flatMap((slot) => {
    const on = [...new Set(slot.stickers.map((s) => faceOf.get(s.id)!))]
    if (on.length < 2) return []
    const options = tables.placements.get(slot.key) ?? []
    const count = on.reduce((n, f) => n * ways[f]!, 1)
    const costOf = Array.from({ length: count }, (_, index) => {
      const ks = digits(index, on)
      let best = Infinity
      for (const option of options) {
        let cost = 0
        for (const s of slot.stickers) {
          const f = faceOf.get(s.id)!
          cost += costs[f]![ks[on.indexOf(f)]!]!.get(s.id)!.get(option.colors[s.ni]!) ?? Infinity
        }
        best = Math.min(best, cost)
      }
      return best
    })
    return [{ on, costOf }]
  })

  const all = plan.map((_, f) => f)
  const combinations = ways.reduce((n, w) => n * w, 1)
  let best = Infinity
  let bestKs = all.map(() => 0)
  for (let index = 0; index < combinations; index++) {
    const ks = digits(index, all)
    let cost = 0
    for (const { on, costOf } of pieces)
      cost +=
        costOf[
          indexOf(
            on.map((f) => ks[f]!),
            on,
          )
        ]!
    // Strictly cheaper: held as told, unless turned is better.
    if (cost < best) {
      best = cost
      bestKs = ks
    }
  }
  return plan.map((face, f) => turnCells(faces[f] ?? [], face, turnsOf(face)[bestKs[f]!]!))
}
