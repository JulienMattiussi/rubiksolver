import { describe, expect, it } from 'vitest'
import { cubeOrientations, solvedCube } from '@/lib/core/cube'
import { scrambleTurns } from '@/lib/core/moves'
import { applyMoves } from '@/lib/core/turn'
import { cubeToEdit } from '@/lib/editor/edit'
import { entryOf } from '@/lib/editor/entry'
import { scanPlan } from '@/lib/editor/scan/plan'
import { readScan } from '@/lib/editor/scan/read'
import { sampleFace } from '@/lib/editor/scan/sample'
import type { Color, Cube } from '@/lib/core/types'
import type { CubeShape } from '@/lib/core/shapes'
import { facePicture } from './scanPictures'
import { seededRng } from '../../helpers'

/** A scrambled Gear Cube, its gears lined up as the scan asks (each at
 *  rest on its clips, or turned over on them). */
function lined(shape: CubeShape, seed: number): Cube {
  const solved = solvedCube(shape)
  const cube = applyMoves(solved, scrambleTurns(shape, 20, seededRng(seed), solved)).map((c) =>
    c.spin === undefined ? c : { ...c, spin: c.spin >= 3 ? 3 : 0 },
  )
  // Held as the instructions say, each face's center toward the lens in
  // its turn (the Extreme's slices move them).
  const plan = scanPlan(shape)
  return cubeOrientations(cube).find((held) => {
    const edit = cubeToEdit(held)
    return plan.every((face) => !face.told || edit[face.cells[face.center!]!] === face.frontColor)
  })!
}

/** Each face as a camera takes it: its clips' and its gears' colors. */
function scanOf(shape: CubeShape, cube: Cube, seed: number, behind = false) {
  const rng = seededRng(seed)
  const edit = cubeToEdit(cube)
  const gears = entryOf(shape).paint.parts!.of(cube)
  const colorOf = (id: string): Color =>
    id.startsWith('gear:') ? gears[id.slice('gear:'.length)]! : edit[id]!
  return scanPlan(shape, 'classic', behind).map((face) =>
    sampleFace(facePicture(face.cells.map(colorOf), face, rng), face),
  )
}

describe('scanning a Gear Cube whose clips bear colors', () => {
  it.each(['gearU', 'gearX'] as const)('reads each edge on its clip and its gear: %s', (shape) => {
    for (const face of scanPlan(shape)) {
      const gears = face.cells.filter((id) => id.startsWith('gear:'))
      // The Extreme's middle layer holds no gears.
      expect(gears.length).toBe(
        shape === 'gearU' || face.frontColor === 'W' || face.frontColor === 'Y' ? 4 : 2,
      )
    }
  })

  it.each(['gearU', 'gearX'] as const)('reads a scrambled %s, its gears lined up', (shape) => {
    for (const seed of [1, 2, 3]) {
      const cube = lined(shape, seed)
      for (const behind of [false, true]) {
        const reading = readScan(shape, scanOf(shape, cube, seed, behind), behind)
        expect(reading).toEqual({
          ok: true,
          edit: cubeToEdit(cube),
          parts: entryOf(shape).paint.parts!.of(cube),
        })
      }
    }
  })
})
