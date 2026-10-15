import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { applyMoves } from '@/lib/core/turn'
import { parseMoves } from '@/lib/core/moves'
import { settingsOf, setupOf, setupTargets } from '@/lib/editor/setup'

describe('setups before the colors', () => {
  it('belong to the puzzles that click something first', () => {
    expect(setupOf('stripe')).toBe('joints')
    expect(setupOf('fashion')).toBe('cuts')
    expect(setupOf('roadblock')).toBe('bars')
    expect(['gearCube', 'gearU', 'gearX'].map((s) => setupOf(s as 'gearU'))).toEqual([
      'gears',
      'gears',
      'gears',
    ])
    expect(setupOf('3')).toBeNull()
  })

  it('light up what a click turns: a face of bars, a slice of gears, one Extreme gear', () => {
    // The front face's nine centers (x and y within the face, z at its edge).
    const front = setupTargets('bars', 'roadblock', '1,0,2')
    expect(front).toHaveLength(9)
    expect(front.every((k) => k.endsWith(',2'))).toBe(true)
    expect(setupTargets('gears', 'gearU', '1,1,0')).toHaveLength(4)
    expect(setupTargets('gears', 'gearX', '1,1,0')).toEqual(['1,1,0'])
  })

  it('reads its settings from a state: bars turned, gears pivoted', () => {
    expect(settingsOf(applyMoves(solvedCube('roadblock'), parseMoves('R'))).twisted).toEqual([
      '2,0,0',
    ])
    const spun = settingsOf(applyMoves(solvedCube('gearU'), [{ gear: 'R', amount: 1 }]))
    expect(Object.keys(spun.spins)).toHaveLength(4)
  })
})
