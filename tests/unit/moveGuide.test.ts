import { describe, expect, it } from 'vitest'
import { describeMove, moveGuide } from '@/lib/moveGuide'
import { formatMove, movesFor, NOTATION_US, sameLayer } from '@/lib/moves'
import { LOCALES } from '@/i18n/translations'
import { SHAPE_DIMS, type CubeShape } from '@/lib/types'

/** The guide as notation: one string per section, rows separated by `|`. */
function written(shape: CubeShape): Record<string, string> {
  const dims = SHAPE_DIMS[shape]
  return Object.fromEntries(
    moveGuide(shape).map((g) => [
      g.section,
      g.rows.map((row) => row.map((t) => formatMove(t, NOTATION_US, dims)).join(' ')).join(' | '),
    ]),
  )
}

describe('move guide', () => {
  it('pairs each quarter turn with its opposite, then shows the half turn', () => {
    expect(written('2')).toEqual({
      faces: "U U' | U2 | D D' | D2 | L L' | L2 | R R' | R2 | F F' | F2 | B B' | B2",
    })
  })

  it("adds the 3x3's advanced turns: its middle slices and wide turns", () => {
    const guide = written('3')
    expect(guide.middle).toBe("M M' | M2 | E E' | E2 | S S' | S2")
    expect(guide.wide!.split(' | ')).toHaveLength(12)
  })

  it('offers the 4x4 its slices and wide turns, each face once', () => {
    const guide = written('4')
    expect(Object.keys(guide)).toEqual(['faces', 'slices', 'wide'])
    expect(guide.slices!.split(' | ')).toHaveLength(12)
    expect(guide.wide!.split(' | ')).toHaveLength(12)
  })

  it('shows half turns alone where the shape has no quarter turn', () => {
    expect(written('123')).toEqual({ faces: 'U2 | D2 | L2 | R2' })
  })

  it('walks a star prism ring by ring: one notch, two, then the half turn', () => {
    expect(written('star')).toEqual({
      rings: '1 -1 | 2 -2 | 3 | D -D | 2D -2D | 3D',
      slash: '/',
    })
    expect(written('star4').rings).toBe(
      '1 -1 | 2 -2 | 3 | u -u | 2u -2u | 3u | d -d | 2d -2d | 3d | D -D | 2D -2D | 3D',
    )
  })
})

describe('move descriptions', () => {
  const dims3 = SHAPE_DIMS['3']

  it('reads the layer, the face and the direction of a face turn', () => {
    expect(describeMove({ face: 'R', amount: 3 }, dims3)).toEqual({
      kind: 'face',
      face: 'R',
      turn: 'ccw',
    })
    expect(describeMove({ face: 'L', amount: 2, depth: 2 }, dims3)).toEqual({
      kind: 'middle',
      face: 'L',
      turn: 'half',
    })
    expect(describeMove({ face: 'R', amount: 1, depth: 2 }, SHAPE_DIMS['4'])).toMatchObject({
      kind: 'slice',
    })
  })

  it('counts a star turn in notches, the short way round', () => {
    expect(describeMove({ ring: 'D', amount: 4 }, SHAPE_DIMS.star)).toEqual({
      kind: 'ring',
      ring: 'D',
      pieces: 2,
      clockwise: false,
    })
    expect(describeMove({ slash: true }, SHAPE_DIMS.star)).toEqual({ kind: 'slash' })
  })
})

describe('the guide of every puzzle', () => {
  it.each(Object.keys(SHAPE_DIMS) as CubeShape[])(
    '%s: every pad turn is in it, each with a sentence in both languages',
    (shape) => {
      const dims = SHAPE_DIMS[shape]
      const turns = moveGuide(shape).flatMap((g) => g.rows.flat())
      expect(turns.length).toBeGreaterThan(0)
      for (const turn of movesFor(shape)) {
        expect(
          turns.some((t) => sameLayer(t, turn) && 'amount' in t && t.amount === turn.amount),
        ).toBe(true)
      }
      for (const turn of turns) {
        for (const t of [LOCALES.fr, LOCALES.en]) {
          const sentence = t.describeMove(describeMove(turn, dims))
          expect(sentence).not.toMatch(/undefined|NaN/)
        }
      }
    },
  )
})
