import { tablesFor } from '../editorTables'
import { distance, type Lab } from './color'
import { scanPlan, type ScanFace } from './plan'
import type { CellSample } from './sample'
import type { Color } from '../../core/types'
import type { CubeShape } from '../../core/shapes'

/**
 * Faces scanned held turned, found back (pure): the instruction says which
 * color goes on top, but a face held a quarter turn off reads as well. Each
 * face may have been turned (its layout's turns: a quarter at a time, a
 * half on a face that is not square, a fifth on a Megaminx's); the right turns are those that make real pieces of the
 * corners and edges, which sit on several faces. Its centers turn within
 * their face, so they tell nothing.
 *
 * Every combination of turns is tried (up to `EVERY`), but cheaply: a piece sits on two or
 * three faces only, so what it costs is worked out once for each turn of
 * those (64 at most), and a combination is a sum of those. On a 6x6, 4096
 * combinations of 56 pieces take some 25 ms (2026-10-21).
 *
 * A puzzle with few pieces (a 2x3x2, the Domino) can make real pieces of a
 * face held either way: then the noise of the pictures would choose. A
 * face is taken as turned only if that reads it clearly better than held
 * as told (`TURNED`, against a misread sticker costing some 50).
 */

/** What a face taken as turned costs, against a sticker's distance to its
 *  color: more than the noise of the pictures, less than a misread. */
const TURNED = 12

/** A face's cells read as held its `turn`-th way (plan.ts: `turns`). */
export const turnCells = <T>(cells: readonly T[], face: ScanFace, turn: number): T[] =>
  face.turns[turn]!.map((i) => cells[i]!)

/** Beyond this many combinations of turns (a Megaminx's twelve faces, five
 *  ways each: 244 million), the faces are set one by one from those beside
 *  them, then settled (`grown`, `settle`). */
const EVERY = 100_000

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
    face.turns.map((_, turn) => {
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
  const ways = plan.map((face) => face.turns.length)
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
  const costOf = (ks: readonly number[]) =>
    pieces.reduce(
      (sum, { on, costOf }) =>
        sum +
        costOf[
          indexOf(
            on.map((f) => ks[f]!),
            on,
          )
        ]!,
      TURNED * ks.filter(Boolean).length,
    )
  /** The faces set one by one, the first held its `first` way: each next
   *  face, the one sharing the most pieces with those set, the way that
   *  makes them cheapest. */
  const grown = (first: number): number[] => {
    const ks: (number | undefined)[] = all.map((f) => (f === 0 ? first : undefined))
    for (let left = all.length - 1; left > 0; left--) {
      const shared = (f: number) =>
        pieces.filter(({ on }) => on.includes(f) && on.some((g) => g !== f && ks[g] !== undefined))
      const next = all
        .filter((f) => ks[f] === undefined)
        .reduce((a, b) => (shared(b).length > shared(a).length ? b : a))
      const near = shared(next)
      const costs = Array.from({ length: ways[next]! }, (_, k) =>
        near.reduce((sum, { on, costOf }) => {
          if (on.some((g) => g !== next && ks[g] === undefined)) return sum
          return (
            sum +
            costOf[
              indexOf(
                on.map((g) => (g === next ? k : ks[g]!)),
                on,
              )
            ]!
          )
        }, 0),
      )
      ks[next] = costs.indexOf(Math.min(...costs))
    }
    return ks.map((k) => k!)
  }
  /** Each face in its turn set to its best, the others as they stand,
   *  until none changes. */
  const settle = (start: readonly number[]): number[] => {
    let ks = [...start]
    for (let changed = true; changed;) {
      changed = false
      for (const f of all) {
        const tries = Array.from({ length: ways[f]! }, (_, k) =>
          costOf(ks.map((was, g) => (g === f ? k : was))),
        )
        const k = tries.indexOf(Math.min(...tries))
        if (tries[k]! < tries[ks[f]!]!) {
          ks = ks.map((was, g) => (g === f ? k : was))
          changed = true
        }
      }
    }
    return ks
  }
  const combinations = ways.reduce((n, w) => n * w, 1)
  let bestKs = all.map(() => 0)
  if (combinations <= EVERY) {
    let best = Infinity
    for (let index = 0; index < combinations; index++) {
      const ks = digits(index, all)
      const cost = costOf(ks)
      // Strictly cheaper: held as told, unless turned is better.
      if (cost < best) {
        best = cost
        bestKs = ks
      }
    }
  } else {
    // From each way the first face can be held, each next face set from
    // the pieces it shares with those already set, then each face settled
    // in its turn: the cheapest.
    let best = Infinity
    for (let first = 0; first < ways[0]!; first++) {
      const ks = settle(grown(first))
      const cost = costOf(ks)
      if (cost < best) {
        best = cost
        bestKs = ks
      }
    }
  }
  return plan.map((face, f) => turnCells(faces[f] ?? [], face, bestKs[f]!))
}
