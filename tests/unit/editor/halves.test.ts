import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { scrambleTurns } from '@/lib/core/moves'
import { applyMoves } from '@/lib/core/turn'
import { normalIndex } from '@/lib/core/geometry'
import { stickerId } from '@/lib/editor/editorTables'
import { scannable, orderFor, scanPlan } from '@/lib/editor/scan/plan'
import { readScan } from '@/lib/editor/scan/read'
import { subStickers } from '@/lib/editor/scan/halves'
import { sampleFace } from '@/lib/editor/scan/sample'
import { FASHION_CUTS } from '@/lib/puzzles/twisted/fashionEntry'
import type { Color, Cube } from '@/lib/core/types'
import { facePicture } from './scanPictures'
import { seededRng } from '../../helpers'

/** Each face of a Fashion-V as a camera takes it: its 6 x 6 sub-cells,
 *  each the color of the sticker filling it. */
function scanOf(cube: Cube, seed: number, behind = false) {
  const rng = seededRng(seed)
  const colors = new Map(
    cube.flatMap((c) =>
      c.stickers.map((s) => [stickerId(c.position, normalIndex(s.normal)), s.color] as const),
    ),
  )
  return scanPlan('fashion', 'classic', behind).map((face, f) => {
    const { front, up } = orderFor(behind)[f]!
    const shown = subStickers(cube, front, up).map((id) => colors.get(id) as Color)
    return sampleFace(facePicture(shown, face, rng), face)
  })
}

const scrambled = (seed: number) => {
  const solved = solvedCube('fashion')
  return applyMoves(solved, scrambleTurns('fashion', 30, seededRng(seed), solved))
}

/** Each sticker's color, by id. */
const colorsOf = (cube: Cube) =>
  Object.fromEntries(
    cube.flatMap((c) =>
      c.stickers.map((s) => [stickerId(c.position, normalIndex(s.normal)), s.color]),
    ),
  )

describe('scanning a Fashion-V', () => {
  it('takes each face as 6 x 6, its center telling it', () => {
    expect(scannable('fashion')).toBe(true)
    for (const face of scanPlan('fashion')) {
      expect(face.cells).toHaveLength(36)
      expect(face.told).toBe(true)
    }
  })

  it('shows each sub-cell of the solved puzzle in its face color', () => {
    const solved = solvedCube('fashion')
    const colors = colorsOf(solved)
    orderFor(false).forEach(({ front, up }, f) => {
      const shown = subStickers(solved, front, up)
      expect(shown.every((id) => id)).toBe(true)
      expect(new Set(shown.map((id) => colors[id]))).toEqual(
        new Set([scanPlan('fashion')[f]!.frontColor]),
      )
    })
  })

  it.each([1, 2, 3, 4, 5, 6])('finds the halves and the colors of a scrambled one (%i)', (seed) => {
    const cube = scrambled(seed)
    for (const behind of [false, true]) {
      const reading = readScan('fashion', scanOf(cube, seed, behind), behind)
      expect(reading.ok).toBe(true)
      if (!reading.ok) return
      expect(FASHION_CUTS.of(reading.form!)).toEqual(FASHION_CUTS.of(cube))
      const read = Object.fromEntries(Object.entries(reading.edit).filter(([, c]) => c))
      expect(read).toEqual(
        Object.fromEntries(Object.entries(colorsOf(cube)).filter(([id]) => id in read)),
      )
    }
  })
})
