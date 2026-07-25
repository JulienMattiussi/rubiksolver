import { describe, expect, it } from 'vitest'
import { easeInOut } from '@/lib/easing'

describe('easeInOut', () => {
  it('pins the endpoints and midpoint', () => {
    expect(easeInOut(0)).toBe(0)
    expect(easeInOut(1)).toBe(1)
    expect(easeInOut(0.5)).toBeCloseTo(0.5)
  })

  it('is monotonically increasing', () => {
    let prev = -1
    for (let t = 0; t <= 1.0001; t += 0.1) {
      const v = easeInOut(t)
      expect(v).toBeGreaterThanOrEqual(prev)
      prev = v
    }
  })

  it('eases in (slower than linear early)', () => {
    expect(easeInOut(0.25)).toBeLessThan(0.25)
    expect(easeInOut(0.75)).toBeGreaterThan(0.75)
  })
})
