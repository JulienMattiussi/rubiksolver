import { describe, expect, it } from 'vitest'
import { cubeShape, isSolved, solvedCube } from '@/lib/cube'
import { formatMoves, NOTATION_FR, NOTATION_US } from '@/lib/moves'
import { pyraTurnsOf } from '@/lib/pyraminx'
import { parsePyraMoves } from '@/lib/pyraNotation'
import { applyMoves, turnedBy } from '@/lib/turn'
import type { Cubie } from '@/lib/types'
import { validateCube } from '@/lib/validate'

const SOLVED = solvedCube('pyra5')
const parse = (text: string) => parsePyraMoves(text, NOTATION_FR, 5)

/** The kind of piece a solved position holds: octahedra at odd
 *  coordinates, small tetrahedra at even ones. */
function kindOf(c: Cubie): string {
  const odd = Math.abs(c.position[0]) % 2 === 1
  const zeros = c.position.filter((x) => x === 0).length
  if (c.stickers.length === 3) return odd ? 'co-tip' : 'tip'
  if (c.stickers.length === 2) return odd ? 'co-wing' : zeros === 2 ? 'edge' : 'wing'
  return odd ? 'center' : 'co-center'
}

/** What a formula does from solved: the kinds it moves or twists, how many. */
function touched(text: string): Record<string, number> {
  const after = applyMoves(SOLVED, parse(text))
  const pose = (c: Cubie) => [c.position, ...c.stickers.map((s) => s.normal)].join('|')
  const counts: Record<string, number> = {}
  SOLVED.forEach((c, i) => {
    if (pose(c) === pose(after[i]!)) return
    counts[kindOf(c)] = (counts[kindOf(c)] ?? 0) + 1
  })
  return counts
}

describe('Professor Pyraminx', () => {
  it('has its 54 pieces of seven kinds, 25 stickers a face', () => {
    expect(cubeShape(SOLVED)).toBe('pyra5')
    expect(isSolved(SOLVED)).toBe(true)
    const kinds: Record<string, number> = {}
    for (const c of SOLVED) kinds[kindOf(c)] = (kinds[kindOf(c)] ?? 0) + 1
    expect(kinds).toEqual({
      tip: 4,
      'co-tip': 4,
      wing: 12,
      edge: 6,
      'co-wing': 12,
      'co-center': 12,
      center: 4,
    })
  })

  it('turns one slice at a time: the tip, then slices of 4, 9, 15 pieces, then the face', () => {
    const counts = pyraTurnsOf('pyra5')
      .filter((t) => t.vertex === 'U' && t.amount === 1)
      .map((t) => SOLVED.filter((_, i) => turnedBy(SOLVED, t)(i)).length)
    expect(counts).toEqual([1, 4, 9, 15, 25])
  })

  it("writes fan2cube's numbered slices, the face opposite as the fourth", () => {
    const moves = parse("H'1 D3 G4 g")
    expect(formatMoves(moves, NOTATION_FR)).toBe("H'₁ D₃ G₄ G₁")
    expect(formatMoves(moves, NOTATION_US)).toBe("2U' 4R 5L 2L")
  })

  it("follows fan2cube's formulas: each moves only what its step sees to", () => {
    // Wings, a 3-cycle each, nothing else.
    for (const f of ["[H'1 D3]", "[H1 G'3]", "[H3 G'1]", "[H'3 D1]"]) {
      expect(touched(f)).toEqual({ wing: 3 })
    }
    // Co-wings, stirring the co-centers (done later).
    for (const f of ["[H'2 D3]", "[H2 G'3]", "[H3 G'2]", "[H'3 D2]"]) {
      expect(touched(f)).toEqual({ 'co-wing': 3, 'co-center': 5 })
    }
    // Edges: a 3-cycle, a 3-cycle within the top slice, two flipped.
    expect(touched("[G2 D'2]")).toEqual({ edge: 3 })
    expect(touched("D2 H2 D'2 H2 D2 H2 D'2")).toEqual({ edge: 3 })
    expect(touched("[G2 D'2][H'2 D2]")).toEqual({ edge: 2 })
    // Co-centers, with the opposite face; the centers swapped two by two.
    expect(touched("[H3 G'3][H3 G'3] G4 [H3 G'3] G4'")).toEqual({ 'co-center': 3, center: 4 })
    // Centers: (A,B)(G,D).
    expect(touched("[G3 D'3][G3 D'3][G3 D'3]")).toEqual({ center: 4 })
  })

  it('rejects two centers swapped alone', () => {
    const centers = SOLVED.flatMap((c, i) => (kindOf(c) === 'center' ? [i] : []))
    const [a, b] = centers as [number, number]
    const swapped = SOLVED.map((c, i) =>
      i === a
        ? {
            ...c,
            stickers: SOLVED[b]!.stickers.map((s, k) => ({ ...s, normal: c.stickers[k]!.normal })),
          }
        : i === b
          ? {
              ...c,
              stickers: SOLVED[a]!.stickers.map((s, k) => ({
                ...s,
                normal: c.stickers[k]!.normal,
              })),
            }
          : c,
    )
    expect(validateCube(swapped)).toMatchObject({ ok: false, error: 'impossible' })
  })
})
