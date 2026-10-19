import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { applyMove, applyMoves } from '@/lib/core/turn'
import { buildCube, cubeToEdit } from '@/lib/editor/edit'
import { scramble } from '@/lib/core/moves'
import { solve } from '@/lib/solve/solver'
import { validateCube } from '@/lib/editor/validate'
import type { Color, CubeShape } from '@/lib/core/types'
import { seededRng, twistedCorner, twistedCorner2 } from '../../helpers'

/** Rebuild a cube from solved with some stickers recolored. */
function withStickersOn(size: CubeShape, overrides: Record<string, Color>) {
  return buildCube({ ...cubeToEdit(solvedCube(size)), ...overrides }, size)
}

const withStickers = (overrides: Record<string, Color>) => withStickersOn('3', overrides)
const withStickers2 = (overrides: Record<string, Color>) => withStickersOn('2', overrides)
const withStickers4 = (overrides: Record<string, Color>) => withStickersOn('4', overrides)

describe('validateCube', () => {
  it('rejects wrong color counts', () => {
    // Recolor one green sticker to red: red = 10, green = 8.
    expect(validateCube(withStickers({ '1,0,1:4': 'R' }))).toEqual({ ok: false, error: 'counts' })
  })

  it('rejects a single flipped edge', () => {
    // Edge (1,0,1): +x is red, +z is green in solved. Swap them.
    expect(validateCube(withStickers({ '1,0,1:0': 'G', '1,0,1:4': 'R' }))).toMatchObject({
      ok: false,
      error: 'impossible',
    })
  }, 30000)

  it('rejects a single twisted corner', () => {
    // Corner (1,1,1): +x=R, +y=W, +z=G. Cycle the colors around the piece.
    expect(
      validateCube(withStickers({ '1,1,1:0': 'G', '1,1,1:2': 'R', '1,1,1:4': 'W' })),
    ).toMatchObject({
      ok: false,
      error: 'impossible',
    })
  }, 30000)

  it('rejects two swapped edges', () => {
    // Swap edges (1,0,1)=R,G and (1,0,-1)=R,B (a single transposition).
    expect(validateCube(withStickers({ '1,0,1:4': 'B', '1,0,-1:5': 'G' }))).toMatchObject({
      ok: false,
      error: 'impossible',
    })
  }, 30000)
})

describe('validateCube (2x2)', () => {
  it('rejects wrong color counts', () => {
    // Recolor one green sticker to red: red = 5, green = 3.
    expect(validateCube(withStickers2({ '1,1,1:4': 'R' }))).toEqual({ ok: false, error: 'counts' })
  })

  it('rejects a single twisted corner', () => {
    expect(validateCube(twistedCorner2())).toMatchObject({ ok: false, error: 'impossible' })
  }, 30000)
})

describe('validateCube (4x4)', () => {
  it('accepts a lone inner slice turn (a legal parity-looking state)', () => {
    // One inner quarter turn is legal on a real 4x4 even though its projection
    // would be an impossible 3x3: validation must not reject it.
    const cube = applyMove(solvedCube('4'), { face: 'R', amount: 1, depth: 2 })
    expect(validateCube(cube)).toEqual({ ok: true })
  })

  it('rejects wrong color counts', () => {
    // Recolor one white center to red: red = 17, white = 15.
    expect(validateCube(withStickers4({ '1,3,1:2': 'R' }))).toEqual({ ok: false, error: 'counts' })
  })

  it('rejects a single twisted corner', () => {
    expect(validateCube(twistedCorner('4'))).toMatchObject({ ok: false, error: 'impossible' })
  }, 30000)

  it('rejects a flipped wing (its chiral twin would be used twice)', () => {
    // Swapping the two stickers of one wing shows the disposition of its
    // twin, which already sits on the other UF cell: duplicate piece.
    expect(validateCube(withStickers4({ '1,3,3:2': 'G', '1,3,3:4': 'W' }))).toMatchObject({
      ok: false,
      error: 'impossible',
    })
  })

  it('rejects a non-existent piece (opposite colors on one wing)', () => {
    // Trade a wing sticker for a center sticker: counts stay right, but a
    // white-yellow wing does not exist on a real cube.
    expect(validateCube(withStickers4({ '1,3,3:4': 'Y', '1,-3,1:3': 'G' }))).toMatchObject({
      ok: false,
      error: 'impossible',
    })
  })

  it('agrees with the solver on random scrambles (cross-check)', () => {
    const rng = seededRng(59)
    for (let i = 0; i < 2; i++) {
      const cube = applyMoves(solvedCube('4'), scramble('4', 40, rng))
      expect(validateCube(cube)).toEqual({ ok: true })
      expect(isSolved(applyMoves(cube, solve(cube)))).toBe(true)
    }
  }, 120000)
})

describe('validateCube (tower and Domino)', () => {
  it.each(['224', '332'] as CubeShape[])(
    '%s: accepts scrambles, rejects a twisted corner',
    (shape) => {
      const rng = seededRng(61)
      for (let i = 0; i < 3; i++) {
        expect(validateCube(applyMoves(solvedCube(shape), scramble(shape, 20, rng)))).toEqual({
          ok: true,
        })
      }
      expect(validateCube(twistedCorner(shape))).toMatchObject({ ok: false, error: 'impossible' })
    },
  )
})
