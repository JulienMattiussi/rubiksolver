import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { scrambleTurns } from '@/lib/core/moves'
import { parseMoves } from '@/lib/core/notation'
import { barCells, barsAtStart, barsTurned } from '@/lib/puzzles/bandaged/roadblock'
import { buildCube, cubeToEdit, emptyEdit } from '@/lib/editor/edit'
import { BARS, paintBar } from '@/lib/puzzles/bandaged/roadblockEntry'
import { paint } from '@/lib/editor/modes/colors'
import { togglesOfKeys } from '@/lib/editor/modes/toggles'
import type { EditStickers } from '@/lib/editor/entry'
import { validateCube } from '@/lib/editor/validate'
import { applyMoves, turnAllowed } from '@/lib/core/turn'
import type { Move } from '@/lib/core/types'
import { seededRng } from '../../../helpers'

const SOLVED = solvedCube('roadblock')

/** A bar painted from a center (`paintBar`), the faces `turned` a quarter. */
const barPaint = (edit: EditStickers, at: string, ni: number, turned: string[]) =>
  paintBar(
    (e, key, keep) => paint(e, 'roadblock', key, ni, 'W', undefined, keep),
    edit,
    at,
    ni,
    'W',
    togglesOfKeys(turned),
  )

/** The cubies a sequence moves or turns, from solved. */
const movedBy = (formula: string) => {
  const after = applyMoves(SOLVED, parseMoves(formula))
  return after.filter(
    (c, i) =>
      c.position.join() !== SOLVED[i]!.position.join() ||
      c.stickers.some((s, k) => s.normal.join() !== SOLVED[i]!.stickers[k]!.normal.join()),
  )
}

describe('RoadBlock-I', () => {
  it('turns its equator slices at START, no other slice', () => {
    expect(turnAllowed(SOLVED, { face: 'U', amount: 1, depth: 2 })).toBe(true)
    expect(turnAllowed(SOLVED, { face: 'U', amount: 1, depth: 3 })).toBe(true)
    expect(turnAllowed(SOLVED, { face: 'R', amount: 1, depth: 2 })).toBe(false)
    expect(turnAllowed(SOLVED, { face: 'F', amount: 1, depth: 3 })).toBe(false)
    // Its faces always turn.
    expect(turnAllowed(SOLVED, { face: 'R', amount: 1 })).toBe(true)
  })

  it('lets a slice turn once the faces around its axis lie across it', () => {
    const laid = applyMoves(SOLVED, parseMoves('U D F B'))
    expect(turnAllowed(laid, { face: 'R', amount: 1, depth: 2 })).toBe(true)
    expect(turnAllowed(laid, { face: 'U', amount: 1, depth: 2 })).toBe(false)
  })

  it('keeps START through a face half turn, not a quarter', () => {
    expect(barsAtStart(applyMoves(SOLVED, parseMoves('R2 U2')))).toBe(true)
    expect(barsAtStart(applyMoves(SOLVED, parseMoves('R')))).toBe(false)
  })

  it('keeps START through an equator slice quarter, its parity fix (4 wings cycled)', () => {
    expect(barsAtStart(applyMoves(SOLVED, parseMoves('2U')))).toBe(true)
    const wings = movedBy('2U').filter(
      (c) => c.position.filter((v) => Math.abs(v) === 2).length === 2,
    )
    expect(wings).toHaveLength(4)
  })

  it('is solved by its colors alone, its bars either way', () => {
    // The top's bars turned a quarter (along z, not x): still solved.
    const turned = SOLVED.map((c) =>
      c.position[1] === 2 && c.stickers.some((s) => s.color === 'H')
        ? {
            ...c,
            stickers: c.stickers.map((s) =>
              s.color === 'H' ? { ...s, normal: [0, 0, 1] as const } : s,
            ),
          }
        : c,
    )
    expect(barsAtStart(turned)).toBe(false)
    expect(isSolved(turned)).toBe(true)
  })

  it('is entered with its bars lying either way, from the current state', () => {
    // A face turned a quarter: its bars across, then entered back as it is.
    const cube = applyMoves(SOLVED, parseMoves('R U'))
    expect(barsTurned(cube).sort()).toEqual(['0,2,0', '2,0,0'])
    const built = buildCube(cubeToEdit(cube), 'roadblock', undefined, {
      toggles: BARS.of(cube),
      parts: {},
    })
    expect(validateCube(built)).toEqual({ ok: true })
    // The same position: undone, back to START.
    const undone = applyMoves(built, parseMoves("U' R'"))
    expect(isSolved(undone) && barsAtStart(undone)).toBe(true)
  })

  it("paints a center's whole bar, the way its face's bars lie", () => {
    const top = emptyEdit('roadblock')
    // The top's bars along x at START, along z turned.
    const along = (turned: string[]) =>
      Object.keys(barPaint(top, '0,2,1', 2, turned)).filter((id) => !(id in top))
    expect(barCells([0, 2, 1], [])).toEqual([
      [-1, 2, 1],
      [0, 2, 1],
      [1, 2, 1],
    ])
    expect(along([]).sort()).toEqual(['-1,2,1:2', '0,2,1:2', '1,2,1:2'])
    expect(along(['0,2,0']).sort()).toEqual(['0,2,-1:2', '0,2,0:2', '0,2,1:2'])
  })

  it("turns a face's bars with their colors, and back", () => {
    const edit = cubeToEdit(applyMoves(SOLVED, parseMoves('2U')))
    const turned = BARS.carry!(edit, '2,0,0', 0)
    expect(turned).not.toEqual(edit)
    expect(BARS.carry!(turned, '2,0,0', 1)).toEqual(edit)
  })

  it('takes a whole bar back when a paint needs its color', () => {
    // Solved, every white center used: a white bar on the front takes one back.
    const edit = barPaint(cubeToEdit(SOLVED), '0,1,2', 4, [])
    expect(['-1,1,2:4', '0,1,2:4', '1,1,2:4'].map((id) => edit[id])).toEqual(['W', 'W', 'W'])
    const top = Object.keys(edit).filter((id) => id.endsWith(':2') && /^-?\d,2,-?\d/.test(id))
    const emptied = Object.keys(cubeToEdit(SOLVED)).filter((id) => edit[id] === undefined)
    // A whole white bar of the top emptied, nothing else.
    expect(emptied).toHaveLength(3)
    expect(emptied.every((id) => id.split(',')[1] === '2')).toBe(true)
    expect(top.length).toBeGreaterThan(0)
  })

  it('scrambles its slices too', () => {
    const moves = scrambleTurns('roadblock', 40, seededRng(1), SOLVED) as Move[]
    expect(moves.filter((m) => m.depth).length).toBeGreaterThan(10)
  })
})
