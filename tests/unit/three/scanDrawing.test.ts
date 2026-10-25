import { describe, expect, it } from 'vitest'
import type { CubeShape } from '@/lib/core/shapes'
import { gap, type Point } from '@/lib/editor/scan/layout'
import { scanPlan } from '@/lib/editor/scan/plan'
import { drawnFace } from '@/three/core/scanDrawing'

const DIAGONAL: readonly CubeShape[] = [
  'skewb',
  'ivy',
  'dino',
  'rex',
  'masterSkewb',
  'copter',
  'copter3',
  // Its squares, drawn in a frame of its own (`orient`).
  'rainbow',
]
const PYRAMIDS: readonly CubeShape[] = ['pyra', 'tetra', 'pyra4', 'pyra5', 'jing']

/** Whether a point lies inside a convex outline (either way round). */
function inside([x, y]: Point, outline: readonly Point[]) {
  const sides = outline.map(([ax, ay], i) => {
    const [bx, by] = outline[(i + 1) % outline.length]!
    return (bx - ax) * (y - ay) - (by - ay) * (x - ax)
  })
  return sides.every((s) => s >= 0) || sides.every((s) => s <= 0)
}

describe('a scanned face as its drawing shows it', () => {
  it.each(DIAGONAL)('reads each sticker of a %s inside its face, apart', (shape) => {
    for (const planned of scanPlan(shape)) {
      const face = drawnFace(shape, planned)
      expect(face.points).toHaveLength(planned.cells.length)
      for (const [x, y] of face.points) {
        expect(Math.min(x, y)).toBeGreaterThan(0)
        expect(Math.max(x, y)).toBeLessThan(2)
      }
      // Each point at least twice its reach from the next: no two stickers
      // read on the same pixels.
      face.points.forEach((p, i) =>
        face.points.slice(i + 1).forEach((q) => {
          expect(gap(p, q)).toBeGreaterThan(2 * face.reach)
        }),
      )
      expect(face.lines.length).toBeGreaterThan(0)
      if (face.center !== null) {
        const [x, y] = face.points[face.center]!
        expect(Math.hypot(x - 1, y - 1)).toBeLessThan(0.05)
      }
    }
  })

  // A pyramid's faces, triangles: each sticker inside its triangle, the
  // face drawn the way up and round the plan lays it, its stickers apart.
  it.each(PYRAMIDS)('reads each sticker of a %s inside its triangle, as planned', (shape) => {
    const plan = scanPlan(shape)
    expect(plan.map((f) => f.move)).toEqual(['first', 'spin', 'spin', 'topple'])
    for (const planned of plan) {
      expect(planned.outline).toHaveLength(3)
      expect(planned.turns).toHaveLength(3)
      const face = drawnFace(shape, planned)
      expect(face).not.toBe(planned)
      face.points.forEach((p, i) => expect(inside(p, face.outline), `${shape} ${i}`).toBe(true))
      // No other way it can be held fits the plan's places better.
      const off = (turn: readonly number[]) =>
        face.points.reduce((sum, p, i) => sum + gap(p, planned.points[turn[i]!]!), 0)
      const [held, ...others] = planned.turns.map(off)
      for (const other of others) expect(held).toBeLessThan(other)
      face.points.forEach((p, i) =>
        face.points.slice(i + 1).forEach((q) => {
          expect(gap(p, q)).toBeGreaterThan(2 * face.reach)
        }),
      )
      expect(face.lines.length).toBeGreaterThan(0)
    }
  })

  it('frames a flat face by what its stickers fill: a Tetraminx’s, its tips cut', () => {
    const corners = (shape: CubeShape) =>
      scanPlan(shape).map((f) => drawnFace(shape, f).outline.length)
    expect(corners('pyra')).toEqual([3, 3, 3, 3])
    expect(corners('tetra')).toEqual([6, 6, 6, 6])
  })

  it('reads each sticker of a Skewb Ultimate inside its pentagon', () => {
    const plan = scanPlan('skewbU')
    expect(new Set(plan.map((f) => f.frontColor)).size).toBe(12)
    for (const planned of plan) {
      const face = drawnFace('skewbU', planned)
      expect(face.outline).toHaveLength(5)
      face.points.forEach((p) => expect(inside(p, face.outline)).toBe(true))
    }
  })

  // An octahedron's faces, triangles (the GEM-0's, their corners cut).
  const OCTAHEDRA: readonly CubeShape[] = ['oct4', 'vto', 'gem', 'fto']
  it.each(OCTAHEDRA)('reads each sticker of a %s inside its triangle, as planned', (shape) => {
    const plan = scanPlan(shape)
    expect(plan.map((f) => f.move)).toEqual([
      'first',
      'turn',
      'turn',
      'turn',
      'upend',
      'turn',
      'turn',
      'turn',
    ])
    // Each of its eight faces once.
    expect(new Set(plan.map((f) => f.frontColor)).size).toBe(8)
    for (const planned of plan) {
      const face = drawnFace(shape, planned)
      expect(face).not.toBe(planned)
      face.points.forEach((p, i) => expect(inside(p, face.outline), `${shape} ${i}`).toBe(true))
      const off = (turn: readonly number[]) =>
        face.points.reduce((sum, p, i) => sum + gap(p, planned.points[turn[i]!]!), 0)
      const [held, ...others] = planned.turns.map(off)
      for (const other of others) expect(held).toBeLessThan(other)
    }
  })

  it('leaves a grid face as the plan lays it', () => {
    const face = scanPlan('3')[0]!
    expect(drawnFace('3', face)).toBe(face)
  })
})
