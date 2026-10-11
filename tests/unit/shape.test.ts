import { describe, expect, it } from 'vitest'
import { FACE_COLOR, OPPOSITE_COLOR, solvedCube } from '@/lib/cube'
import { layerCoords, rotateN } from '@/lib/geometry'
import { applyMove, turnedBy, turnRotation } from '@/lib/turn'
import { scramble } from '@/lib/moves'
import { byThickness, centeringOffset, cubieBox, LAYER_THICKNESS, UNIT_BOX } from '@/lib/shape'
import { SHAPE_DIMS } from '@/lib/types'
import type { Color, CubeShape, CubeVariant } from '@/lib/types'
import { seededRng } from '../helpers'

/** The mirror variant only applies where every axis has layers to thicken. */
const SHAPES: readonly CubeShape[] = ['2', '3', '4']
const VARIANTS: readonly CubeVariant[] = ['classic', 'mirror']

/** Visual cell center of a logical coordinate (see three/layout.ts). */
function cellCenter(coord: number, n: number): number {
  return layerCoords(n).indexOf(coord) - (n - 1) / 2
}

describe('layer thickness tables', () => {
  it.each(VARIANTS)('%s: opposite colors sum to 2, so a solved cube is a cube', (variant) => {
    const thickness = LAYER_THICKNESS[variant]
    for (const [color, opposite] of Object.entries(OPPOSITE_COLOR) as [Color, Color][]) {
      expect(thickness[color] + thickness[opposite]).toBeCloseTo(2)
    }
  })

  it('gives the plain cubie back on the classic variant', () => {
    for (const cubie of solvedCube('3')) {
      expect(cubieBox(cubie.stickers, LAYER_THICKNESS.classic)).toEqual(UNIT_BOX)
    }
  })

  it('gives every color its own mirror thickness, so a shape names its piece', () => {
    // What makes painting thicknesses equivalent to painting colors.
    const values = Object.values(LAYER_THICKNESS.mirror)
    expect(new Set(values).size).toBe(values.length)
    expect(byThickness(LAYER_THICKNESS.mirror)).toEqual(['O', 'Y', 'B', 'G', 'W', 'R'])
  })

  it('grows a mirror cubie outward from its inner face', () => {
    // The URF corner of a solved cube wears the R, U and F layers; whatever
    // their thickness, each box starts at the cell's inner face (-0.5).
    const corner = solvedCube('3').find((c) => c.position.every((p) => p === 1))!
    const { size, center } = cubieBox(corner.stickers, LAYER_THICKNESS.mirror)
    const expected = (['R', 'U', 'F'] as const).map((f) => LAYER_THICKNESS.mirror[FACE_COLOR[f]])
    for (const a of [0, 1, 2] as const) {
      expect(size[a]).toBe(expected[a])
      expect(center[a] - size[a] / 2).toBeCloseTo(-0.5)
    }
  })
})

describe('mirror geometry', () => {
  it.each(SHAPES)('%s: a solved cube tiles a perfect cube, gapless', (shape) => {
    const n = SHAPE_DIMS[shape][0]
    const [ox] = centeringOffset(LAYER_THICKNESS.mirror)
    // Group the x-intervals by layer: a layer must be one solid slab, and the
    // slabs must tile [-n/2, n/2] end to end once recentered.
    const layers = new Map<number, [number, number]>()
    for (const cubie of solvedCube(shape)) {
      const { size: box, center } = cubieBox(cubie.stickers, LAYER_THICKNESS.mirror)
      const mid = cellCenter(cubie.position[0], n) + center[0] + ox
      const span: [number, number] = [mid - box[0] / 2, mid + box[0] / 2]
      const seen = layers.get(cubie.position[0])
      if (seen) {
        expect(seen[0]).toBeCloseTo(span[0])
        expect(seen[1]).toBeCloseTo(span[1])
      } else layers.set(cubie.position[0], span)
    }

    const spans = [...layers.entries()].sort(([a], [b]) => a - b).map(([, span]) => span)
    expect(spans).toHaveLength(n)
    expect(spans[0]![0]).toBeCloseTo(-n / 2)
    expect(spans.at(-1)![1]).toBeCloseTo(n / 2)
    for (let i = 1; i < spans.length; i++) expect(spans[i]![0]).toBeCloseTo(spans[i - 1]![1])
  })

  it.each(SHAPES)('%s: a turn moves the boxes rigidly', (shape) => {
    // The renderer recomputes every box from the stickers after a move; that
    // must give exactly the boxes it just animated, rotated. Otherwise pieces
    // would jump at the end of each turn.
    let cube = solvedCube(shape)
    for (const move of scramble(shape, 30, seededRng(7))) {
      const before = cube.map((c) => cubieBox(c.stickers, LAYER_THICKNESS.mirror))
      const geo = turnRotation(move)
      const quarters = Math.round(geo.angle / (Math.PI / 2))
      const turned = turnedBy(cube, move)
      cube = applyMove(cube, move)

      cube.forEach((cubie, i) => {
        const now = cubieBox(cubie.stickers, LAYER_THICKNESS.mirror)
        const was = before[i]!
        // Only the turning layer moved; the rest must be untouched.
        const spun = rotateN(was.size, geo.axis, quarters)
        const size = turned(i) ? ([...spun].map(Math.abs) as [number, number, number]) : was.size
        const center = turned(i) ? rotateN(was.center, geo.axis, quarters) : was.center
        for (const a of [0, 1, 2] as const) {
          expect(now.size[a]).toBeCloseTo(size[a])
          expect(now.center[a]).toBeCloseTo(center[a])
        }
      })
    }
  })
})
