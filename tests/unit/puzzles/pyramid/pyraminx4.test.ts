import { describe, expect, it } from 'vitest'
import { cubeShape, isSolved, solvedCube, stateKey } from '@/lib/core/cube'
import { wingCycles } from '@/lib/methods/pyramid/pyraminx4'
import { formatMoves, NOTATION_FR, NOTATION_US } from '@/lib/core/moves'
import { pyraTurnsOf } from '@/lib/puzzles/pyramid/pyraminx'
import { parsePyraMoves } from '@/lib/puzzles/pyramid/pyraNotation'
import { applyMoves, turnedBy } from '@/lib/core/turn'
import type { Cube, Cubie } from '@/lib/core/types'
import { validateCube } from '@/lib/editor/validate'

const SOLVED = solvedCube('pyra4')
const parse = (text: string) => parsePyraMoves(text, NOTATION_FR, 4)
const play = (text: string, from: Cube = SOLVED) => applyMoves(from, parse(text))

/** The kind of piece a solved position holds. */
function kindAt(position: readonly number[]): string {
  const sorted = position.map(Math.abs).sort().join()
  const kinds: Record<string, string> = {
    '3,3,3': 'tip',
    '2,2,2': 'co-tip',
    '1,1,3': 'wing',
    '0,0,2': 'midge',
    '1,1,1': 'center',
  }
  return kinds[sorted]!
}

/** What a formula does from solved: the kinds of the pieces it moves or
 *  twists, with how many of each. */
function touched(text: string): Record<string, number> {
  const after = play(text)
  const pose = (c: Cubie) => [c.position, ...c.stickers.map((s) => s.normal)].join('|')
  const counts: Record<string, number> = {}
  SOLVED.forEach((c, i) => {
    if (pose(c) === pose(after[i]!)) return
    const kind = kindAt(c.position)
    counts[kind] = (counts[kind] ?? 0) + 1
  })
  return counts
}

describe('Master Pyraminx model', () => {
  it('has 4 tips, 4 co-tips, 12 wings, 6 midges and 4 centers, recognized by their count', () => {
    expect(SOLVED).toHaveLength(30)
    expect(cubeShape(SOLVED)).toBe('pyra4')
    expect(isSolved(SOLVED)).toBe(true)
    const kinds = SOLVED.map((c) => kindAt(c.position))
    for (const [kind, n] of [
      ['tip', 4],
      ['co-tip', 4],
      ['wing', 12],
      ['midge', 6],
      ['center', 4],
    ] as const) {
      expect(kinds.filter((k) => k === kind)).toHaveLength(n)
    }
  })

  it('turns one slice at a time: the tip, 1 + 3, 3 + 3 + 3, then the face (10 pieces)', () => {
    const counts = pyraTurnsOf('pyra4')
      .filter((m) => m.amount === 1 && m.vertex === 'U')
      .map((m) => SOLVED.filter((_, i) => turnedBy(SOLVED, m)(i)).length)
    expect(counts).toEqual([1, 4, 9, 16])
    for (const move of pyraTurnsOf('pyra4')) {
      expect(stateKey(applyMoves(SOLVED, [move, move, move]))).toBe(stateKey(SOLVED))
    }
  })
})

describe('Master Pyraminx notation', () => {
  it("writes fan2cube's numbered slices in French, SiGN prefixes in English", () => {
    const moves = parse("H G'₁ D2 P'3")
    expect(formatMoves(moves, NOTATION_FR)).toBe("H G'₁ D₂ P'₃")
    expect(formatMoves(moves, NOTATION_US)).toBe("u 2L' 3R 4B'")
    expect(parsePyraMoves("u 2L' 3R 4B'", NOTATION_US, 4)).toEqual(moves)
  })

  it("reads the page's spellings: H'1, H1', h for H1, and commutators", () => {
    expect(parse("H'1 H1' h")).toEqual(parse("H'₁ H'₁ H₁"))
    expect(formatMoves(parse("[H'1 D2]"), NOTATION_FR)).toBe("H'₁ D₂ H₁ D'₂")
    expect(() => parse('h2')).toThrow()
    expect(() => parse('H4')).toThrow()
    expect(() => parsePyraMoves('U', NOTATION_US, 4)).toThrow()
  })
})

describe("fan2cube's formulas (pyraminx42)", () => {
  it.each(["[H'1 D2]", "[H1 G'2]", "[H2 G'1]", "[H'2 D1]"])(
    '%s cycles three wings, nothing else',
    (text) => {
      expect(touched(text)).toEqual({ wing: 3 })
    },
  )

  it("G₁ D₂ H'₁ D'₂ G'₁ H₁ and D₂ H₁ D'₂ H₁ D₂ H₁ D'₂ cycle three wings too", () => {
    expect(touched("G1 D2 H'1 D'2 G'1 H1")).toEqual({ wing: 3 })
    expect(touched("D2 H1 D'2 H1 D2 H1 D'2")).toEqual({ wing: 3 })
  })

  it('the midge formulas leave the wings, cycling (or flipping) midges and swapping centers', () => {
    expect(touched("[H'2 D2]")).toEqual({ midge: 3, center: 4 })
    expect(touched("D2 H2 D'2 H2 D2 H2 D'2")).toEqual({ midge: 3, center: 4 })
    expect(touched("[G2 D'2][H'2 D2]")).toEqual({ midge: 2, center: 4 })
  })

  it("[G₂ D'₂]³ swaps the centers two by two, (D'₂ h' D₂ h')² twists a co-tip", () => {
    expect(touched("[G2 D'2][G2 D'2][G2 D'2]")).toEqual({ center: 4 })
    expect(touched("D'2 h' D2 h' D'2 h' D2 h'")).toEqual({ 'co-tip': 1 })
  })

  it('every 3-cycle of the wings has a formula', () => {
    // 12 wings: 12 * 11 * 10 / 3 cycles.
    expect(wingCycles().size).toBe(440)
  })
})

/** The cube with the stickers of two pieces' colors exchanged. */
function swapColors(cube: Cube, a: number, b: number): Cube {
  return cube.map((c, i) =>
    i === a || i === b
      ? {
          position: c.position,
          stickers: cube[i === a ? b : a]!.stickers.map((s, k) => ({
            normal: c.stickers[k]!.normal,
            color: s.color,
          })),
        }
      : c,
  )
}

describe('Master Pyraminx validation and editor', () => {
  it('rejects a lone flipped midge, and two wings swapped', () => {
    const midge = SOLVED.findIndex((c) => kindAt(c.position) === 'midge')
    const flipped = SOLVED.map((c, i) =>
      i === midge
        ? {
            position: c.position,
            stickers: c.stickers.map((s, k) => ({
              normal: s.normal,
              color: c.stickers[1 - k]!.color,
            })),
          }
        : c,
    )
    expect(validateCube(flipped)).toMatchObject({ ok: false, error: 'impossible' })
    // Two wings of different edges, sharing no color.
    const wings = SOLVED.flatMap((c, i) => (kindAt(c.position) === 'wing' ? [i] : []))
    const colors = (i: number) => SOLVED[i]!.stickers.map((s) => s.color)
    const other = wings.find((w) => !colors(w).some((c) => colors(wings[0]!).includes(c)))!
    expect(validateCube(swapColors(SOLVED, wings[0]!, other))).toMatchObject({
      ok: false,
      error: 'impossible',
    })
  })
})
