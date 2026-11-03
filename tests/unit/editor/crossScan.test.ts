import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { cross, FACE_NORMAL } from '@/lib/core/geometry'
import { scrambleTurns } from '@/lib/core/moves'
import { layoutKey } from '@/lib/core/pieces'
import { thicknessOf } from '@/lib/core/shape'
import { applyMoves } from '@/lib/core/turn'
import type { Cube, CubeColor } from '@/lib/core/types'
import { buildCube } from '@/lib/editor/edit'
import { readCross } from '@/lib/editor/scan/crossRead'
import { orderFor, scannable, scanPlan } from '@/lib/editor/scan/plan'
import { crossSizes, placeAround, slotKey, type Rect } from '@/lib/editor/scan/sized'
import { seededRng } from '../../helpers'

const THICKNESS = thicknessOf('qiyi2', 'mirror')
/** Where the frame's cross is, on a picture 480 pixels wide. */
const AT = [240, 240] as const

/**
 * The stickers a camera sees on each face of `cube`, held as the scan's
 * gestures say: each its layers' sizes, at `scale` pixels a cell (the
 * cube nearer or farther), less a seam where they meet, round the cross.
 */
function pictures(cube: Cube, behind: boolean, scale: (face: number) => number): Rect[][] {
  return orderFor(behind).map(({ front, up }, f) => {
    const [n, u] = [FACE_NORMAL[front], FACE_NORMAL[up]]
    const r = cross(u, n)
    const px = scale(f)
    const rects: Rect[] = []
    for (const row of [-1, 1]) {
      for (const col of [-1, 1]) {
        const at = [0, 1, 2].map((i) => n[i]! - u[i]! * row + r[i]! * col).join()
        const piece = cube.find((c) => c.position.join() === at)!
        const along = (axis: readonly number[]) => {
          const s = piece.stickers.find((x) => x.normal.some((v, i) => v !== 0 && axis[i] !== 0))!
          return THICKNESS[s.color as CubeColor] * px
        }
        const [w, h] = [along(r) - 6, along(u) - 6]
        const x = col > 0 ? AT[0] + 3 : AT[0] - 3 - w
        const y = row > 0 ? AT[1] + 3 : AT[1] - 3 - h
        rects.push([x, y, w, h])
      }
    }
    return rects
  })
}

const read = (rects: Rect[][]) =>
  readCross(
    rects.map((r) => crossSizes(placeAround(r, AT))),
    'qiyi2',
  )

const scrambled = (seed: number) =>
  applyMoves(solvedCube('qiyi2'), scrambleTurns('qiyi2', 11, seededRng(seed), solvedCube('qiyi2')))

describe('a 2x2 mirror read by its stickers’ sizes', () => {
  it('is scanned face by face, held any way, round where its stickers meet', () => {
    expect(scannable('qiyi2', 'mirror')).toBe(true)
    const plan = scanPlan('qiyi2', 'mirror')
    expect(plan).toHaveLength(6)
    expect(plan.every((f) => f.sized && f.cross && !f.told)).toBe(true)
    expect(plan[0]!.move).toBe('crossed')
  })

  it('sets the four stickers of a face in their quarters', () => {
    const placed = placeAround(pictures(scrambled(1), false, () => 50)[0]!, AT)
    expect([...placed.keys()].sort()).toEqual(
      [slotKey([-1, -1]), slotKey([-1, 1]), slotKey([1, -1]), slotKey([1, 1])].sort(),
    )
  })

  it('reads scrambled ones exactly, each face taken nearer or farther', () => {
    for (const seed of [1, 2, 3, 4]) {
      const cube = scrambled(seed)
      for (const behind of [false, true]) {
        const reading = read(pictures(cube, behind, (f) => 40 + 7 * ((f * seed) % 5)))
        expect(reading.ok).toBe(true)
        if (!reading.ok) return
        expect(layoutKey(buildCube(reading.edit, 'qiyi2'))).toBe(layoutKey(cube))
      }
    }
  })

  it('reads a solved one solved, its faces all alike read both ways', () => {
    const cube = solvedCube('qiyi2')
    const reading = read(pictures(cube, false, () => 50))
    expect(reading.ok).toBe(true)
    if (reading.ok) expect(layoutKey(buildCube(reading.edit, 'qiyi2'))).toBe(layoutKey(cube))
  })

  it('asks again for a face where a sticker was not found', () => {
    const rects = pictures(scrambled(1), false, () => 50)
    rects[2] = rects[2]!.slice(1)
    expect(read(rects)).toEqual({ ok: false, face: 2 })
  })
})
