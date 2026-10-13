import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/cube'
import { buildCube, cubeToEdit, emptyEdit, withFixedHome } from '@/lib/editor'
import { tablesFor } from '@/lib/editorTables'
import { applyGearMove } from '@/lib/gear'
import {
  completeGears,
  gearColorsOf,
  gearFaces,
  gearsPainted,
  paintGear,
  turnedOf,
} from '@/lib/gearEditor'
import type { Cube, Face, GearMove } from '@/lib/types'
import { validateCube } from '@/lib/validate'
import { twistedCorner } from '../helpers'

const SOLVED = solvedCube('gearU')

/** fan2cube's letters in the cube's (D = R, A = F, G = L...): each a half
 *  turn, so its D² is our R. */
const play = (moves: string): Cube =>
  moves
    .split(' ')
    .map((t): GearMove => ({ gear: t[0] as Face, amount: t.includes("'") ? 3 : 1 }))
    .reduce(applyGearMove, SOLVED)

/** What a sequence changed, piece by piece: moved, turned over, spun. */
function changes(cube: Cube) {
  return SOLVED.flatMap((c, i) => {
    const a = cube[i]!
    const moved = a.position.join() !== c.position.join()
    const turned = a.stickers.some((s, k) => s.normal.join() !== c.stickers[k]!.normal.join())
    return moved || turned || a.spin !== c.spin
      ? [{ at: c.position.join(), to: a.position.join(), turned, spin: a.spin }]
      : []
  })
}

describe('Gear Cube model', () => {
  it('turns a face half and the slice beside it a quarter, its gears five sixths', () => {
    const after = play('R')
    const slice = changes(after).filter((c) => c.at.startsWith('0,'))
    // The slice's centers and edges all moved a quarter; its 4 gears spun.
    expect(slice).toHaveLength(8)
    expect(slice.filter((c) => c.spin === 5)).toHaveLength(4)
    // The left face held.
    expect(changes(after).some((c) => c.at.startsWith('-1,'))).toBe(false)
  })

  it('pivots the 4 gears of a slice with D⁸, nothing else (fan2cube)', () => {
    const c = changes(play('R R R R'))
    expect(c.map((p) => p.at).sort()).toEqual(['0,-1,-1', '0,-1,1', '0,1,-1', '0,1,1'])
    // Four moves of five sixths: a third of a turn.
    expect(c.every((p) => p.to === p.at && !p.turned && p.spin === 2)).toBe(true)
  })

  it('swaps the clips of the 8 edges of the top and bottom with (A² D²)³ (fan2cube)', () => {
    const c = changes(play('F R F R F R'))
    expect(c).toHaveLength(8)
    // Each base turned over in place, its gear on it a half turn: the gear
    // back as it was, only its clips turned over (fan2cube's "agrafes").
    expect(c.every((p) => p.to === p.at && p.turned && p.spin === 3)).toBe(true)
    expect(c.every((p) => p.at.split(',')[1] !== '0')).toBe(true)
  })

  it('turns the whole cube over with G’² D², no piece out of place (fan2cube)', () => {
    const after = play("L' R")
    // A half turn about the left-right axis: every piece where its mirror was.
    expect(
      SOLVED.every((c, i) => {
        const [x, y, z] = c.position
        return after[i]!.position.join() === [x, -y, -z].join() && (after[i]!.spin ?? 0) === 0
      }),
    ).toBe(true)
  })

  it('comes back after twelve turns of a face (four full turns of its gears)', () => {
    const twelve = Array.from({ length: 12 }, () => 'R').join(' ')
    expect(changes(play(twelve))).toEqual([])
  })

  it('rejects an entered state it cannot reach: a corner twisted, an edge turned over', () => {
    // Its solving says where: here, the corners.
    expect(validateCube(twistedCorner('gearU'))).toEqual({
      ok: false,
      error: 'impossible',
      step: 'stepGearCorners',
    })
    const edge = SOLVED.findIndex((c) => c.spin !== undefined)
    const flipped = SOLVED.map((c, i) =>
      i === edge
        ? { ...c, stickers: c.stickers.map((s, k) => ({ ...s, color: c.stickers[1 - k]!.color })) }
        : c,
    )
    expect(validateCube(flipped).ok).toBe(false)
  })
})

describe('Gear Cube entry', () => {
  const slot = tablesFor('gearU').slots.find((s) => s.kind === 'edge')!
  const [a, b] = slot.stickers as [(typeof slot.stickers)[0], (typeof slot.stickers)[0]]
  const clips = { [a.id]: a.solvedColor, [b.id]: b.solvedColor }

  it('counts the gear faces left in each color: four per face', () => {
    const { remaining, painted, total } = gearFaces({})
    expect([painted, total]).toEqual([0, 24])
    expect(Object.values(remaining).every((n) => n === 4)).toBe(true)
  })

  it('pre-fills the centers: the slices only ever turn them all together', () => {
    const centers = tablesFor('gearU').slots.filter((s) => s.kind === 'center')
    expect(centers).toHaveLength(6)
    expect(centers.every((s) => !s.paintable)).toBe(true)
  })

  it('paints a gear apart from its clips, alone while they are not painted', () => {
    const gear = paintGear({}, emptyEdit('gearU'), slot.key, a.ni, b.solvedColor)
    expect(gear).toEqual({ [a.id]: b.solvedColor })
  })

  it('completes a gear from its clips, and refuses a color not theirs', () => {
    const edit = { ...emptyEdit('gearU'), ...clips }
    const turned = paintGear({}, edit, slot.key, a.ni, b.solvedColor)
    expect(turned).toEqual({ [a.id]: b.solvedColor, [b.id]: a.solvedColor })
    const other = SOLVED.flatMap((c) => c.stickers).find(
      (s) => s.color !== a.solvedColor && s.color !== b.solvedColor,
    )!.color
    expect(paintGear({}, edit, slot.key, a.ni, other)).toEqual({})
    // Painted before its clips, a gear's other face follows them.
    expect(completeGears({ [a.id]: a.solvedColor }, edit)).toEqual(clips)
  })

  it('tells the gears turned over on their clips, or a gear not theirs', () => {
    const cube = play('R R R')
    const edit = cubeToEdit(cube)
    const gear = gearColorsOf(cube)
    expect(gearsPainted(gear)).toEqual({ painted: 12, total: 12 })
    expect(turnedOf(gear, edit)).toHaveLength(4)
    // The same state, its pieces and their stickers listed in another order.
    const look = (cube: Cube) =>
      cube
        .map(
          (c) =>
            `${c.position.join()}:${c.stickers
              .map((s) => s.normal.join() + s.color)
              .sort()
              .join()}@${c.spin}`,
        )
        .sort()
    expect(look(buildCube(edit, 'gearU', undefined, turnedOf(gear, edit)!))).toEqual(
      look(withFixedHome(cube)), // held as entered: its centers home
    )
    expect(turnedOf({ ...gear, [a.id]: 'V' }, edit)).toBeNull()
  })
})
