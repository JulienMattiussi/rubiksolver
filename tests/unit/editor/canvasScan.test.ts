import { describe, expect, it } from 'vitest'
import { shapeColors, solvedCube } from '@/lib/core/cube'
import { scrambleTurns } from '@/lib/core/moves'
import { COLOR_HEX } from '@/lib/core/stickerColors'
import { applyMoves } from '@/lib/core/turn'
import type { Color, Cube } from '@/lib/core/types'
import { stepOf } from '@/lib/editor/entry'
import {
  canvasesOf,
  regionsOf,
  showsCanvases,
  viewsOfCanvases,
  type Canvas,
} from '@/lib/editor/modes/canvas'
import { drawingDistance } from '@/lib/editor/modes/faceViews'
import {
  cellColor,
  gridCanvas,
  gridColors,
  readGrid,
  type GridFace,
} from '@/lib/editor/scan/canvasRead'
import { HOLD_MS, watch, watchAfter } from '@/lib/editor/scan/capture'
import { labOf, rgbOfHex, type Lab } from '@/lib/editor/scan/color'
import { combined } from '@/lib/editor/scan/crossRead'
import { scanPlan } from '@/lib/editor/scan/plan'
import { needsSide } from '@/lib/editor/modes/sides'
import { realPieces } from '@/lib/editor/modes/colors'
import { meffertsPocketBoxed } from '@/lib/puzzles/twisted/meffertsPocket'
import { scanned } from '@/store/faceSearch'
import { seededRng } from '../../helpers'

const ENTRY = stepOf('meffertsPocket', 'canvas')!.faces
const N = ENTRY.canvas
const COLORS = shapeColors('meffertsPocket')
/** A picture's side, the frame's in it, the room round it. */
const SIZE = 624
const FRAME = 480
const ROOM = (SIZE - FRAME) / 2
const FRAMED = [ROOM, ROOM, FRAME, FRAME] as const
/** A grid's cells a side. */
const COLS = 6

/** A measure from its lightness, chroma and hue (degrees). */
const polar = (l: number, c: number, hue: number): Lab => [
  l,
  c * Math.cos((hue * Math.PI) / 180),
  c * Math.sin((hue * Math.PI) / 180),
]

/** A face as a grid reads it, from its drawing on a grid of 6 by 6 (rows
 *  split by `/`): a big violet sticker its four `V`, a mini its color in
 *  lower case (`v`: violet, as early scans read them all); its colors. */
function drawn(drawing: string): { grid: GridFace; colors: Color[] } {
  const cells = drawing.replaceAll('/', '').split('')
  const owner = cells.map(() => -1)
  const stickers: { span: number; lab: Lab }[] = []
  const colors: Color[] = []
  cells.forEach((c, i) => {
    if (c === '.' || owner[i]! >= 0) return
    const span = c === 'V' ? 2 : 1
    for (let r = 0; r < span; r++)
      for (let k = 0; k < span; k++) owner[i + r * COLS + k] = stickers.length
    const color = c.toUpperCase() as Color
    stickers.push({ span, lab: labOf(...rgbOfHex(COLOR_HEX[color])) })
    colors.push(color)
  })
  return { grid: { cols: COLS, owner, stickers, at: [0, 0], unit: 1 }, colors }
}

/** Faces' drawings read both ways (turned left or right from face to
 *  face), each one's canvases. */
function readingsOf(drawings: readonly string[]) {
  const faces = drawings.map(drawn)
  return [false, true].map((fromLeft) => ({
    choices: faces.map(({ grid, colors }) => [gridCanvas(grid, colors, fromLeft, N)]),
    side: fromLeft ? 0 : 1,
  }))
}

/** A face's picture (RGBA, `SIZE` a side), as a camera shows it: a pale
 *  wall, the puzzle's drawing (its canvas), each sticker framed in black,
 *  cells `unit` wide from (`ox`, `oy`), turned a quarter as turning the
 *  puzzle brings it (`fromLeft`: gridCanvas); a big sticker `nearer` the
 *  lens a fifth bigger, or `shifted` by a share of a cell (its piece at
 *  another depth). */
