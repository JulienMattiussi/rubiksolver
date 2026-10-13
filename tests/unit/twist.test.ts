import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/cube'
import { parseMoves } from '@/lib/moves'
import { applyMoves } from '@/lib/turn'

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
})
