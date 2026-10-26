import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { applyMoves } from '@/lib/core/turn'
import { scrambleTurns } from '@/lib/core/moves'
import { AXIS_ROTATIONS } from '@/lib/core/geometry'
import { lookOf } from '@/lib/editor/modes/form'
import { cubeToEdit } from '@/lib/editor/edit'
import { cheapestAssignment } from '@/lib/editor/scan/assign'
import { guessColor, labOf } from '@/lib/editor/scan/color'
import { HOLD_MS, showsFace, watch, watchAfter } from '@/lib/editor/scan/capture'
import { readScan } from '@/lib/editor/scan/read'
import { frameOnScreen, screenToPicture } from '@/lib/editor/scan/frame'
import { turnCells } from '@/lib/editor/scan/orient'
import { gridLayout } from '@/lib/editor/scan/layout'
import { scannable, scanPlan } from '@/lib/editor/scan/plan'
import { sampleFace, type Pixels } from '@/lib/editor/scan/sample'
import { SHAPE_DIMS, SHAPE_SCAN_TRIED, SHAPE_SCAN_UNSEEN, type CubeShape } from '@/lib/core/shapes'
import {
  MEGA_FACES,
  megaAround,
  megaSlotAt,
  solvedMegaminx,
} from '@/lib/puzzles/polyhedron/megaminx'
import { MARK, type Color } from '@/lib/core/types'
import { seededRng } from '../../helpers'
import { boxScanOf, facePicture, picture, RGB, scanOf } from './scanPictures'

/** A grid face's cells, measured. */
const sampleGrid = (pixels: Pixels, rows: number, cols: number) =>
  sampleFace(pixels, gridLayout(rows, cols))

/** Every puzzle a camera can scan; those whose form the scan finds
 *  (the towers) apart. */
const SCANNABLE = (Object.keys(SHAPE_DIMS) as CubeShape[]).filter((s) => scannable(s))
// Read from their cells (not a face out of shape, nor one read whole).
// (halves.test.ts reads those whose cells hold halves.)
const SCANNED = SCANNABLE.filter(
  (shape) => !scanPlan(shape)[0]?.open && !scanPlan(shape)[0]?.whole && !scanPlan(shape)[0]?.halves,
)
const OUT_OF_SHAPE = SCANNABLE.filter((shape) => scanPlan(shape)[0]?.open)

