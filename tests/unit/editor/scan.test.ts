import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { cubeToEdit } from '@/lib/editor/edit'
import { cheapestAssignment } from '@/lib/editor/scan/assign'
import { guessColor, labOf } from '@/lib/editor/scan/color'
import { HOLD_MS, NO_WATCH, showsFace, watch } from '@/lib/editor/scan/capture'
import { readScan } from '@/lib/editor/scan/classify'
import { frameOnScreen, screenToPicture } from '@/lib/editor/scan/frame'
import { scannable, scanPlan } from '@/lib/editor/scan/plan'
import { sampleGrid } from '@/lib/editor/scan/sample'
import { seededRng } from '../../helpers'
import { picture, RGB, scanOf } from './scanPictures'

describe('scan plan', () => {
  it('scans the plain cubes with a center, not the others', () => {
    expect(scannable('3')).toBe(true)
    expect(scannable('5')).toBe(true)
    expect(scannable('2')).toBe(false)
    expect(scannable('4')).toBe(false)
    expect(scannable('super5')).toBe(false)
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
    // Between red and orange, between white and a color, too dim.
    expect(guessColor(lch(50, 60, 35))).toEqual({ color: 'R', sure: false })
    expect(guessColor(lch(50, 60, 37))).toEqual({ color: 'O', sure: false })
    expect(guessColor(lch(80, 28, 90))).toEqual({ color: 'W', sure: false })
    // A webcam's pale orange, bluish white.
    expect(guessColor(lch(62, 38, 51))).toEqual({ color: 'O', sure: true })
    expect(guessColor(lch(71, 23, 265))).toEqual({ color: 'W', sure: true })
    expect(guessColor(lch(17, 60, 150))).toEqual({ color: 'G', sure: false })
    // A webcam's orange and red (2026-10-21), its yellow leaning green.
    expect(guessColor(lch(60, 48, 46))).toEqual({ color: 'O', sure: true })
    expect(guessColor(lch(36, 48, 23))).toEqual({ color: 'R', sure: true })
    expect(guessColor(lch(80, 70, 120))).toEqual({ color: 'Y', sure: true })
    expect(guessColor(lch(55, 60, 140))).toEqual({ color: 'G', sure: true })
    // Red wraps round: no bound at 0.
    expect(guessColor(lch(50, 60, 1))).toEqual({ color: 'R', sure: true })
  })

  const greens = () => sampleGrid(picture(Array(9).fill('G'), 3, 3, seededRng(1)), 3, 3)

  it('takes a face once its colors held for long enough', () => {
    const cells = greens()
    expect(showsFace(cells, 4, 'G')).toBe(true)
    expect(showsFace(cells, 4, 'B')).toBe(false)
    let state = watch(NO_WATCH, cells, 0, 4, 'G').state
    const half = watch(state, cells, HOLD_MS / 2, 4, 'G')
    expect(half.taken).toBeUndefined()
    state = half.state
    expect(watch(state, cells, HOLD_MS, 4, 'G').taken).toHaveLength(9)
  })

  it('starts over when a color read changes', () => {
    const cells = greens()
    const other = [{ lab: labOf(...RGB.B) }, ...cells.slice(1)]
    let state = watch(NO_WATCH, cells, 0, 4, 'G').state
    state = watch(state, other, HOLD_MS / 2, 4, 'G').state
    expect(watch(state, other, HOLD_MS, 4, 'G').taken).toBeUndefined()
    expect(watch(state, other, (HOLD_MS * 3) / 2, 4, 'G').taken).toHaveLength(9)
  })

  it('takes no face with a cell it is not sure of', () => {
    const cells = [{ lab: lch(50, 60, 36) }, ...greens().slice(1)]
    expect(showsFace(cells, 4, 'G')).toBe(false)
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

  it.each(['3', '5'] as const)('reads a scrambled %s back', (shape) => {
    const { faces, edit } = scanOf(shape, 7)
    expect(readScan(shape, faces)).toEqual({ ok: true, edit })
  })

  it('tells the face to take again when one is misread', () => {
    const { faces } = scanOf('3', 8)
    // The third face's corner seen purple: no piece shows that.
    faces[2]![0] = { lab: labOf(150, 40, 200) }
    expect(readScan('3', faces)).toEqual({ ok: false, face: 2 })
  })
})
