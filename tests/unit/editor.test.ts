import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/cube'
import { applyMoves } from '@/lib/turn'
import {
  buildCube,
  canPaint,
  colorCounts,
  cubeToEdit,
  emptyEdit,
  filledCount,
  isComplete,
  paint,
  slotsFor,
} from '@/lib/editor'
import { parseMoves, scramble } from '@/lib/moves'
import type { Cube } from '@/lib/types'
import { seededRng } from '../helpers'

describe('cube editor', () => {
  it('starts blank with only the six centers', () => {
    const edit = emptyEdit('3')
    expect(filledCount(edit)).toBe(6)
    expect(isComplete(edit, '3')).toBe(false)
    const counts = colorCounts(edit)
    expect(Object.values(counts).every((n) => n === 1)).toBe(true)
  })

  it('round-trips a cube through edit and back', () => {
    const cube = applyMoves(solvedCube(), scramble('3', 20, seededRng(3)))
    const edit = cubeToEdit(cube)
    expect(isComplete(edit, '3')).toBe(true)
    expect(cubeToEdit(buildCube(edit, '3'))).toEqual(edit)
  })

  it('auto-completes a corner once two stickers determine it', () => {
    let edit = emptyEdit('3')
    // Corner (1,1,1): +y (ni 2) is white, +x (ni 0) is red in the solved cube.
    edit = paint(edit, '3', '1,1,1', 2, 'W')
    expect(filledCount(edit)).toBe(7)
    edit = paint(edit, '3', '1,1,1', 0, 'R')
    // The third sticker (+z, ni 4) is forced to green.
    expect(filledCount(edit)).toBe(9)
    expect(edit['1,1,1:4']).toBe('G')
  })

  it('refuses an impossible pair and restarts the piece', () => {
    let edit = emptyEdit('3')
    edit = paint(edit, '3', '1,1,1', 2, 'W')
    // White and yellow are opposite colors: no corner carries both.
    edit = paint(edit, '3', '1,1,1', 0, 'Y')
    // The white got replaced; only the latest (yellow) sticker remains.
    expect(edit['1,1,1:2']).toBeUndefined()
    expect(edit['1,1,1:0']).toBe('Y')
    expect(filledCount(edit)).toBe(7)
  })

  it('never lets a color exceed nine', () => {
    const cube = applyMoves(solvedCube(), scramble('3', 15, seededRng(9)))
    const counts = colorCounts(cubeToEdit(cube))
    expect(Object.values(counts).every((n) => n === 9)).toBe(true)
  })
})

describe('2x2 cube editor', () => {
  it('exposes the eight corner slots and starts fully blank', () => {
    expect(slotsFor('2')).toHaveLength(8)
    expect(slotsFor('2').every((s) => s.kind === 'corner')).toBe(true)
    const edit = emptyEdit('2')
    expect(filledCount(edit)).toBe(0)
    expect(isComplete(edit, '2')).toBe(false)
  })

  it('round-trips a 2x2 through edit and back', () => {
    const cube = applyMoves(solvedCube('2'), scramble('2', 11, seededRng(5)))
    const edit = cubeToEdit(cube)
    expect(isComplete(edit, '2')).toBe(true)
    expect(filledCount(edit)).toBe(24)
    expect(cubeToEdit(buildCube(edit, '2'))).toEqual(edit)
  })

  it('auto-completes a corner once two stickers determine it', () => {
    let edit = emptyEdit('2')
    edit = paint(edit, '2', '1,1,1', 2, 'W')
    edit = paint(edit, '2', '1,1,1', 0, 'R')
    expect(edit['1,1,1:4']).toBe('G')
    expect(filledCount(edit)).toBe(3)
  })

  it('never completes to a piece already used elsewhere', () => {
    // Enter the white-red-green corner at (1,1,1)...
    let edit = emptyEdit('2')
    edit = paint(edit, '2', '1,1,1', 2, 'W')
    edit = paint(edit, '2', '1,1,1', 0, 'R')
    // ...then paint W and R on another corner slot: with white-red-green
    // taken, the only white-red piece left is white-red-blue.
    edit = paint(edit, '2', '-1,1,1', 2, 'W')
    edit = paint(edit, '2', '-1,1,1', 1, 'R')
    expect(edit['-1,1,1:2']).toBe('W')
    expect(edit['-1,1,1:1']).toBe('R')
    expect(edit['-1,1,1:4']).toBe('B')
  })
})

