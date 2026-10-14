import { describe, expect, it } from 'vitest'
import { describeMove, moveGuide } from '@/lib/app/moveGuide'
import { formatMove, NOTATION_US } from '@/lib/core/moves'
import { LOCALES } from '@/i18n/translations'
import { SHAPE_DIMS, type CubeShape } from '@/lib/core/types'

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
  it('reads the layer, the face and the direction of a face turn', () => {
    expect(describeMove({ face: 'R', amount: 3 }, '3')).toEqual({
      kind: 'face',
      face: 'R',
      turn: 'ccw',
    })
    expect(describeMove({ face: 'L', amount: 2, depth: 2 }, '3')).toEqual({
      kind: 'middle',
      face: 'L',
      turn: 'half',
    })
    expect(describeMove({ face: 'R', amount: 1, depth: 2 }, '4')).toMatchObject({
      kind: 'slice',
    })
  })

  it('calls a wide turn on four layers what it is: half the puzzle', () => {
    const rw = { face: 'R', amount: 1, depth: 2, wide: true } as const
    expect(describeMove(rw, '224')).toMatchObject({ kind: 'wide', halfPuzzle: true })
    expect(describeMove(rw, '4')).toMatchObject({ halfPuzzle: true })
    expect(describeMove(rw, '3')).not.toHaveProperty('halfPuzzle')
    expect(LOCALES.fr.describeMove(describeMove(rw, '224'))).toBe(
      'On tourne toute la moitié droite du puzzle d’un quart de tour dans le sens des aiguilles d’une montre, vu depuis la face de droite.',
    )
  })

  it('counts a star turn in notches, the short way round', () => {
    expect(describeMove({ ring: 'D', amount: 4 }, 'star')).toEqual({
      kind: 'ring',
      ring: 'D',
      pieces: 2,
      clockwise: false,
    })
    expect(describeMove({ slash: true }, 'star')).toEqual({ kind: 'slash' })
  })
})
