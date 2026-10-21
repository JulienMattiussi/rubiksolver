import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { cubeToEdit } from '@/lib/editor/edit'
import { cheapestAssignment } from '@/lib/editor/scan/assign'
import { guessColor, labOf } from '@/lib/editor/scan/color'
import { HOLD_MS, showsFace, watch, watchAfter } from '@/lib/editor/scan/capture'
import { readScan } from '@/lib/editor/scan/classify'
import { frameOnScreen, screenToPicture } from '@/lib/editor/scan/frame'
import { turnCells } from '@/lib/editor/scan/orient'
import { scannable, scanPlan } from '@/lib/editor/scan/plan'
import { sampleGrid } from '@/lib/editor/scan/sample'
import { seededRng } from '../../helpers'
import { picture, RGB, scanOf } from './scanPictures'

describe('scan plan', () => {
  it('scans the plain cubes, not the cuboids nor the super cubes', () => {
    for (const shape of ['2', '3', '4', '5', '6'] as const) expect(scannable(shape)).toBe(true)
    expect(scannable('334')).toBe(false)
    expect(scannable('super5')).toBe(false)
  })

  it('tells a face by its center, none on an even cube', () => {
    expect(scanPlan('3').map((f) => f.center)).toEqual(Array(6).fill(4))
    expect(scanPlan('4').map((f) => f.center)).toEqual(Array(6).fill(null))
  })

  it('shows each face of the solved 3x3 in its own color, up on top', () => {
    const plan = scanPlan('3')
    const solved = cubeToEdit(solvedCube('3'))
    expect(plan.map((f) => f.frontColor)).toEqual(['G', 'R', 'B', 'O', 'W', 'Y'])
    for (const face of plan) {
      expect(face.cells.map((id) => solved[id])).toEqual(Array(9).fill(face.frontColor))
    }
    // Green in front, white up: the top row is y = 1, read from x = -1.
    expect(plan[0]!.cells.slice(0, 3)).toEqual(['-1,1,1:4', '0,1,1:4', '1,1,1:4'])
    // White in front, red up: the top row is x = 1, its left on the back.
    expect(plan[4]!.cells.slice(0, 3)).toEqual(['1,1,-1:2', '1,1,0:2', '1,1,1:2'])
  })
})

describe('scan frame', () => {
  it('centers the frame and finds it in a picture cropped to fill the screen', () => {
    const screen = { width: 400, height: 800 }
    const rect = frameOnScreen(screen, 3, 3)
    expect(rect).toEqual({ x: 56, y: 256, width: 288, height: 288 })
    // A 1280x720 picture covers 400x800 scaled by 800/720: its sides cut.
    const seen = screenToPicture(rect, screen, { width: 1280, height: 720 })
    expect(seen.width).toBeCloseTo(259.2)
    expect(seen.x + seen.width / 2).toBeCloseTo(640)
    expect(seen.y + seen.height / 2).toBeCloseTo(360)
  })

  it('keeps the frame between the instruction and the buttons', () => {
    // A phone: as wide as before, centered in the room left.
    expect(frameOnScreen({ width: 400, height: 800 }, 3, 3, 200, 88)).toEqual({
      x: 56,
      y: 312,
      width: 288,
      height: 288,
    })
    // A laptop: the height left makes it smaller.
    const laptop = frameOnScreen({ width: 1280, height: 700 }, 4, 4, 220, 88)
    expect(laptop.height).toBeCloseTo(0.92 * 392)
    expect(laptop.y).toBeGreaterThan(220)
  })
})