function picture(
  canvas: Canvas,
  {
    unit,
    ox,
    oy,
    fromLeft,
    nearer,
    shifted = 0,
  }: {
    unit: number
    ox: number
    oy: number
    fromLeft: boolean
    nearer?: boolean
    shifted?: number
  },
) {
  const regions = regionsOf(canvas)!
  const boxes = new Map<number, [number, number, number, number]>()
  regions.forEach((r, i) => {
    if (r < 0) return
    const [row, col] = [Math.floor(i / N), i % N]
    const box = boxes.get(r) ?? [col, row, col + 1, row + 1]
    boxes.set(r, [
      Math.min(box[0], col),
      Math.min(box[1], row),
      Math.max(box[2], col + 1),
      Math.max(box[3], row + 1),
    ])
  })
  const big = [...boxes].find(([, [a, , c]]) => c - a === 2)?.[0]
  // The upright drawing at (x, y): a sticker, its black frame, or the wall.
  const at = (x: number, y: number): readonly number[] => {
    for (const [r, [c0, r0, c1, r1]] of boxes) {
      const grow = nearer && r === big ? 1 / 10 : 0
      const [w, h] = [(c1 - c0) * unit, (r1 - r0) * unit]
      const shift = r === big ? shifted * unit : 0
      const [x0, y0] = [ox + c0 * unit - grow * w, oy + r0 * unit - grow * h + shift]
      const [x1, y1] = [x0 + w * (1 + 2 * grow), y0 + h * (1 + 2 * grow)]
      if (x < x0 || x >= x1 || y < y0 || y >= y1) continue
      const frame = 0.125 * unit * (1 + 2 * grow)
      const inside = x >= x0 + frame && x < x1 - frame && y >= y0 + frame && y < y1 - frame
      return inside ? rgbOfHex(COLOR_HEX[canvas.cells[regions.indexOf(r)] as Color]) : [20, 20, 22]
    }
    return [182, 176, 168]
  }
  const rgba = new Uint8ClampedArray(SIZE * SIZE * 4)
  for (let py = 0; py < SIZE; py++) {
    for (let px = 0; px < SIZE; px++) {
      const [ux, uy] = fromLeft ? [SIZE - 1 - py, px] : [py, SIZE - 1 - px]
      rgba.set([...at(ux, uy), 255], 4 * (py * SIZE + px))
    }
  }
  return { width: SIZE, height: SIZE, rgba }
}

/** Scrambled states whose faces show whole squares only (a piece partly
 *  hidden draws none). */
function states(count: number): Cube[] {
  const whole = (c: Canvas) => {
    const regions = regionsOf(c)!
    return [...new Set(regions.filter((r) => r >= 0))].every((r) => {
      const cells = regions.filter((v) => v === r).length
      return cells === 1 || cells === 4
    })
  }
  const out: Cube[] = []
  for (let seed = 1; out.length < count; seed++) {
    const start = solvedCube('meffertsPocket')
    const cube = applyMoves(start, scrambleTurns('meffertsPocket', 25, seededRng(seed), start))
    if (canvasesOf(cube, ENTRY).every(whole)) out.push(cube)
  }
  return out
}

/** A canvas's drawing at its top left, its stickers' cells by kind (`V`
 *  big, `m` mini). */
function drawingOf(canvas: Canvas): string {
  const regions = regionsOf(canvas)!
  const size = (r: number) => regions.filter((v) => v === r).length
  const rows = Array.from({ length: N }, (_, r) => regions.slice(r * N, r * N + N))
  const used = rows.filter((row) => row.some((v) => v >= 0))
  const c0 = Math.min(...used.flatMap((row) => row.flatMap((v, c) => (v >= 0 ? [c] : []))))
  return used
    .map((row) =>
      row
        .slice(c0)
        .map((v) => (v < 0 ? '.' : size(v) > 1 ? 'V' : 'm'))
        .join(''),
    )
    .join('/')
}

/** A face's drawing pictured, then read. */
const readDrawing = (drawing: string) => {
  const { grid, colors } = drawn(drawing)
  const shown = picture(gridCanvas(grid, colors, false, N), {
    unit: FRAME / COLS,
    ox: ROOM,
    oy: ROOM,
    fromLeft: false,
  })
  return readGrid(shown, [...FRAMED], ENTRY, COLORS)
}

