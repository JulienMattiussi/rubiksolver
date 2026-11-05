import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { scrambleTurns } from '@/lib/core/moves'
import { applyMoves } from '@/lib/core/turn'
import type { Cube } from '@/lib/core/types'
import { stepOf } from '@/lib/editor/entry'
import { progress } from '@/lib/editor/edit'
import {
  canvasesOf,
  joinKey,
  showsCanvases,
  viewsOfCanvases,
  type Canvas,
  type FaceCell,
} from '@/lib/editor/modes/canvas'
import { sidesOf, type Found } from '@/lib/editor/modes/faceViews'
import { bySide, needsSide } from '@/lib/editor/modes/sides'
import { entered, scanned } from '@/store/faceSearch'
import { seededRng } from '../../helpers'

const ENTRY = stepOf('meffertsPocket', 'canvas')!.faces
const N = ENTRY.canvas

/** The states a state's four canvases show. */
const showing = (cube: Cube): Found[] => {
  const canvases = canvasesOf(cube, ENTRY)
  return ENTRY.find(viewsOfCanvases(canvases)!).filter((f) => showsCanvases(f, canvases, ENTRY))
}

/** A scrambled state its four faces leave alike with another shape, or
 *  not. */
function scrambled(alike: boolean): Cube {
  for (let seed = 1; ; seed++) {
    const start = solvedCube('meffertsPocket')
    const cube = applyMoves(start, scrambleTurns('meffertsPocket', 25, seededRng(seed), start))
    if (needsSide(showing(cube), ENTRY) === alike) return cube
  }
}

/** A canvas turned `turns` quarters clockwise. */
function quarters(canvas: Canvas, turns: number): Canvas {
  const to = (i: number) => (i % N) * N + (N - 1 - Math.floor(i / N))
  let out = canvas
  for (let k = 0; k < turns; k++) {
    const cells = [...out.cells]
    out.cells.forEach((cell, i) => (cells[to(i)] = cell))
    out = {
      cells,
      joins: out.joins.map((key) => {
        const [a, b] = key.split('-').map(Number) as [number, number]
        return joinKey(to(a), to(b))
      }),
    }
  }
  return out
}

/** A side's drawing painted on a canvas, `turns` quarters round. */
function sideCanvas(key: string, turns = 0): Canvas {
  let rows = key.split('/')
  for (let k = 0; k < turns; k++)
    rows = rows[0]!.split('').map((_, c) =>
      rows
        .map((row) => row[c]!)
        .reverse()
        .join(''),
    )
  const cells: (FaceCell | null)[] = Array.from({ length: N * N }, () => 'absent')
  const letters: string[] = Array.from({ length: N * N }, () => '.')
  rows.forEach((row, r) =>
    row.split('').forEach((x, c) => {
      if (x === '.') return
      cells[r * N + c] = 'V'
      letters[r * N + c] = x
    }),
  )
  const joins = letters.flatMap((x, i) =>
    x === '.'
      ? []
      : [i + 1, i + N]
          .filter((j) => j < N * N && (j === i + N || j % N) && letters[j] === x)
          .map((j) => joinKey(i, j)),
  )
  return { cells, joins }
}

describe("a side telling apart two shapes its four faces leave alike (Meffert's Pocket Cube)", () => {
  // (The solved one is: its black faces hide how its halves stand.)
  const cube = scrambled(true)
  const found = showing(cube)
  const truth: Found = { cube, turn: 0 }
  const right = sidesOf(truth, ENTRY.grid)[0]!

  it('tells them apart by its right side, however turned', () => {
    for (const turns of [0, 1, 2, 3]) {
      const { found: told, off } = bySide(found, sideCanvas(right, turns), ENTRY)
      expect(off).toBe(0)
      expect(told.length).toBeGreaterThan(0)
      expect(told.every((f) => sidesOf(f, ENTRY.grid)[0] === right)).toBe(true)
      expect(needsSide(told, ENTRY)).toBe(false)
    }
  })

  it('asks for it when entered by hand, then finds the state', async () => {
    const canvases = canvasesOf(cube, ENTRY)
    expect((await entered('meffertsPocket', canvases)).kind).toBe('side')
    const shown = await entered('meffertsPocket', [...canvases, sideCanvas(right)])
    expect(shown.kind).toBe('shown')
  })

  it('wants it from a camera, then reads the state from its sides, held any way', async () => {
    const choices = canvasesOf(cube, ENTRY).map((c) => [c])
    expect((await scanned('meffertsPocket', [{ choices, side: 0 }])).kind).toBe('side')
    const [r, l] = canvasesOf(cube, ENTRY, 6).slice(4)
    const turned = [...choices, [quarters(r!, 3)], [quarters(l!, 1)]]
    expect((await scanned('meffertsPocket', [{ choices: turned, side: 0 }])).kind).toBe('shown')
  })

  it('reads every sticker of scrambled ones from their six faces', async () => {
    for (let seed = 1; seed <= 4; seed++) {
      const start = solvedCube('meffertsPocket')
      const state = applyMoves(start, scrambleTurns('meffertsPocket', 25, seededRng(seed), start))
      const choices = canvasesOf(state, ENTRY, 6).map((c) => [c])
      const found = await scanned('meffertsPocket', [{ choices, side: 0 }])
      expect(found.kind).toBe('shown')
      if (found.kind !== 'shown') continue
      const { filled, total } = progress(found.shown.edit, 'meffertsPocket', found.shown.form)
      expect(filled).toBe(total)
    }
  })

  it('needs none where the four faces tell the shape', async () => {
    const told = scrambled(false)
    expect((await entered('meffertsPocket', canvasesOf(told, ENTRY))).kind).toBe('shown')
  })
})
