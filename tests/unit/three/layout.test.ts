import { describe, expect, it } from 'vitest'
import { cubeDims, solvedCube } from '@/lib/core/cube'
import { applyMoves } from '@/lib/core/turn'
import { parseMoves } from '@/lib/core/notation'
import type { CubeShape } from '@/lib/core/shapes'
import { visualPosition } from '@/three/core/layout'

const cellsOf = (shape: CubeShape, moves = '') => {
  const cube = applyMoves(solvedCube(shape), parseMoves(moves))
  return cube.map((c) => visualPosition(c.position, cubeDims(cube)).join(','))
}

describe('visual layout', () => {
  it('puts every piece of a boxed puzzle in its own unit cell, centered', () => {
    for (const shape of ['2', '3', '4', '123', '224'] as CubeShape[]) {
      const cells = cellsOf(shape)
      expect(new Set(cells).size).toBe(cells.length)
    }
    expect(visualPosition([3, -1, 1], [4, 4, 4])).toEqual([1.5, -0.5, 0.5])
    expect(visualPosition([1, 0, -1], [3, 3, 3])).toEqual([1, 0, -1])
  })

  it('keeps a shape-shifted tower piece where it stands, out of the box', () => {
    // After Rw the tower's right half lies down: its tall corners reach z = +-3.
    const cells = cellsOf('224', 'Rw')
    expect(new Set(cells).size).toBe(cells.length)
    expect(cells).toContain('0.5,0.5,1.5')
    expect(cells).toContain('0.5,-0.5,-1.5')
  })
})
