import { describe, expect, it } from 'vitest'
import { formatMove, NOTATION_FR, NOTATION_US } from '@/lib/core/moves'
import type { Move } from '@/lib/core/types'

const R: Move = { face: 'R', amount: 1 }

describe('the 4x4 notation (Rubik’s guide)', () => {
  it('writes the inner slice in lowercase and both layers as two letters', () => {
    const write = (move: Move) => formatMove(move, NOTATION_US, [4, 4, 4], '4')
    expect(write(R)).toBe('R')
    expect(write({ ...R, depth: 2, amount: 3 })).toBe("r'")
    expect(write({ ...R, depth: 2, wide: true, amount: 2 })).toBe('Rr2')
  })

  it('does the same in French notation, and on the Super Revenge', () => {
    expect(formatMove({ ...R, depth: 2 }, NOTATION_FR, [4, 4, 4], '4')).toBe('d')
    expect(
      formatMove({ face: 'U', amount: 1, depth: 2, wide: true }, NOTATION_FR, [4, 4, 4], 'super4'),
    ).toBe('Hh')
  })

  it('leaves the other big cubes as they are', () => {
    expect(formatMove({ ...R, depth: 2 }, NOTATION_US, [5, 5, 5], '5')).toBe('2R')
  })
})