describe('scan colors', () => {
  /** A measure of this lightness, chroma and hue. */
  const lch = (l: number, c: number, hue: number) =>
    [l, c * Math.cos((hue * Math.PI) / 180), c * Math.sin((hue * Math.PI) / 180)] as const

  it('guesses the cube colors of their usual tones, surely', () => {
    for (const [color, rgb] of Object.entries(RGB)) {
      expect(guessColor(labOf(...rgb))).toEqual({ color, sure: true })
    }
    expect(guessColor(labOf(15, 15, 15)).color).toBeNull()
  })

  it('is not sure of a color near a bound', () => {
    // Between yellow and green, between white and a color, too dim.
    expect(guessColor(lch(70, 60, 126))).toEqual({ color: 'Y', sure: false })
    expect(guessColor(lch(70, 60, 130))).toEqual({ color: 'G', sure: false })
    // Between red and orange, one of the two all the same.
    expect(guessColor(lch(50, 60, 38))).toEqual({ color: 'R', sure: true })
    expect(guessColor(lch(50, 60, 40))).toEqual({ color: 'O', sure: true })
    expect(guessColor(lch(80, 28, 90))).toEqual({ color: 'W', sure: false })
    // A webcam's pale orange, bluish white.
    expect(guessColor(lch(62, 38, 51))).toEqual({ color: 'O', sure: true })
    expect(guessColor(lch(71, 23, 265))).toEqual({ color: 'W', sure: true })
    expect(guessColor(lch(17, 60, 150))).toEqual({ color: 'G', sure: false })
    // A webcam's orange and red (2026-10-21), its yellow leaning green.
    expect(guessColor(lch(60, 48, 46))).toEqual({ color: 'O', sure: true })
    expect(guessColor(lch(36, 48, 23))).toEqual({ color: 'R', sure: true })
    // A brighter red (a 4x4's, 2026-10-21).
    expect(guessColor(lch(52, 76, 30))).toEqual({ color: 'R', sure: true })
    expect(guessColor(lch(80, 70, 120))).toEqual({ color: 'Y', sure: true })
    expect(guessColor(lch(55, 60, 140))).toEqual({ color: 'G', sure: true })
    // Red wraps round: no bound at 0.
    expect(guessColor(lch(50, 60, 1))).toEqual({ color: 'R', sure: true })
  })

  const greens = () => sampleGrid(picture(Array(9).fill('G'), 3, 3, seededRng(1)), 3, 3)
  const [green, , blue] = scanPlan('3')

  it('takes a face once its colors held for long enough', () => {
    const cells = greens()
    expect(showsFace(cells, green!)).toBe(true)
    expect(showsFace(cells, blue!)).toBe(false)
    let state = watch(watchAfter(), cells, 0, green!, false).state
    const half = watch(state, cells, HOLD_MS / 2, green!, false)
    expect(half.taken).toBeUndefined()
    state = half.state
    expect(watch(state, cells, HOLD_MS, green!, false).taken).toHaveLength(9)
  })

  it('starts over when a color read changes', () => {
    const cells = greens()
    const other = [{ lab: labOf(...RGB.B) }, ...cells.slice(1)]
    let state = watch(watchAfter(), cells, 0, green!, false).state
    state = watch(state, other, HOLD_MS / 2, green!, false).state
    expect(watch(state, other, HOLD_MS, green!, false).taken).toBeUndefined()
    expect(watch(state, other, (HOLD_MS * 3) / 2, green!, false).taken).toHaveLength(9)
  })

  it('holds a cell between red and orange still', () => {
    const face = scanPlan('2')[0]!
    const cells = sampleGrid(picture(['R', 'W', 'B', 'Y'], 2, 2, seededRng(7)), 2, 2)
    const orange = [{ lab: lch(50, 60, 40) }, ...cells.slice(1)]
    const red = [{ lab: lch(50, 60, 38) }, ...cells.slice(1)]
    let state = watch(watchAfter(), red, 0, face, false).state
    state = watch(state, orange, HOLD_MS / 2, face, false).state
    expect(watch(state, red, HOLD_MS, face, false).taken).toHaveLength(4)
  })

  it('takes an all white face of an even cube as the last one only', () => {
    const face = scanPlan('2')[0]!
    const white = sampleGrid(picture(['W', 'W', 'W', 'W'], 2, 2, seededRng(3)), 2, 2)
    const held = (last: boolean) => {
      let state = watchAfter()
      for (const now of [0, HOLD_MS / 2, HOLD_MS]) {
        const step = watch(state, white, now, face, last)
        if (step.taken) return true
        state = step.state
      }
      return false
    }
    expect(held(false)).toBe(false)
    expect(held(true)).toBe(true)
    // A center tells the face: the 3x3's white one is taken anywhere.
    const top = scanPlan('3')[4]!
    const whites = sampleGrid(picture(Array(9).fill('W'), 3, 3, seededRng(3)), 3, 3)
    expect(showsFace(whites, top)).toBe(true)
    expect(watch(watchAfter(), whites, 0, top, false).state.frames).toHaveLength(1)
  })

  it('reads a sticker half under a glare in its color', () => {
    const pixels = picture(['R'], 1, 1, seededRng(6))
    // The top 60% of the sticker white with glare.
    for (let k = 0; k < pixels.width * Math.floor(pixels.height * 0.6) * 4; k += 4) {
      ;(pixels.data as Uint8ClampedArray).set([250, 250, 250], k)
    }
    expect(guessColor(sampleGrid(pixels, 1, 1)[0]!.lab).color).toBe('R')
    // A white sticker stays white.
    const white = picture(['W'], 1, 1, seededRng(6))
    expect(guessColor(sampleGrid(white, 1, 1)[0]!.lab).color).toBe('W')
  })

  it('takes no face with a cell it is not sure of', () => {
    const cells = [{ lab: lch(70, 60, 128) }, ...greens().slice(1)]
    expect(showsFace(cells, green!)).toBe(false)
  })

  it('takes any face of an even cube, but not the one just taken again', () => {
    const face = scanPlan('2')[1]!
    const cells = sampleGrid(picture(['W', 'R', 'B', 'Y'], 2, 2, seededRng(2)), 2, 2)
    expect(showsFace(cells, face)).toBe(true)
    // Still showing the face taken before: waits for the cube to turn.
    let state = watchAfter(cells)
    for (const now of [0, HOLD_MS, 2 * HOLD_MS]) {
      const seen = watch(state, cells, now, face, false)
      expect(seen.taken).toBeUndefined()
      state = seen.state
    }
    // Once the picture changed, the same colors may be a face again.
    state = watch(state, greens().slice(0, 4), 3 * HOLD_MS, face, false).state
    state = watch(state, cells, 4 * HOLD_MS, face, false).state
    expect(watch(state, cells, 5 * HOLD_MS, face, false).taken).toHaveLength(4)
  })
})

