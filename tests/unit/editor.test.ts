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
} from '@/lib/editor'
import { scramble } from '@/lib/moves'
import { seededRng } from '../helpers'

describe('cube editor', () => {
  it('starts blank with only the six centers', () => {
    const edit = emptyEdit()
    expect(filledCount(edit)).toBe(6)
    expect(isComplete(edit)).toBe(false)
    const counts = colorCounts(edit)
    expect(Object.values(counts).every((n) => n === 1)).toBe(true)
  })

  it('round-trips a cube through edit and back', () => {
    const cube = applyMoves(solvedCube(), scramble(20, seededRng(3)))
    const edit = cubeToEdit(cube)
    expect(isComplete(edit)).toBe(true)
    expect(cubeToEdit(buildCube(edit))).toEqual(edit)
  })

  it('auto-completes a corner once two stickers determine it', () => {
    let edit = emptyEdit()
    // Corner (1,1,1): +y (ni 2) is white, +x (ni 0) is red in the solved cube.
    edit = paint(edit, '1,1,1', 2, 'W')
    expect(filledCount(edit)).toBe(7)
    edit = paint(edit, '1,1,1', 0, 'R')
    // The third sticker (+z, ni 4) is forced to green.
    expect(filledCount(edit)).toBe(9)
    expect(edit['1,1,1:4']).toBe('G')
  })

  it('refuses an impossible pair and restarts the piece', () => {
    let edit = emptyEdit()
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
    let edit = emptyEdit()
    edit = paint(edit, '1,1,1', 2, 'W')
    edit = paint(edit, '1,1,1', 0, 'R')
    edit = clearSlot(edit, '1,1,1')
    expect(filledCount(edit)).toBe(6)
  })
})
