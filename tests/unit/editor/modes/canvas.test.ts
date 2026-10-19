import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { scrambleTurns } from '@/lib/core/moves'
import { applyMoves } from '@/lib/core/turn'
import { cubeToEdit } from '@/lib/editor/edit'
import {
  canvasesOf,
  editOfCanvases,
  joinKey,
  paintCanvas,
  regionsOf,
  showsCanvases,
  toggleJoin,
  viewsOfCanvases,
  type Canvas,
} from '@/lib/editor/modes/canvas'
import { heldAs } from '@/lib/editor/modes/faceViews'
import { stepOf } from '@/lib/editor/entry'
import type { CubeShape } from '@/lib/core/shapes'
import { seededRng } from '../../../helpers'

const entryOf = (shape: CubeShape) => stepOf(shape, 'canvas')!.faces
const scrambled = (shape: CubeShape, seed: number) => {
  const solved = solvedCube(shape)
  return applyMoves(solved, scrambleTurns(shape, 40, seededRng(seed), solved))
}

describe('a shape entered face by face', () => {
  it("shows the Camouflage's box where it stands: two pieces tall, nothing above or below", () => {
    const [front] = canvasesOf(solvedCube('camo'), entryOf('camo'))
    expect(front!.cells.slice(0, 6)).toEqual(Array(6).fill('absent'))
    expect(front!.cells.slice(6, 30).every((c) => c !== 'absent')).toBe(true)
    // Its eight stickers: thick, thin, thin, thick across, two pieces tall.
    expect(new Set(regionsOf(front!)!.filter((r) => r >= 0)).size).toBe(8)
  })

  it('finds a scrambled Camouflage again from its four canvases, their colors on it', () => {
    const entry = entryOf('camo')
    for (const seed of [1, 2, 3]) {
      const cube = scrambled('camo', seed)
      const canvases = canvasesOf(cube, entry)
      const [found] = entry.find(viewsOfCanvases(canvases)!)
      expect(showsCanvases(found!, canvases, entry)).toBe(true)
      // The stickers the canvases show, as the puzzle has them.
      const edit = cubeToEdit(cube)
      for (const [id, color] of Object.entries(editOfCanvases(found!, canvases, entry))) {
        expect(edit[id]).toBe(color)
      }
    }
  })

  it('finds a scrambled Purple again from its four canvases, however held, drawn anywhere', () => {
    const entry = entryOf('purple')
    // Its box, centered on a 5x5 canvas: 4 mini cubes wide.
    const [box] = canvasesOf(solvedCube('purple'), entry)
    expect(box!.cells.filter((c) => c === 'absent')).toHaveLength(9)
    for (const [seed, turn] of [
      [1, 0],
      [2, 5],
      [3, 17],
    ] as const) {
      const cube = scrambled('purple', seed)
      // Held another way: its faces as one sees them then.
      const canvases = canvasesOf(heldAs(cube, turn), entry)
      const found = entry.find(viewsOfCanvases(canvases)!)
      expect(found.length).toBeGreaterThan(0)
      expect(found.every((f) => showsCanvases(f, canvases, entry))).toBe(true)
      expect(Object.keys(editOfCanvases(found[0]!, canvases, entry)).length).toBeGreaterThan(0)
    }
  })

  it('paints a whole sticker, joins one color only, and holds once all is painted', () => {
    const blank: Canvas = { cells: Array(36).fill('W'), joins: [] }
    // Two cells joined take a color together.
    const joined = toggleJoin(blank, 0, 1)
    expect(paintCanvas(joined, 1, 'R').cells.slice(0, 3)).toEqual(['R', 'R', 'W'])
    // No joint between two colors, nor across a row's end.
    expect(toggleJoin(paintCanvas(blank, 1, 'R'), 0, 1).joins).toEqual([])
    expect(toggleJoin(blank, 5, 6).joins).toEqual([])
    // Painted absent, a cell leaves its joints.
    expect(paintCanvas(joined, 0, 'absent').joins).toEqual([])
    // A sticker partly hidden by a piece standing out: any shape, an L too.
    const l = [joinKey(0, 1), joinKey(0, 6)].reduce(
      (c, key) => toggleJoin(c, ...(key.split('-').map(Number) as [number, number])),
      blank,
    )
    expect(regionsOf(l)!.slice(0, 2)).toEqual([0, 0])
    expect(regionsOf(l)![6]).toBe(0)
    expect(regionsOf({ ...blank, cells: [null, ...blank.cells.slice(1)] })).toBeNull()
  })
})
