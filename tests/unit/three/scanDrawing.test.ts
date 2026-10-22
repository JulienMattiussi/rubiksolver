import { describe, expect, it } from 'vitest'
import type { CubeShape } from '@/lib/core/shapes'
import { scanPlan } from '@/lib/editor/scan/plan'
import { drawnFace } from '@/three/core/scanDrawing'

const DIAGONAL: readonly CubeShape[] = ['skewb', 'dino', 'rex', 'masterSkewb', 'copter', 'copter3']

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
          expect(Math.hypot(p[0] - q[0], p[1] - q[1])).toBeGreaterThan(2 * face.reach)
        }),
      )
      expect(face.lines.length).toBeGreaterThan(0)
      if (face.center !== null) {
        const [x, y] = face.points[face.center]!
        expect(Math.hypot(x - 1, y - 1)).toBeLessThan(0.05)
      }
    }
  })

  it('leaves a grid face as the plan lays it', () => {
    const face = scanPlan('3')[0]!
    expect(drawnFace('3', face)).toBe(face)
  })
})
