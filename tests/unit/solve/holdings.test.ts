import { describe, expect, it } from 'vitest'
import { solvedCube, stateKey } from '@/lib/core/cube'
import { parseMoves } from '@/lib/core/notation'
import { applyMoves } from '@/lib/core/turn'
import { bestHolding, holdingsOf, turnBack } from '@/lib/solve/holdings'

const TOWER = solvedCube('224')

describe('the holding a puzzle is read in', () => {
  it('keeps a tower as it is, when it stands the right way up', () => {
    const cube = applyMoves(TOWER, parseMoves("U D'"))
    const by = bestHolding(cube, '224')
    expect(by([1, 2, 3])).toEqual([1, 2, 3])
  })

  it('turns a tower upside down back, its long side kept upright', () => {
    const cube = applyMoves(TOWER, parseMoves('x2 U'))
    const by = bestHolding(cube, '224')
    const [held] = holdingsOf(cube, [by])
    expect(by([0, 1, 0])[1]).toBe(-1)
    // Held so, its top turned is its bottom turned: one turn from solved.
    expect(stateKey(applyMoves(held!, parseMoves("D'")))).toBe(stateKey(TOWER))
  })

  it('names a turn back for the puzzle as it stands', () => {
    const cube = applyMoves(TOWER, parseMoves('x2'))
    const by = bestHolding(cube, '224')
    // Its top, held upside down, is its bottom as it stands.
    expect(turnBack(parseMoves('U')[0]!, by)).toMatchObject({ face: 'D' })
    expect(turnBack(parseMoves('Rw2')[0]!, by)).toMatchObject({ face: 'R', depth: 2, wide: true })
  })
})
