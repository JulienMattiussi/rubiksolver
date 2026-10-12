import { describe, expect, it } from 'vitest'
import { FACE_COLOR, stickersOfColor } from '@/lib/cube'
import { isPolyDrawn, SHAPE_DIMS, type CubeShape, type CubeVariant } from '@/lib/types'
import { isometricDrawing } from '@/three/isometric'

// Grid puzzles; the gridless ones have their own drawing (tested below).
const SHAPES = (Object.keys(SHAPE_DIMS) as CubeShape[]).filter((shape) => !isPolyDrawn(shape))

describe('isometric thumbnails', () => {
  it.each(SHAPES)('%s: draws every facelet of its U, F and R faces, body then sticker', (shape) => {
    const visible = (['U', 'F', 'R'] as const).reduce(
      (n, face) => n + stickersOfColor(shape, FACE_COLOR[face]),
      0,
    )
    for (const variant of ['classic', 'mirror'] as CubeVariant[]) {
      const { polygons, viewBox } = isometricDrawing(shape, variant)
      expect(polygons).toHaveLength(2 * visible)
      expect(polygons.filter((p) => p.paint === 'body')).toHaveLength(visible)
      expect(viewBox.split(' ').map(Number).every(Number.isFinite)).toBe(true)
    }
  })

  it('shades the sides darker than the top', () => {
    const { polygons } = isometricDrawing('3', 'classic')
    const shadeOf = (color: string) => polygons.find((p) => p.paint === color)!.shade
    expect(shadeOf(FACE_COLOR.U)).toBe(0)
    expect(shadeOf(FACE_COLOR.F)).toBeGreaterThan(0)
    expect(shadeOf(FACE_COLOR.R)).toBeGreaterThan(shadeOf(FACE_COLOR.F))
  })
})

describe('isometric thumbnail cache', () => {
  it('computes each drawing once, then hands the same one back', () => {
    expect(isometricDrawing('4', 'mirror')).toBe(isometricDrawing('4', 'mirror'))
    expect(isometricDrawing('4', 'mirror')).not.toBe(isometricDrawing('4', 'classic'))
  })
})

describe('gridless thumbnails', () => {
  it.each(['star', 'star4', 'pyra', 'pyra4', 'jing', 'morph'] as const)(
    '%s: draws the faces turned toward the viewer, with their stickers',
    (shape) => {
      const { polygons, viewBox } = isometricDrawing(shape, 'classic')
      expect(polygons.some((p) => p.paint === 'G')).toBe(true) // the star's top, the Pyraminx's front
      expect(polygons.some((p) => p.paint === 'body')).toBe(true)
      expect(viewBox.split(' ').map(Number).every(Number.isFinite)).toBe(true)
    },
  )
})