describe("Meffert's Pocket Cube read from pictures of its faces", () => {
  it('reads the state its faces show, held off the frame, nearer or farther', () => {
    const rng = seededRng(7)
    for (const [i, cube] of states(2).entries()) {
      const canvases = canvasesOf(cube, ENTRY)
      // Turned left from face to face (to a camera facing the user, the
      // other way); held a little off the frame's grid, nearer or farther.
      const fromLeft = i % 2 === 1
      const grids = canvases.map((canvas) => {
        const unit = (FRAME / COLS) * (0.92 + 0.2 * rng())
        const at = () => ROOM + (rng() - 0.5) * unit
        const shown = picture(canvas, { unit, ox: at(), oy: at(), fromLeft })
        return readGrid(shown, [...FRAMED], ENTRY, COLORS)!
      })
      const colors = gridColors(grids, solvedCube('meffertsPocket'), ENTRY.spans!)
      const read = grids.map((g, f) => gridCanvas(g, colors[f]!, fromLeft, N))
      expect(read.map(drawingOf)).toEqual(canvases.map(drawingOf))
      const found = ENTRY.find(viewsOfCanvases(read)!)
      expect(found.some((f) => showsCanvases(f, canvases, ENTRY))).toBe(true)
    }
  })

  it('reads a big cube nearer the lens, bigger, as a big cube still', () => {
    const [canvas] = canvasesOf(states(1)[0]!, ENTRY)
    const shown = picture(canvas!, { unit: 80, ox: ROOM, oy: ROOM, fromLeft: false, nearer: true })
    const grid = readGrid(shown, [...FRAMED], ENTRY, COLORS)!
    const colors = grid.stickers.map((s): Color => (s.span === 2 ? 'V' : 'Y'))
    expect(drawingOf(gridCanvas(grid, colors, false, N))).toBe(drawingOf(canvas!))
  })

  it('reads a piece standing at another depth, its sticker off the others grid', () => {
    // Scrambled, 2026-11-05: a column of the face a good third of a cell
    // below the other.
    const [canvas] = canvasesOf(states(1)[0]!, ENTRY)
    const shown = picture(canvas!, { unit: 80, ox: ROOM, oy: ROOM, fromLeft: false, shifted: 0.4 })
    const grid = readGrid(shown, [...FRAMED], ENTRY, COLORS)!
    const colors = grid.stickers.map((s): Color => (s.span === 2 ? 'V' : 'Y'))
    expect(drawingOf(gridCanvas(grid, colors, false, N))).toBe(drawingOf(canvas!))
  })

  it('reads a puzzle held so close it fills the frame, its grid past the picture', () => {
    // Held so, 2026-11-05: the solved puzzle, four cells across, each 1.65
    // times the frame's.
    const canvas = canvasesOf(solvedCube('meffertsPocket'), ENTRY).find((c) =>
      c.cells.some((x) => x !== 'V' && x !== 'absent'),
    )!
    const shown = picture(canvas, { unit: 140, ox: 30, oy: 40, fromLeft: true })
    const grid = readGrid(shown, [...FRAMED], ENTRY, COLORS)!
    const colors = gridColors([grid], solvedCube('meffertsPocket'), ENTRY.spans!)[0]!
    const read = gridCanvas(grid, colors, true, N)
    expect(drawingOf(read)).toBe(drawingOf(canvas))
    expect(read.cells.filter((c) => c === 'V')).toHaveLength(12)
  })

  it('cuts two big stickers a glint joins across their black frames', () => {
    // Scanned 2026-11-05: a glint over the seam between two big cubes, one
    // above the other, made them one sticker twice too tall.
    const { grid, colors } = drawn('VVVV../VVVV../VVVV../VVVV../....../......')
    const unit = FRAME / COLS
    const shown = picture(gridCanvas(grid, colors, false, N), {
      unit,
      ox: ROOM,
      oy: ROOM,
      fromLeft: false,
    })
    // The glint: violet across the seam, a bridge a quarter of a cell wide.
    const violet = rgbOfHex(COLOR_HEX.V)
    const seam = ROOM + 2 * unit
    for (let y = seam - unit / 4; y < seam + unit / 4; y++) {
      for (let x = ROOM + 3 * unit; x < ROOM + 3.25 * unit; x++)
        shown.rgba.set([...violet, 255], 4 * (y * SIZE + x))
    }
    const read = readGrid(shown, [...FRAMED], ENTRY, COLORS)!
    expect(read.stickers.map((s) => s.span)).toEqual([2, 2, 2, 2])
  })

  it('reads a big sticker a glint washes out on half of it', () => {
    // Scanned 2026-11-05: half a big cube nearly white, lit pale.
    const { grid, colors } = drawn('VVVV../VVVV../VVyy../VVyy../....../......')
    const unit = FRAME / COLS
    const shown = picture(gridCanvas(grid, colors, false, N), {
      unit,
      ox: ROOM,
      oy: ROOM,
      fromLeft: false,
    })
    // The glint: the bottom half of the top left big sticker's face.
    for (let y = ROOM + unit; y < ROOM + 1.85 * unit; y++) {
      for (let x = ROOM + 0.15 * unit; x < ROOM + 1.85 * unit; x++)
        shown.rgba.set([226, 220, 232, 255], 4 * (y * SIZE + x))
    }
    const read = readGrid(shown, [...FRAMED], ENTRY, COLORS)!
    expect(read.stickers.map((s) => s.span).sort()).toEqual([1, 1, 1, 1, 2, 2, 2])
  })

  it('refuses a face whose stickers draw no face the puzzle shows', () => {
    // Three big cubes and minis; four big ones.
    expect(readDrawing('VVyy../VVyy../VVVV../VVVV../....../......')).not.toBeNull()
    expect(readDrawing('VVVV../VVVV../VVVV../VVVV../....../......')).not.toBeNull()
    // Two big ones (one missed), or three and no mini.
    expect(readDrawing('VVyy../VVyy../..VV../..VV../....../......')).toBeNull()
    expect(readDrawing('VV..../VV..../VVVV../VVVV../....../......')).toBeNull()
  })

  it('tells the puzzle colors from what is round it, under a warm light too', () => {
    // Measured on real photos, 2026-11-04: the stickers, in the light and
    // in the shade.
    const stickers: [Lab, Color][] = [
      [polar(29, 59, 318), 'V'],
      [polar(37, 41, 299), 'V'],
      [polar(34, 44, 279), 'B'],
      [polar(54, 51, 271), 'B'],
      [polar(60, 42, 96), 'Y'],
      [polar(54, 40, 120), 'L'],
      [polar(31, 30, 124), 'L'],
    ]
    for (const [lab, color] of stickers) expect(cellColor(lab, COLORS)).toBe(color)
    // A warm wall, skin, a teal shirt, the black body, a pale forehead.
    const round = [
      polar(56, 20, 68),
      polar(44, 31, 25),
      polar(58, 23, 222),
      polar(64, 26, 228),
      polar(28, 3, 237),
      polar(77, 6, 36),
    ]
    for (const lab of round) expect(cellColor(lab, COLORS)).toBeNull()
  })

  it('paints a big sticker violet and a mini blue, however alike', () => {
    // Read 2026-11-04: a big violet sticker under a bright light, as blue
    // as the blue minis.
    const blue: Lab = [55, 19, -70]
    const { grid } = drawn('VVb.../VV..../....../....../....../......')
    const both = { ...grid, stickers: grid.stickers.map((s) => ({ ...s, lab: blue })) }
    expect(gridColors([both], solvedCube('meffertsPocket'), ENTRY.spans!)).toEqual([['V', 'B']])
  })

  it('reads no color on more stickers than the puzzle has: yellow under a light that greens it', () => {
    // Read 2026-11-04: six minis nearer lime than yellow in hue, the puzzle
    // has four lime stickers; the two yellowest are yellow.
    const labs: Lab[] = [
      [86, -26, 29],
      [86, -26, 28],
      [88, -30, 30],
      [87, -28, 31],
      [98, -16, 57],
      [97, -15, 54],
    ]
    const { grid } = drawn('llllll/....../....../....../....../......')
    const greened = { ...grid, stickers: grid.stickers.map((s, i) => ({ ...s, lab: labs[i]! })) }
    expect(gridColors([greened], solvedCube('meffertsPocket'), ENTRY.spans!)).toEqual([
      ['L', 'L', 'L', 'L', 'Y', 'Y'],
    ])
  })

  it('wants the side of a solved puzzle read with a big sticker missed', async () => {
    // Scanned in the app 2026-11-04, a big sticker of its first face
    // unseen (a glint), its minis read violet: no state shows it exactly,
    // the nearest is the solved shape, whose four faces another's are too
    // (its black body), a side asked for. Its pictures read as taken (a
    // quarter round, so that turned they draw it as read then).
    const readings = readingsOf([
      '..VVvv/..VVvv/..VV../..VV../....../......',
      '..vvVV/..vvVV/..VVVV/..VVVV/....../......',
      '..VVVV/..VVVV/..VVVV/..VVVV/....../......',
      '..VVVV/..VVVV/..VVVV/..VVVV/....../......',
    ])
    const ways = combined(readings[0]!.choices)
    expect(ways.some((w) => ENTRY.find(viewsOfCanvases(w)!).length > 0)).toBe(false)
    const { found } = ENTRY.near!(viewsOfCanvases(ways[0]!)!)
    expect(found.some((f) => meffertsPocketBoxed(f.cube))).toBe(true)
    expect(needsSide(found, ENTRY)).toBe(true)
    expect((await scanned('meffertsPocket', [readings[0]!])).kind).toBe('side')
  })

  it('tells which face to take again when its stickers are too far from any shape', () => {
    // Scanned 2026-11-04, the last face's two top big stickers missed.
    const missed = [
      'VVVV../VVVV../VVVV../VVVV../....../......',
      'VVVV../VVVV../vvVV../vvVV../....../......',
      'VVVV../VVVV../VVvv../VVvv../....../......',
      'VVVV../VVVV../....../....../....../......',
    ]
    const read = (drawings: string[]) =>
      viewsOfCanvases(combined(readingsOf(drawings)[1]!.choices)[0]!)!
    const { found, off } = ENTRY.near!(read(missed))
    expect(found).toEqual([])
    expect(off.indexOf(Math.max(...off))).toBe(3)
    // Taken again, whole: its state shown exactly.
    const whole = [...missed.slice(0, 3), 'VVVV../VVVV../VVVV../VVVV../....../......']
    expect(ENTRY.find(read(whole)).length).toBeGreaterThan(0)
  })

  it('tells how far a drawing read is from a shape: a big sticker missed costs 4', () => {
    expect(drawingDistance('AABC/AADE/FFGG/FFGG', 'AABC/AADE/FFGG/FFGG')).toBe(0)
    expect(drawingDistance('AB../CD../EEFF/EEFF', 'ABCC/DECC/FFGG/FFGG')).toBe(4)
    // Two big stickers read as one: their seam, crossed on two rows.
    expect(drawingDistance('AAAA/AAAA', 'AABB/AABB')).toBe(2)
  })

  it('paints a real scan held the way its colors tell: every sticker, its top too', async () => {
    // Scanned 2026-11-04, the solved puzzle, five faces (its top asked for
    // too), turned left from face to face.
    const found = await scanned(
      'meffertsPocket',
      readingsOf([
        'VVVV../VVVV../VVVV../VVVV../....../......',
        'yyVV../yyVV../VVVV../VVVV../....../......',
        'VVbb../VVbb../VVVV../VVVV../....../......',
        'VVVV../VVVV../VVVV../VVVV../....../......',
        'VVll../VVll../VVVV../VVVV../....../......',
      ]),
    )
    expect(found.kind).toBe('shown')
    if (found.kind !== 'shown') return
    const { edit, form } = found.shown
    expect(realPieces(edit, 'meffertsPocket', form)).toBe(true)
    for (const color of ['Y', 'B', 'L'])
      expect(Object.values(edit).filter((c) => c === color)).toHaveLength(4)
  })

  it('wants its sides while its four faces leave a sticker unknown', async () => {
    // Scanned 2026-11-04, four faces only: its pieces told two of the four
    // stickers its sides hid, not the last two (two minis, a yellow sticker
    // seen on each, may hide blue or lime either way round).
    const readings = readingsOf([
      '..VV../VVVV../VVyVV./VVyVV./VV..../......',
      '.yyVV./VVlVV./VVlVV./...VV./....../......',
      '...b../VVVV../VVVV../....../....../......',
      'VVVV../VVVV../VVVV../VVVV../....../......',
    ])
    expect((await scanned('meffertsPocket', readings)).kind).toBe('side')
  })

  it('takes a face held by hand: the cells on its stickers edges may flicker', () => {
    const face = scanPlan('meffertsPocket')[0]!
    const lab = (c: Color) => labOf(...rgbOfHex(COLOR_HEX[c]))
    const cells = face.cells.map((_, i) => ({ lab: lab(i % 3 ? 'V' : 'L') }))
    // A shake: a fifth of its cells now on the black body.
    const shaken = cells.map((cell, i) => (i % 5 ? cell : { lab: labOf(20, 20, 20) }))
    let state = watch(watchAfter(), cells, 0, face).state
    state = watch(state, shaken, HOLD_MS / 2, face).state
    expect(watch(state, cells, HOLD_MS, face).taken).toHaveLength(36)
    // Half its cells moved: the puzzle turned, it starts over.
    const turned = cells.map((cell, i) => (i % 2 ? cell : { lab: lab('Y') }))
    state = watch(watchAfter(), cells, 0, face).state
    expect(watch(state, turned, HOLD_MS, face).taken).toBeUndefined()
  })
})
