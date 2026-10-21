import { describe, expect, it } from 'vitest'
import { shapeColors } from '@/lib/core/cube'
import { namedAs } from '@/lib/core/colorNames'

describe('color names', () => {
  it('names a shade plainly where the puzzle has no other shade of it', () => {
    // The Gear Cube Ultimate: dark green, no other green.
    expect(namedAs('E', shapeColors('gearU'))).toBe('G')
    expect(namedAs('V', shapeColors('gearU'))).toBe('V')
  })

  it('keeps a shade apart where the puzzle wears another', () => {
    const colors = ['G', 'E', 'L', 'B'] as const
    expect(namedAs('E', colors)).toBe('E')
    expect(namedAs('L', colors)).toBe('L')
    expect(namedAs('G', colors)).toBe('G')
    expect(namedAs('B', colors)).toBe('B')
  })
})
