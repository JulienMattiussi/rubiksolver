import { describe, expect, it } from 'vitest'
import { applyMoves, solvedCube } from '@/lib/cube'
import {
  buildCube,
  clearSlot,
  colorCounts,
  cubeToEdit,
  emptyEdit,
  filledCount,
  isComplete,
  paint,
  slotsFor,
} from '@/lib/editor'
import { scramble } from '@/lib/moves'
import { seededRng } from '../helpers'

describe('cube editor', () => {
  it('starts blank with only the six centers', () => {
    const edit = emptyEdit(3)
    expect(filledCount(edit)).toBe(6)
    expect(isComplete(edit, 3)).toBe(false)
    const counts = colorCounts(edit)
    expect(Object.values(counts).every((n) => n === 1)).toBe(true)
  })

  it('round-trips a cube through edit and back', () => {
    const cube = applyMoves(solvedCube(), scramble(20, seededRng(3)))
    const edit = cubeToEdit(cube)
    expect(isComplete(edit, 3)).toBe(true)
    expect(cubeToEdit(buildCube(edit, 3))).toEqual(edit)
  })

  it('auto-completes a corner once two stickers determine it', () => {
    let edit = emptyEdit(3)
    // Corner (1,1,1): +y (ni 2) is white, +x (ni 0) is red in the solved cube.
    edit = paint(edit, '1,1,1', 2, 'W')
    expect(filledCount(edit)).toBe(7)
    edit = paint(edit, '1,1,1', 0, 'R')
    // The third sticker (+z, ni 4) is forced to green.
    expect(filledCount(edit)).toBe(9)
    expect(edit['1,1,1:4']).toBe('G')
  })

  it('refuses an impossible pair and restarts the piece', () => {
    let edit = emptyEdit(3)
    edit = paint(edit, '1,1,1', 2, 'W')
    // White and yellow are opposite colors: no corner carries both.
    edit = paint(edit, '1,1,1', 0, 'Y')
    // The white got replaced; only the latest (yellow) sticker remains.
    expect(edit['1,1,1:2']).toBeUndefined()
    expect(edit['1,1,1:0']).toBe('Y')
    expect(filledCount(edit)).toBe(7)
  })

  it('never lets a color exceed nine', () => {
    const cube = applyMoves(solvedCube(), scramble(15, seededRng(9)))
    const counts = colorCounts(cubeToEdit(cube))
    expect(Object.values(counts).every((n) => n === 9)).toBe(true)
  })

  it('clears a slot back to empty', () => {
    let edit = emptyEdit(3)
    edit = paint(edit, '1,1,1', 2, 'W')
    edit = paint(edit, '1,1,1', 0, 'R')
    edit = clearSlot(edit, '1,1,1')
    expect(filledCount(edit)).toBe(6)
  })
})

describe('2x2 cube editor', () => {
  it('exposes the eight corner slots and starts fully blank', () => {
    expect(slotsFor(2)).toHaveLength(8)
    expect(slotsFor(2).every((s) => s.kind === 'corner')).toBe(true)
    const edit = emptyEdit(2)
    expect(filledCount(edit)).toBe(0)
    expect(isComplete(edit, 2)).toBe(false)
  })

  it('round-trips a 2x2 through edit and back', () => {
    const cube = applyMoves(solvedCube(2), scramble(11, seededRng(5)))
    const edit = cubeToEdit(cube)
    expect(isComplete(edit, 2)).toBe(true)
    expect(filledCount(edit)).toBe(24)
    expect(cubeToEdit(buildCube(edit, 2))).toEqual(edit)
  })

  it('auto-completes a corner once two stickers determine it', () => {
    let edit = emptyEdit(2)
    edit = paint(edit, '1,1,1', 2, 'W')
    edit = paint(edit, '1,1,1', 0, 'R')
    expect(edit['1,1,1:4']).toBe('G')
    expect(filledCount(edit)).toBe(3)
  })

  it('refuses a piece already used elsewhere', () => {
    // Enter the white-red-green corner at (1,1,1)...
    let edit = emptyEdit(2)
    edit = paint(edit, '1,1,1', 2, 'W')
    edit = paint(edit, '1,1,1', 0, 'R')
    // ...then try to start the same piece at another slot: W then R there
    // must not complete to the same color set.
    edit = paint(edit, '-1,1,1', 2, 'W')
    const before = edit
    edit = paint(edit, '-1,1,1', 1, 'R')
    expect(edit === before || edit['-1,1,1:4'] !== 'G').toBe(true)
  })
})