describe('4x4 cube editor', () => {
  it('exposes 64 slots, movable centers included, and starts fully blank', () => {
    const slots = slotsFor('4')
    expect(slots).toHaveLength(64)
    expect(slots.filter((s) => s.kind === 'corner')).toHaveLength(8)
    expect(slots.filter((s) => s.kind === 'edge')).toHaveLength(24)
    expect(slots.filter((s) => s.kind === 'center')).toHaveLength(24)
    expect(slots.filter((s) => s.kind === 'core')).toHaveLength(8)
    // Centers move on a 4x4, so they are paintable and not pre-filled.
    expect(canPaint('4', '1,3,1')).toBe(true)
    expect(canPaint('3', '0,1,0')).toBe(false)
    expect(filledCount(emptyEdit('4'))).toBe(0)
  })

  it('round-trips a sliced scramble through edit and back', () => {
    const cube = applyMoves(solvedCube('4'), scramble('4', 30, seededRng(13)))
    const edit = cubeToEdit(cube)
    expect(isComplete(edit, '4')).toBe(true)
    expect(filledCount(edit)).toBe(96)
    expect(cubeToEdit(buildCube(edit, '4'))).toEqual(edit)
  })

  it('lets the user paint any legal position sticker by sticker', () => {
    // Repainting the true colors of a scrambled cube must never be refused,
    // and auto-completion, when it fires, must agree with the truth.
    const cube = applyMoves(solvedCube('4'), scramble('4', 25, seededRng(21)))
    const target = cubeToEdit(cube)
    let edit = emptyEdit('4')
    for (const slot of slotsFor('4')) {
      if (!canPaint('4', slot.key)) continue
      for (const s of slot.stickers) {
        edit = paint(edit, '4', slot.key, s.ni, target[s.id]!)
      }
    }
    expect(edit).toEqual(target)
  })

  it('accepts both wings of a color pair, then refuses a third', () => {
    let edit = emptyEdit('4')
    // The two white-green wings, in their two chiral dispositions (same
    // visible colors on the two UF cells).
    edit = paint(edit, '4', '1,3,3', 2, 'W')
    edit = paint(edit, '4', '1,3,3', 4, 'G')
    edit = paint(edit, '4', '-1,3,3', 2, 'W')
    edit = paint(edit, '4', '-1,3,3', 4, 'G')
    expect(edit['1,3,3:4']).toBe('G')
    expect(edit['-1,3,3:4']).toBe('G')
    // A third white-green wing does not exist: the G paint restarts the piece.
    edit = paint(edit, '4', '3,1,3', 0, 'W')
    edit = paint(edit, '4', '3,1,3', 4, 'G')
    expect(edit['3,1,3:0']).toBeUndefined()
    expect(edit['3,1,3:4']).toBe('G')
  })

  it('tracks center budgets: four per color, the fifth is refused', () => {
    let edit = emptyEdit('4')
    for (const key of ['1,3,1', '1,3,-1', '-1,3,1', '-1,3,-1']) {
      edit = paint(edit, '4', key, 2, 'W')
      expect(edit[`${key}:2`]).toBe('W')
    }
    const before = edit
    edit = paint(edit, '4', '3,1,1', 0, 'W')
    expect(edit).toBe(before)
  })

  it('keeps fixed 3x3 centers unpaintable', () => {
    const edit = emptyEdit('3')
    expect(paint(edit, '3', '0,1,0', 2, 'R')).toBe(edit)
  })

  it('auto-completes a corner once two stickers determine it', () => {
    let edit = emptyEdit('4')
    edit = paint(edit, '4', '3,3,3', 2, 'W')
    edit = paint(edit, '4', '3,3,3', 0, 'R')
    expect(edit['3,3,3:4']).toBe('G')
    expect(filledCount(edit)).toBe(3)
  })
})

describe('editor on the cuboids', () => {
  it('round-trips a scrambled tower and Domino through the editor', () => {
    const states = {
      // A tower scramble may leave it out of its box; these turns keep it in.
      '224': applyMoves(solvedCube('224'), parseMoves('Rw2 U Dw Fw2 D2 Uw')),
      '332': applyMoves(solvedCube('332'), scramble('332', 20, seededRng(8))),
    }
    for (const [shape, cube] of Object.entries(states) as ['224' | '332', Cube][]) {
      const edit = cubeToEdit(cube)
      expect(isComplete(edit, shape)).toBe(true)
      expect(cubeToEdit(buildCube(edit, shape))).toEqual(edit)
    }
  })

  it('does not take a shifted tower as a complete entry', () => {
    // Out of its box, some stickers sit where no editor slot is.
    const shifted = applyMoves(solvedCube('224'), parseMoves('Rw'))
    expect(isComplete(cubeToEdit(shifted), '224')).toBe(false)
  })
})
