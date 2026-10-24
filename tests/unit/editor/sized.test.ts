import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { buildCube } from '@/lib/editor/edit'
import { showsFace } from '@/lib/editor/scan/capture'
import type { CellSample } from '@/lib/editor/scan/sample'
import { scannable, scanPlan } from '@/lib/editor/scan/plan'
import { placeStickers, slotKey, stickerSizes, type Rect } from '@/lib/editor/scan/sized'
import { readSized, type Held } from '@/lib/editor/scan/sizedRead'
import FIXTURE from './fixtures/mirrorScan.json'
import LAPTOP from './fixtures/mirrorSolvedLaptop.json'

const faces = FIXTURE.faces.map((f) => ({
  rects: f.rects as unknown as Rect[],
  center: f.center as [number, number],
}))

describe('a mirror cube read by its stickers’ sizes', () => {
  it('sets every sticker of a face in its place round the center', () => {
    for (const { rects, center } of faces) {
      const placed = placeStickers(rects, center)
      expect(placed.size).toBe(9)
      // The middle row and column are the center's own size.
      const sizes = stickerSizes(placed)
      expect(sizes.get(slotKey([0, 1]))![1]).toBeNull()
      expect(sizes.get(slotKey([1, 0]))![0]).toBeNull()
    }
  })

  it('rebuilds a center none was found for, from its neighbors', () => {
    // A real face whose center a glint broke (2026-10-24): left and right
    // neighbors face each other across the frame's middle, one above.
    const rects: Rect[] = [
      [294, 360, 34, 29],
      [110, 304, 70, 110],
      [288, 301, 72, 51],
      [303, 205, 77, 94],
      [85, 205, 99, 92],
      [193, 71, 90, 116],
      [111, 53, 72, 136],
      [297, 48, 119, 141],
    ]
    const placed = placeStickers(rects, [240, 240])
    const [x, y, w, h] = placed.get(slotKey([0, 0]))!
    // The room between them (184 to 303), less a seam each side; square.
    expect([Math.round(x), Math.round(w), Math.round(h)]).toEqual([199, 88, 88])
    expect(Math.round(y)).toBe(202)
    expect(placed.size).toBe(8)
  })

  it('places nothing without a center at the marked point', () => {
    expect(placeStickers(faces[0]!.rects, [5, 5]).size).toBe(0)
  })

  it('reads a real one: its edges home, its corners mixed, a cube', () => {
    // Held as photographed, each face named by its thickness: the 12 mm
    // layer on top for the sides, the 28 mm one for the top and bottom.
    const held: Held = [
      ['L', 'D'],
      ['F', 'D'],
      ['R', 'D'],
      ['B', 'D'],
      ['D', 'R'],
      ['U', 'R'],
    ]
    const reading = readSized(
      faces.map(({ rects, center }) => stickerSizes(placeStickers(rects, center))),
      [held],
    )
    expect(reading.ok).toBe(true)
    if (!reading.ok) return
    const cube = buildCube(reading.edit, '3')
    // Every edge home, every corner elsewhere.
    const solved = solvedCube('3')
    const at = (c: (typeof cube)[number]) => JSON.stringify(c)
    const home = cube.filter((c) => solved.some((s) => at(s) === at(c)))
    expect(home.filter((c) => c.stickers.length === 2)).toHaveLength(12)
    expect(home.filter((c) => c.stickers.length === 3)).toHaveLength(0)
    expect(isSolved(cube)).toBe(false)
  }, 60_000)

  it('scans a mirror 3x3 only, its faces named by thickness, its center marked', () => {
    expect(scannable('3', 'mirror')).toBe(true)
    expect(scannable('2', 'mirror')).toBe(false)
    const plan = scanPlan('3', 'mirror')
    expect(plan).toHaveLength(6)
    expect(plan.every((f) => f.sized && f.told && !f.named)).toBe(true)
    // A square of one middle layer in the middle of the frame.
    expect(plan[0]!.mark).toEqual([
      [2, 2],
      [3, 2],
      [3, 3],
      [2, 3],
    ])
    expect(scanPlan('3')[0]!.sized).toBeUndefined()
    // Begun on the easiest faces: the thin one (12 mm) in front, the very
    // thin one (8 mm) on top; then the gestures go round.
    expect(plan.map((f) => [f.frontColor, f.upColor])).toEqual([
      ['Y', 'O'],
      ['G', 'O'],
      ['W', 'O'],
      ['B', 'O'],
      ['O', 'G'],
      ['R', 'G'],
    ])
  })

  it("takes a mirror's face once its center shows, its bumps dark around", () => {
    const face = scanPlan('3', 'mirror')[0]!
    const cells: CellSample[] = face.cells.map(() => ({ lab: [8, 0, 0] }))
    expect(showsFace(cells, face)).toBe(false)
    cells[12] = { lab: [80, 5, 40] }
    expect(showsFace(cells, face)).toBe(true)
  })

  it('reads a solved one shown to a laptop’s camera, its faces brought the other way', () => {
    const sizes = LAPTOP.faces.map((f) =>
      stickerSizes(placeStickers(f.rects as unknown as Rect[], [f.size[0]! / 2, f.size[1]! / 2])),
    )
    const reading = readSized(sizes)
    expect(reading.ok && isSolved(buildCube(reading.edit, '3'))).toBe(true)
  })

  it("names a mirror's faces as a laptop's gestures bring them", () => {
    const named = (behind: boolean) =>
      scanPlan('3', 'mirror', behind).map((f) => [f.frontColor, f.upColor])
    // Turned "to the right" as the mirrored picture shows: the sides the
    // other way round, the top and bottom upside down.
    expect(named(true)).toEqual([
      ['Y', 'O'],
      ['B', 'O'],
      ['W', 'O'],
      ['G', 'O'],
      ['O', 'B'],
      ['R', 'B'],
    ])
  })
})
