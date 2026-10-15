import { describe, expect, it } from 'vitest'
import { solvedCube, stateKey } from '@/lib/core/cube'
import { scrambleTurns } from '@/lib/core/moves'
import { applyMoves } from '@/lib/core/turn'
import {
  cutsNoBlock,
  marksFromColors,
  turnsEver,
  withBlocks,
  withoutMarks,
} from '@/lib/puzzles/bandaged/bonds'
import { seededRng } from '../../../helpers'

describe('bandaged 3x3x3s', () => {
  it('marks each fused cubie towards its neighbours in the block', () => {
    const bar = withBlocks(solvedCube('3'), [['DFL', 'DF']])
    const marks = bar.flatMap((c) => c.stickers.filter((s) => s.color === 'H'))
    expect(marks.map((s) => s.normal.join())).toEqual(['1,0,0', '-1,0,0'])
  })

  it('jams a turn that cuts a block, lets one that takes it whole', () => {
    const bar = withBlocks(solvedCube('3'), [['DFL', 'DF']])
    expect(cutsNoBlock(bar, { face: 'L', amount: 1 })).toBe(false)
    expect(cutsNoBlock(bar, { face: 'F', amount: 1 })).toBe(true)
    expect(cutsNoBlock(bar, { face: 'D', amount: 2 })).toBe(true)
    expect(turnsEver(bar).map((m) => m.face)).toContain('L')
  })

  it('finds an entered state’s marks again from its colors', () => {
    const solved = solvedCube('fused')
    const cube = applyMoves(solved, scrambleTurns('fused', 25, seededRng(3), solved))
    expect(stateKey(marksFromColors(withoutMarks(cube), solved))).toBe(stateKey(cube))
  })

  it('leaves a broken block’s pieces unmarked', () => {
    const solved = withBlocks(solvedCube('3'), [['DFL', 'DF']])
    // Turned as a 3x3x3 would, L takes the corner from its edge.
    const broken = applyMoves(withoutMarks(solved), [{ face: 'L', amount: 1 }])
    expect(marksFromColors(broken, solved).flatMap((c) => c.stickers)).toHaveLength(54)
  })
})