describe('reading a scan', () => {
  it('assigns the cheapest way', () => {
    expect(
      cheapestAssignment([
        [4, 1, 3],
        [2, 0, 5],
        [3, 2, 2],
      ]),
    ).toEqual([1, 0, 2])
  })

  const CUBES = ['2', '3', '4', '5', '6'] as const

  it.each(CUBES)('reads a scrambled %s back', (shape) => {
    const { faces, edit } = scanOf(shape, 7)
    expect(readScan(shape, faces)).toEqual({ ok: true, edit })
  })

  it('turns the cells of a face a quarter clockwise', () => {
    const face = scanPlan('3')[0]!
    const cells = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    expect(turnCells(cells, face, 1)).toEqual([7, 4, 1, 8, 5, 2, 9, 6, 3])
    expect(turnCells(cells, face, 2)).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1])
    expect(turnCells(cells, face, 3)).toEqual(turnCells(turnCells(cells, face, 2), face, 1))
  })

  it.each(CUBES)('finds back the faces of a %s held turned', (shape) => {
    for (const seed of [11, 12, 13]) {
      const { faces, edit } = scanOf(shape, seed)
      const rng = seededRng(seed)
      const held = faces.map((cells, f) =>
        turnCells(cells, scanPlan(shape)[f]!, Math.floor(rng() * 4)),
      )
      expect(readScan(shape, held)).toEqual({ ok: true, edit })
    }
  })

  it('tells the face to take again when one is misread', () => {
    const { faces } = scanOf('3', 8)
    // The third face's corner seen purple: no piece shows that.
    faces[2]![0] = { lab: labOf(150, 40, 200) }
    expect(readScan('3', faces)).toEqual({ ok: false, face: 2 })
  })
})
