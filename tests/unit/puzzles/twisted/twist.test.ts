import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { asSeenThin, isThinEdge, withRealThinEdges } from '@/lib/puzzles/shared/thinEdges'
import { validateCube } from '@/lib/editor/validate'
import { parseMoves } from '@/lib/core/notation'
import { applyMoves } from '@/lib/core/turn'

const TWIST = solvedCube('twist')
const sides = (cube: typeof TWIST) =>
  cube.filter((c) => c.spin !== undefined).map((c) => `${c.position.join()}@${c.spin}`)

describe('Z-Twist', () => {
  it('is a 3x3 whose four side centers keep their quarter turns', () => {
    expect(TWIST).toHaveLength(27)
    expect(TWIST.filter((c) => c.spin !== undefined)).toHaveLength(4)
  })

  it('turns a side center a quarter with each quarter turn of its face, not a half', () => {
    const r = applyMoves(TWIST, parseMoves('R'))
    expect(sides(r)).toContain('1,0,0@1')
    expect(sides(applyMoves(TWIST, parseMoves('R2')))).toContain('1,0,0@0')
    // Colors home, a center off: not solved.
    expect(isSolved(applyMoves(TWIST, parseMoves('R R R R R')))).toBe(false)
    expect(isSolved(applyMoves(TWIST, parseMoves('R4'.replace('4', '2 R2'))))).toBe(true)
  })

  it('counts nothing of its thin edges’ way round, which never shows', () => {
    // L R' U D' with its thin edges entered the other way round: the same
    // puzzle to see, real and solved by the same means.
    const real = applyMoves(TWIST, parseMoves("L R' U D'"))
    const seen = asSeenThin(real)
    const swapped = seen.map((c) =>
      isThinEdge(c)
        ? { ...c, stickers: c.stickers.map((s, i) => ({ ...s, color: c.stickers[1 - i]!.color })) }
        : c,
    )
    expect(validateCube(withRealThinEdges(swapped)).ok).toBe(true)
    // A thin edge turned over at home: solved still.
    const home = TWIST.map((c) =>
      isThinEdge(c) && c.position.join() === '-1,0,1'
        ? { ...c, stickers: c.stickers.map((s, i) => ({ ...s, color: c.stickers[1 - i]!.color })) }
        : c,
    )
    expect(isSolved(home)).toBe(true)
  }, 30_000)
})
