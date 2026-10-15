import { describe, expect, it } from 'vitest'
import { mapVec, parseVecKey, vecKey } from '@/lib/core/geometry'

describe('vector helpers', () => {
  it('maps each coordinate with its axis', () => {
    expect(mapVec([1, -2, 3], (x) => 2 * x)).toEqual([2, -4, 6])
    expect(mapVec([0, 1, 2], (d, axis) => (d === axis ? 1 : 0))).toEqual([1, 1, 1])
    expect(mapVec([5, 5, 5], (_, axis) => axis)).toEqual([0, 1, 2])
  })

  it('keys a position by its coordinates joined by commas', () => {
    expect(vecKey([1, -3, 0])).toBe('1,-3,0')
  })

  it('reads a key back into its position', () => {
    expect(parseVecKey('1,-3,0')).toEqual([1, -3, 0])
    for (const p of [
      [0, 0, 0],
      [-1, 2, -3],
      [4, -4, 1],
    ] as const) {
      expect(parseVecKey(vecKey(p))).toEqual(p)
    }
  })
})
