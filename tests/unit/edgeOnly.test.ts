import { describe, expect, it } from 'vitest'
import { cubeShape, solvedCube } from '@/lib/cube'
import { validateCube } from '@/lib/validate'

const SOLVED = solvedCube('edge')

describe('Edge Only', () => {
  it('is a 3x3’s twelve edges about a hidden core, told from the Dino Cube', () => {
    expect(SOLVED.filter((c) => c.stickers.length === 2)).toHaveLength(12)
    expect(SOLVED.filter((c) => c.stickers.length !== 2)).toHaveLength(1)
    expect(cubeShape(SOLVED)).toBe('edge')
    expect(cubeShape(solvedCube('dino'))).toBe('dino')
  })

  it('rejects a single edge turned over, whichever way it is held', () => {
    const flipped = SOLVED.map((c) =>
      c.position.join() === '0,1,1'
        ? { ...c, stickers: c.stickers.map((s, i) => ({ ...s, color: c.stickers[1 - i]!.color })) }
        : c,
    )
    expect(validateCube(flipped)).toMatchObject({ ok: false, error: 'impossible' })
  })
})
