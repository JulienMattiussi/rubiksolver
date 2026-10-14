import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { FTO_TURNS, parseFtoMoves } from '@/lib/puzzles/polyhedron/fto'
import { FTO_FORMULAS } from '@/lib/methods/polyhedron/fto'
import { formatMove, NOTATION_FR, NOTATION_US } from '@/lib/core/moves'
import { applyMoves } from '@/lib/core/turn'
import type { Cubie } from '@/lib/core/types'

const SOLVED = solvedCube('fto')

const kindOf = (c: Cubie) =>
  c.stickers.length === 4 ? 'corners' : c.stickers.length === 2 ? 'edges' : 'centers'

/** How many pieces of each kind a formula moves or turns, from solved. */
function moved(formula: string): Record<string, number> {
  const after = applyMoves(SOLVED, parseFtoMoves(formula))
  const out: Record<string, number> = {}
  after.forEach((c, i) => {
    const home = SOLVED[i]!
    const same =
      c.position.join() === home.position.join() &&
      c.stickers.every((s, k) => s.normal.join() === home.stickers[k]!.normal.join())
    if (!same) out[kindOf(home)] = (out[kindOf(home)] ?? 0) + 1
  })
  return out
}

describe('FTO', () => {
  it('has 6 corners, 12 edges and 24 centers, 9 triangles a face', () => {
    expect(SOLVED.filter((c) => kindOf(c) === 'corners')).toHaveLength(6)
    expect(SOLVED.filter((c) => kindOf(c) === 'edges')).toHaveLength(12)
    expect(SOLVED.filter((c) => kindOf(c) === 'centers')).toHaveLength(24)
  })

  it('turns a face: its 3 corners, 3 edges, its 3 centers and 6 beside it', () => {
    expect(moved('H')).toEqual({ corners: 3, edges: 3, centers: 9 })
    expect(moved('h')).toEqual({ edges: 6, centers: 6 })
    expect(isSolved(applyMoves(SOLVED, parseFtoMoves('HHH')))).toBe(true)
    expect(isSolved(applyMoves(SOLVED, parseFtoMoves('hhh')))).toBe(true)
  })

  it('cycles 3 edges by O3 and 3 centers by O4, nothing else (fan2cube.fr)', () => {
    expect(moved(FTO_FORMULAS.O3)).toEqual({ edges: 3 })
    expect(moved(FTO_FORMULAS.O4)).toEqual({ centers: 3 })
    // (DHD'H)² and (H'DH'D')²: 3 edges and 3 centers of a face.
    expect(moved("(DHD'H)²")).toEqual({ edges: 3, centers: 3 })
    expect(moved("(H'DH'D')²")).toEqual({ edges: 3, centers: 3 })
  })

  it('moves corners by O1 and turns two by O2 (fan2cube.fr)', () => {
    expect(moved(FTO_FORMULAS.O1).corners).toBe(4)
    expect(moved(FTO_FORMULAS.O2).corners).toBe(2)
  })

  it('writes its turns in both notations', () => {
    const show = (labels: typeof NOTATION_FR) =>
      FTO_TURNS.filter((m) => m.amount === 1).map((m) => formatMove(m, labels))
    expect(show(NOTATION_FR)).toEqual(['H', 'P', 'G̲', 'D̲', 'A', 'B', 'D', 'G', 'h', 'a', 'g', 'd'])
    expect(show(NOTATION_US)).toEqual([
      'U',
      'B',
      'BR',
      'BL',
      'F',
      'D',
      'R',
      'L',
      'u',
      'f',
      'l',
      'r',
    ])
    // The page's underlined faces read back.
    expect(parseFtoMoves("G̲ D̲'")).toHaveLength(2)
  })
})
