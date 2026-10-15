import { describe, expect, it } from 'vitest'
import { permutationIsOdd } from '@/lib/solve/permutation'

describe('permutationIsOdd', () => {
  it('reads a list of images', () => {
    expect(permutationIsOdd([])).toBe(false)
    expect(permutationIsOdd([0, 1, 2])).toBe(false)
    expect(permutationIsOdd([1, 0, 2])).toBe(true)
    expect(permutationIsOdd([1, 2, 0])).toBe(false)
    expect(permutationIsOdd([1, 2, 3, 0])).toBe(true)
    expect(permutationIsOdd([1, 0, 3, 2])).toBe(false)
  })

  it('reads a map of slots', () => {
    expect(permutationIsOdd(new Map([['a', 'a']]))).toBe(false)
    expect(
      permutationIsOdd(
        new Map([
          ['a', 'b'],
          ['b', 'a'],
        ]),
      ),
    ).toBe(true)
    expect(
      permutationIsOdd(
        new Map([
          ['a', 'b'],
          ['b', 'c'],
          ['c', 'a'],
        ]),
      ),
    ).toBe(false)
  })
})
