import { describe, expect, it } from 'vitest'
import { cubeOrientations, solvedCube } from '@/lib/core/cube'
import { scrambleTurns } from '@/lib/core/moves'
import { applyMoves } from '@/lib/core/turn'
import { cubeToEdit } from '@/lib/editor/edit'
import { entryOf } from '@/lib/editor/entry'
import { scanPlan, type ScanFace } from '@/lib/editor/scan/plan'
import { readScan } from '@/lib/editor/scan/read'
import { sampleFace, type Pixels } from '@/lib/editor/scan/sample'
import type { Color, Cube } from '@/lib/core/types'
import type { CubeShape } from '@/lib/core/shapes'
import { facePicture, RGB } from './scanPictures'
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

/** A face's picture as a camera shows a real Ultimate's clips: black,
 *  each clip a thin bracket rimmed white round its point, in `color`. */
function clipsPicture(face: ScanFace, rgb: readonly number[]): Pixels {
  const scale = 100
  const [width, height] = [face.width * scale, face.height * scale]
  const data = new Uint8ClampedArray(width * height * 4)
  const clips = face.thin!.points.map((i) => face.points[i]!)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let pixel = [12, 12, 14]
      for (const [px, py] of clips) {
        const [dx, dy] = [Math.abs(x / scale - px), Math.abs(y / scale - py)]
        // Its bar and its legs: the edge of a square round its point.
        const edge = Math.max(dx, dy)
        if (edge > 0.12 && edge <= 0.14) pixel = [235, 235, 235]
        else if (edge > 0.14 && edge <= 0.17) pixel = [...rgb]
        else if (edge > 0.17 && edge <= 0.19) pixel = [235, 235, 235]
      }
      data.set([...pixel, 255], (y * width + x) * 4)
    }
  }
  return { width, height, data }
}

describe('scanning a Gear Cube whose clips bear colors', () => {
  it('reads a clip as the most colored of what is not black: its color, or white', () => {
    const face = scanPlan('gearU')[0]!
    const chroma = ({ lab: [, a, b] }: { lab: readonly number[] }) => Math.hypot(a!, b!)
    for (const rgb of [RGB.R, RGB.B, RGB.Y, RGB.G]) {
      const cells = sampleFace(clipsPicture(face, rgb), face)
      for (const i of face.thin!.points) expect(chroma(cells[i]!)).toBeGreaterThan(25)
    }
    const white = sampleFace(clipsPicture(face, RGB.W), face)
    for (const i of face.thin!.points) expect(chroma(white[i]!)).toBeLessThan(10)
  })

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