describe('scan plan', () => {
  it('scans the puzzles it can read, not those entered otherwise', () => {
    expect(SCANNED).toEqual(
      expect.arrayContaining(['2', '3', '4', '5', '6', '123', '331', '332', '334']),
    )
    expect(SCANNED).toEqual(expect.arrayContaining(['void', 'edge', 'megaminx', 'holey']))
    // The pyramids by their flat faces; not those that change shape.
    expect(SCANNED).toEqual(expect.arrayContaining(['pyra', 'tetra', 'pyra4', 'pyra5', 'jing']))
    expect(scannable('morph')).toBe(false)
    expect(scannable('mmorph')).toBe(false)
    expect(OUT_OF_SHAPE).toEqual(['224', '234'])
    // Read whole, by the outlines of its silver pieces (outlines.test.ts).
    expect(scannable('ghost')).toBe(true)
    // Pieces a camera cannot tell, or a model entering them otherwise.
    for (const shape of ['super5', 'camo', 'tori'] as const) {
      expect(scannable(shape)).toBe(false)
    }
  })

  it('says which puzzles it was tried on for real', () => {
    const tried = (Object.keys(SHAPE_SCAN_TRIED) as CubeShape[]).filter((s) => SHAPE_SCAN_TRIED[s])
    expect(tried).toEqual(['2', '3', '4', '224', 'skewb', 'ivy'])
    expect(tried.every((s) => scannable(s))).toBe(true)
  })

  it('tells a face by its center, only where every face has one', () => {
    expect(scanPlan('3').map((f) => f.center)).toEqual(Array(6).fill(4))
    // The Floppy's edges, one sticker high, have one too.
    expect(scanPlan('331').map((f) => [f.height, f.width, f.center])).toEqual([
      [1, 3, 1],
      [1, 3, 1],
      [1, 3, 1],
      [1, 3, 1],
      [3, 3, 4],
      [3, 3, 4],
    ])
    expect(scanPlan('4').map((f) => f.center)).toEqual(Array(6).fill(null))
    // The Void Cube's hole: eight cells a face, none its center, its turns
    // kept to them.
    for (const face of scanPlan('void')) {
      expect([face.cells.length, face.center, face.turns.length]).toEqual([8, null, 4])
      expect(face.turns.every((turn) => [...turn].sort().join() === '0,1,2,3,4,5,6,7')).toBe(true)
    }
    // The 1x2x3's ends have one, its sides none: none tells its face.
    expect(scanPlan('123').map((f) => f.center)).toEqual([null, null, null, null, 1, 1])
    expect(scanPlan('123').some((f) => f.told)).toBe(false)
    expect(scanPlan('3').every((f) => f.told)).toBe(true)
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

describe('scanning a Megaminx', () => {
  const plan = scanPlan('megaminx')

  it('shows its twelve faces, each a ring of 11 round its center', () => {
    expect(scannable('megaminx')).toBe(true)
    expect(plan).toHaveLength(12)
    expect(new Set(plan.map((f) => f.frontColor)).size).toBe(12)
    for (const face of plan) {
      expect(face.cells).toHaveLength(11)
      expect(face.center).toBe(0)
      expect(face.turns).toHaveLength(5)
      expect(face.named).toBe(false)
    }
    // Every sticker once.
    expect(new Set(plan.flatMap((f) => f.cells)).size).toBe(132)
  })

  it('takes a face once its measures barely drift, its colors unnamed', () => {
    const face = plan[1]!
    const colors = face.cells.map((_, i) => (['G', 'L', 'T', 'N', 'M', 'P'] as const)[i % 6]!)
    const cells = sampleFace(facePicture(colors, face, seededRng(8)), face)
    const again = sampleFace(facePicture(colors, face, seededRng(9)), face)
    let state = watch(watchAfter(), cells, 0, face).state
    state = watch(state, again, HOLD_MS / 2, face).state
    expect(watch(state, cells, HOLD_MS, face).taken).toHaveLength(11)
    // Another sticker under the lens: it starts over.
    const moved = [{ lab: labOf(...RGB.Y) }, ...cells.slice(1)]
    expect(watch(state, moved, HOLD_MS, face).taken).toBeUndefined()
  })
})

describe('scanning a Holey Megaminx', () => {
  const plan = scanPlan('holey')
  // Each face by its solved color (the Megaminx's, as labels).
  const solved = solvedMegaminx()
  const faceOf = new Map(
    MEGA_FACES.map((f) => [
      solved.find((c) => c.stickers.length === 1 && megaSlotAt(c.position).join() === f)!
        .stickers[0]!.color,
      f,
    ]),
  )
  const near = (a: Color, b: Color) => megaAround(faceOf.get(a)!).includes(faceOf.get(b)!)

  it('shows its twelve faces by gestures, ten cells each, no center', () => {
    expect(plan.map((f) => f.move).join()).toBe(
      'first,turn,turn,turn,turn,tilt,flip,tilt,below,below,below,below',
    )
    expect(new Set(plan.map((f) => f.frontColor)).size).toBe(12)
    expect(new Set(plan.flatMap((f) => f.cells)).size).toBe(120)
    for (const face of plan) expect([face.cells.length, face.center]).toEqual([10, null])
    expect(plan.map((f) => f.angle)).toEqual([null, 72, 72, 72, 72, 63, 180, 63, 72, 72, 72, 72])
  })

  it('gets from each face to the next by its gesture', () => {
    plan.slice(1).forEach((face, i) => {
      const was = plan[i]!
      // Turned: round the same face, on top or at the bottom, to its
      // neighbor; tilted: the face on top comes in front; turned half
      // round: the face opposite.
      if (face.move === 'turn' || face.move === 'below') {
        expect([face.upColor, near(face.frontColor, was.frontColor)]).toEqual([was.upColor, true])
      } else if (face.move === 'tilt') {
        expect([face.frontColor, face.upColor]).toEqual([was.upColor, was.frontColor])
      } else {
        expect(near(face.frontColor, was.frontColor)).toBe(false)
        expect(face.frontColor).not.toBe(was.frontColor)
      }
    })
  })
})

describe('scanning a tower out of shape', () => {
  /** A scrambled tower, out of shape, held its long side upright. */
  const towerOf = (shape: CubeShape, seed: number) => {
    const rng = seededRng(seed)
    const solved = solvedCube(shape)
    const state = applyMoves(solved, scrambleTurns(shape, 25, rng, solved))
    return AXIS_ROTATIONS.map((turn) =>
      state.map((c) => ({
        ...c,
        position: turn(c.position),
        stickers: c.stickers.map((s) => ({ ...s, normal: turn(s.normal) })),
      })),
    ).find((c) => new Set(c.map((p) => p.position[1])).size === 4)!
  }

  it('scans the box it turns in, each face a grid of its cells', () => {
    const plan = scanPlan('224')
    expect(plan.map((f) => [f.height, f.width])).toEqual(Array(6).fill([4, 4]))
    expect(plan.every((f) => f.open && !f.told)).toBe(true)
    expect(plan[0]!.move).toBe('upright')
  })

  it.each(OUT_OF_SHAPE)('finds the form and the colors of a %s', (shape) => {
    for (const seed of [1, 2, 3]) {
      const held = towerOf(shape, seed)
      const reading = readScan(shape, boxScanOf(shape, held, seed))
      expect(reading.ok && lookOf(reading.form!)).toBe(lookOf(held))
      expect(reading.ok && reading.edit).toEqual(cubeToEdit(held))
    }
  })

  it('reads a tower filmed from behind (by a laptop camera), sides the other way', () => {
    const held = towerOf('224', 6)
    const faces = boxScanOf('224', held, 6)
    // Turned to the right as the user sees it: the left side after the
    // front; then the top and the bottom upside down.
    const taken = [0, 3, 2, 1, 4, 5].map((f) => (f < 4 ? faces[f]! : [...faces[f]!].reverse()))
    const reading = readScan('224', taken, true)
    expect(reading.ok && lookOf(reading.form!)).toBe(lookOf(held))
    // The face to take again said as taken.
    taken[1] = taken[1]!.map(() => ({ lab: [50, 0, 0] as const }))
    expect(readScan('224', taken, true)).toMatchObject({ ok: false })
  })

  it('holds a tower face still by its stickers, whatever its background', () => {
    const face = scanPlan('224')[0]!
    const cells = boxScanOf('224', towerOf('224', 4), 4)[0]!
    // A hand moving in an empty cell: still the same face.
    const empty = cells.findIndex((c) => !guessColor(c.lab).sure)
    const moved = cells.map((c, i) => (i === empty ? { lab: labOf(220, 160, 130) } : c))
    let state = watch(watchAfter(), cells, 0, face).state
    state = watch(state, moved, HOLD_MS / 2, face).state
    expect(watch(state, cells, HOLD_MS, face).taken).toHaveLength(16)
  })

  it('holds a tower face still though a sticker turns doubtful a moment', () => {
    const face = scanPlan('224')[0]!
    const cells = boxScanOf('224', towerOf('224', 4), 4)[0]!
    // A sure sticker read doubtful (a logo, a glare) in one picture.
    const sure = cells.findIndex((c) => guessColor(c.lab).sure)
    const doubtful = cells.map((c, i) => (i === sure ? { lab: labOf(120, 120, 120) } : c))
    let state = watch(watchAfter(), cells, 0, face).state
    state = watch(state, doubtful, HOLD_MS / 2, face).state
    expect(watch(state, cells, HOLD_MS, face).taken).toHaveLength(16)
    // A sticker of another color: it moved.
    const moved = cells.map((c, i) => (i === sure ? { lab: labOf(0, 80, 190) } : c))
    state = watch(watchAfter(), cells, 0, face).state
    expect(watch(state, moved, HOLD_MS / 2, face).state.since).toBe(HOLD_MS / 2)
  })

  it('takes a face showing black sides and the background', () => {
    const face = scanPlan('224')[0]!
    const held = towerOf('224', 4)
    const cells = boxScanOf('224', held, 4)[0]!
    expect(showsFace(cells, face)).toBe(true)
  })
})

describe('scan frame', () => {
  it('centers the frame and finds it in a picture cropped to fill the screen', () => {
    const screen = { width: 400, height: 800 }
    const rect = frameOnScreen(screen, { width: 3, height: 3 })
    expect(rect).toEqual({ x: 56, y: 256, width: 288, height: 288 })
    // A 1280x720 picture covers 400x800 scaled by 800/720: its sides cut.
    const seen = screenToPicture(rect, screen, { width: 1280, height: 720 })
    expect(seen.width).toBeCloseTo(259.2)
    expect(seen.x + seen.width / 2).toBeCloseTo(640)
    expect(seen.y + seen.height / 2).toBeCloseTo(360)
  })

  it('keeps the frame between the instruction and the buttons', () => {
    // A phone: as wide as before, centered in the room left.
    expect(frameOnScreen({ width: 400, height: 800 }, { width: 3, height: 3 }, 200, 88)).toEqual({
      x: 56,
      y: 312,
      width: 288,
      height: 288,
    })
    // A laptop: the height left makes it smaller.
    const laptop = frameOnScreen({ width: 1280, height: 700 }, { width: 4, height: 4 }, 220, 88)
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
    let state = watch(watchAfter(), cells, 0, green!).state
    const half = watch(state, cells, HOLD_MS / 2, green!)
    expect(half.taken).toBeUndefined()
    state = half.state
    expect(watch(state, cells, HOLD_MS, green!).taken).toHaveLength(9)
  })

  it('starts over when a color read changes', () => {
    const cells = greens()
    const other = [{ lab: labOf(...RGB.B) }, ...cells.slice(1)]
    let state = watch(watchAfter(), cells, 0, green!).state
    state = watch(state, other, HOLD_MS / 2, green!).state
    expect(watch(state, other, HOLD_MS, green!).taken).toBeUndefined()
    expect(watch(state, other, (HOLD_MS * 3) / 2, green!).taken).toHaveLength(9)
  })

  it('holds a cell between red and orange still', () => {
    const face = scanPlan('2')[0]!
    const cells = sampleGrid(picture(['R', 'W', 'B', 'Y'], 2, 2, seededRng(7)), 2, 2)
    const orange = [{ lab: lch(50, 60, 40) }, ...cells.slice(1)]
    const red = [{ lab: lch(50, 60, 38) }, ...cells.slice(1)]
    let state = watch(watchAfter(), red, 0, face).state
    state = watch(state, orange, HOLD_MS / 2, face).state
    expect(watch(state, red, HOLD_MS, face).taken).toHaveLength(4)
  })

  it('takes an all white face like any other (the user tapped: no wall)', () => {
    const face = scanPlan('2')[0]!
    const white = sampleGrid(picture(['W', 'W', 'W', 'W'], 2, 2, seededRng(3)), 2, 2)
    let state = watchAfter()
    state = watch(state, white, 0, face).state
    expect(watch(state, white, HOLD_MS, face).taken).toHaveLength(4)
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
      const seen = watch(state, cells, now, face)
      expect(seen.taken).toBeUndefined()
      state = seen.state
    }
    // Once the picture changed, the same colors may be a face again.
    state = watch(state, greens().slice(0, 4), 3 * HOLD_MS, face).state
    state = watch(state, cells, 4 * HOLD_MS, face).state
    expect(watch(state, cells, 5 * HOLD_MS, face).taken).toHaveLength(4)
  })
})

/** A scan's reading, what it cannot see left out (a Windmill's side
 *  centers' way round, their hidden marks: checked by hand after it). */
const seen = (shape: CubeShape, read: ReturnType<typeof readScan>) =>
  SHAPE_SCAN_UNSEEN[shape] && read.ok
    ? { ...read, edit: Object.fromEntries(Object.entries(read.edit).filter(([, c]) => c !== MARK)) }
    : read

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

  // A laptop's camera: told to turn it "to the right", as the mirrored
  // picture shows, the user turns it the other way round; every face is
  // asked, checked and read as it then comes.
  it.each(SCANNED)('reads a scrambled %s shown to a laptop’s camera', (shape) => {
    const { faces, edit } = scanOf(shape, 8, true)
    expect(seen(shape, readScan(shape, faces, true))).toEqual(seen(shape, { ok: true, edit }))
  })

  it('names a 3x3’s faces as a laptop’s gestures bring them: left and right swapped', () => {
    const named = scanPlan('3', 'classic', true).map((f) => [f.frontColor, f.upColor])
    expect(named).toEqual([
      ['G', 'W'],
      ['O', 'W'],
      ['B', 'W'],
      ['R', 'W'],
      ['W', 'O'],
      ['Y', 'O'],
    ])
  })

  it.each(SCANNED)('reads a scrambled %s back', (shape) => {
    const { faces, edit } = scanOf(shape, 7)
    expect(seen(shape, readScan(shape, faces))).toEqual(seen(shape, { ok: true, edit }))
  })

  it('turns the cells of a face a quarter clockwise', () => {
    const face = scanPlan('3')[0]!
    const cells = [1, 2, 3, 4, 5, 6, 7, 8, 9]
    expect(turnCells(cells, face, 1)).toEqual([7, 4, 1, 8, 5, 2, 9, 6, 3])
    expect(turnCells(cells, face, 2)).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1])
    expect(turnCells(cells, face, 3)).toEqual(turnCells(turnCells(cells, face, 2), face, 1))
  })

  // A cube's faces held turned are found back; a cuboid's or a flat one's
  // may make real pieces either way (a Floppy's edge read backward), and
  // so may those whose only pieces on two faces are a few edges (the Edge
  // Only, the Dino, the Rex: then a face is asked again), and the
  // 4-Trajber's, whose pieces each show one sticker only (none tells how a
  // face was held), and the FTO's, whose centers do, and the Rainbow's,
  // scanned by its squares, each piece seen by two stickers only: held as
  // told, they read back above.
  const FEW_EDGES: readonly CubeShape[] = ['edge', 'dino', 'rex', 'oct4', 'fto', 'rainbow']
  const CUBES = SCANNED.filter(
    (shape) => new Set(SHAPE_DIMS[shape]).size === 1 && !FEW_EDGES.includes(shape),
  )

  it.each(CUBES)('finds back the faces of a %s held turned', (shape) => {
    for (const seed of [11, 12, 13]) {
      const { faces, edit } = scanOf(shape, seed)
      const rng = seededRng(seed)
      const held = faces.map((cells, f) => {
        const face = scanPlan(shape)[f]!
        return turnCells(cells, face, Math.floor(rng() * face.turns.length))
      })
      expect(seen(shape, readScan(shape, held))).toEqual(seen(shape, { ok: true, edit }))
    }
  })

  it('tells the face to take again when one is misread', () => {
    const { faces } = scanOf('3', 8)
    // The third face's corner seen purple: no piece shows that.
    faces[2]![0] = { lab: labOf(150, 40, 200) }
    expect(readScan('3', faces)).toEqual({ ok: false, face: 2 })
  })
})
