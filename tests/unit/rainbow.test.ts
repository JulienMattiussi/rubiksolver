import { describe, expect, it } from 'vitest'
import { cubeShape, isSolved, solvedCube } from '@/lib/cube'
import { PLACE_LEFT, PLACE_RIGHT } from '@/lib/methods/rainbow'
import { formatMoves, NOTATION_FR, NOTATION_US } from '@/lib/moves'
import { parseDinoMoves, RAINBOW_TURNS } from '@/lib/rainbow'
import { colorsOf } from '@/lib/pieces'
import { applyMoves } from '@/lib/turn'
import type { Cube, RainbowMove } from '@/lib/types'

const SOLVED = solvedCube('rainbow')

/** The pieces a sequence moves from solved (their solved slots). */
const moved = (moves: readonly RainbowMove[]) => {
  const after = applyMoves(SOLVED, moves)
  return SOLVED.filter((c, i) => c.position.join() !== after[i]!.position.join()).length
}

describe('Rainbow', () => {
  it('has 12 pieces of four colors and 8 fixed centers', () => {
    expect(cubeShape(SOLVED)).toBe('rainbow')
    expect(SOLVED.filter((c) => c.stickers.length === 4)).toHaveLength(12)
    expect(SOLVED.filter((c) => c.stickers.length === 1)).toHaveLength(8)
    // Every piece told apart by its colors, no face beside one of its color.
    const colors = (c: (typeof SOLVED)[number]) =>
      c.stickers
        .map((s) => s.color)
        .sort()
        .join()
    const pieces = SOLVED.filter((c) => c.stickers.length === 4)
    expect(new Set(pieces.map(colors)).size).toBe(12)
    for (const c of pieces) expect(new Set(c.stickers.map((s) => s.color)).size).toBe(4)
  })

  it('turns a triangle a third: its three pieces, its center staying put', () => {
    for (const turn of RAINBOW_TURNS) {
      expect(moved([turn])).toBe(3)
      expect(isSolved(applyMoves(SOLVED, [turn, turn, turn]))).toBe(true)
    }
  })

  it("writes fan2cube's letters, and its two formulas cycle three pieces", () => {
    expect(formatMoves(PLACE_LEFT, NOTATION_FR)).toBe("H' G' H G")
    expect(formatMoves(PLACE_RIGHT, NOTATION_US)).toBe("U R U' R'")
    expect(moved(PLACE_LEFT)).toBe(3)
    expect(moved(PLACE_RIGHT)).toBe(3)
  })
})

describe('Dino Cube (fan2cube.fr/dinocube1 and 2)', () => {
  const DINO = solvedCube('dino')
  const at = (cube: Cube, p: string) => cube.find((c) => c.position.join() === p)!

  it('is the Rainbow’s edges, two triangles each, no center', () => {
    expect(DINO).toHaveLength(12)
    expect(DINO.every((c) => c.stickers.length === 2)).toBe(true)
  })

  it('cycles three top edges with [GA’], (HA)->(HD)->(HG), nothing else', () => {
    const after = applyMoves(DINO, parseDinoMoves("[GA']"))
    // HA = (0, 1, 1), HD = (1, 1, 0), HG = (-1, 1, 0).
    const moved = DINO.filter((c, i) => after[i]!.position.join() !== c.position.join())
    expect(moved.map((c) => c.position.join()).sort()).toEqual(['-1,1,0', '0,1,1', '1,1,0'])
    expect(colorsOf(at(after, '1,1,0'))).toBe(colorsOf(at(DINO, '0,1,1')))
    expect(colorsOf(at(after, '-1,1,0'))).toBe(colorsOf(at(DINO, '1,1,0')))
  })

  it('solves either way round: left and right swapped is solved too', () => {
    const swapped = DINO.map((c) => ({
      ...c,
      stickers: c.stickers.map((s) => ({
        ...s,
        color: s.color === 'O' ? ('R' as const) : s.color === 'R' ? ('O' as const) : s.color,
      })),
    }))
    expect(isSolved(swapped)).toBe(true)
  })
})

describe('Rex Cube (fan2cube.fr/rexcube1 and 2)', () => {
  const REX = solvedCube('rex')
  const kindOf = (c: Cube[number]) =>
    c.stickers.length === 2
      ? 'edge'
      : c.position.filter((x) => x !== 0).length === 1
        ? 'center'
        : 'petal'
  /** How many of each kind a formula moves. */
  const moves = (formula: string) => {
    const after = applyMoves(REX, parseDinoMoves(formula, 'rex'))
    const count: Record<string, number> = {}
    REX.forEach((c, i) => {
      if (after[i]!.position.join() !== c.position.join())
        count[kindOf(c)] = (count[kindOf(c)] ?? 0) + 1
    })
    return count
  }

  it('turns a corner’s three edges, three centers and nine petals', () => {
    expect(REX).toHaveLength(42)
    const one = applyMoves(REX, [{ triangle: 'U', amount: 1, dino: true, rex: true }])
    const count: Record<string, number> = {}
    REX.forEach((c, i) => {
      if (one[i]!.position.join() !== c.position.join())
        count[kindOf(c)] = (count[kindOf(c)] ?? 0) + 1
    })
    expect(count).toEqual({ edge: 3, center: 3, petal: 9 })
  })

  it('moves three edges with [GA’], three centers with [DG’], petals only with [DG’][D’B]', () => {
    expect(moves("[GA']").edge).toBe(3)
    expect(moves("[DG']")).toMatchObject({ center: 3 })
    expect(moves("[DG']").edge).toBeUndefined()
    expect(moves("[DG'][D'B]")).toEqual({ petal: 4 })
  })
})
