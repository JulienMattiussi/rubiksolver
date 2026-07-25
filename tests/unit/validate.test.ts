import { describe, expect, it } from 'vitest'
import { applyMoves, solvedCube } from '@/lib/cube'
import { buildCube, cubeToEdit } from '@/lib/editor'
import { scramble } from '@/lib/moves'
import { validateCube } from '@/lib/validate'
import type { Color } from '@/lib/types'
import { seededRng, twistedCorner2 } from '../helpers'

/** Rebuild a cube from solved with some stickers recolored. */
function withStickers(overrides: Record<string, Color>) {
  return buildCube({ ...cubeToEdit(solvedCube()), ...overrides }, 3)
}

/** Same for a 2x2. */
function withStickers2(overrides: Record<string, Color>) {
  return buildCube({ ...cubeToEdit(solvedCube(2)), ...overrides }, 2)
}

describe('validateCube', () => {
  it('accepts the solved cube', () => {
    expect(validateCube(solvedCube())).toEqual({ ok: true })
  })

  it('accepts random scrambles', () => {
    const rng = seededRng(77)
    for (let i = 0; i < 5; i++) {
      const cube = applyMoves(solvedCube(), scramble(20, rng))
      expect(validateCube(cube)).toEqual({ ok: true })
    }
  }, 60000)

  it('rejects wrong color counts', () => {
    // Recolor one green sticker to red: red = 10, green = 8.
    expect(validateCube(withStickers({ '1,0,1:4': 'R' }))).toEqual({ ok: false, error: 'counts' })
  })

  it('rejects a single flipped edge', () => {
    // Edge (1,0,1): +x is red, +z is green in solved. Swap them.
    expect(validateCube(withStickers({ '1,0,1:0': 'G', '1,0,1:4': 'R' }))).toEqual({
      ok: false,
      error: 'impossible',
    })
  }, 30000)

  it('rejects a single twisted corner', () => {
    // Corner (1,1,1): +x=R, +y=W, +z=G. Cycle the colors around the piece.
    expect(validateCube(withStickers({ '1,1,1:0': 'G', '1,1,1:2': 'R', '1,1,1:4': 'W' }))).toEqual({
      ok: false,
      error: 'impossible',
    })
  }, 30000)

  it('rejects two swapped edges', () => {
    // Swap edges (1,0,1)=R,G and (1,0,-1)=R,B (a single transposition).
    expect(validateCube(withStickers({ '1,0,1:4': 'B', '1,0,-1:5': 'G' }))).toEqual({
      ok: false,
      error: 'impossible',
    })
  }, 30000)
})

describe('validateCube (2x2)', () => {
  it('accepts the solved cube and random scrambles', () => {
    expect(validateCube(solvedCube(2))).toEqual({ ok: true })
    const rng = seededRng(31)
    for (let i = 0; i < 5; i++) {
      const cube = applyMoves(solvedCube(2), scramble(11, rng))
      expect(validateCube(cube)).toEqual({ ok: true })
    }
  }, 60000)

  it('rejects wrong color counts', () => {
    // Recolor one green sticker to red: red = 5, green = 3.
    expect(validateCube(withStickers2({ '1,1,1:4': 'R' }))).toEqual({ ok: false, error: 'counts' })
  })

  it('rejects a single twisted corner', () => {
    expect(validateCube(twistedCorner2())).toEqual({ ok: false, error: 'impossible' })
  }, 30000)
})
