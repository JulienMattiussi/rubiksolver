import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { movesFor, scramble } from '@/lib/core/moves'
import { formatMoves, parseMoves } from '@/lib/core/notation'
import { applyMoves } from '@/lib/core/turn'
import { canUnlock, needsUnlock, outOfShape } from '@/lib/app/unlock'
import { moveGuide } from '@/lib/app/moveGuide'

const FLOPPY = solvedCube('331')

describe('unlocked mode (the Floppy)', () => {
  it('is the Floppy’s alone', () => {
    expect(canUnlock('331')).toBe(true)
    expect(canUnlock('3')).toBe(false)
    expect(needsUnlock(solvedCube('3'))).toBe(false)
  })

  it('adds its sides’ quarter turns, never its top nor bottom', () => {
    expect(formatMoves(movesFor('331'))).toBe('L2 R2 F2 B2')
    expect(formatMoves(movesFor('331', true))).toBe("L L2 L' R R2 R' F F2 F' B B2 B'")
  })

  it('shows them in the move guide', () => {
    const rows = moveGuide('331', true).flatMap((g) => g.rows)
    expect(rows.flat()).toHaveLength(12)
    expect(
      moveGuide('331')
        .flatMap((g) => g.rows)
        .flat(),
    ).toHaveLength(4)
  })

  it('stands a row up with a quarter turn, then turns the side it left', () => {
    const up = applyMoves(FLOPPY, parseMoves('R'))
    expect(outOfShape(up)).toBe(true)
    expect(needsUnlock(up)).toBe(true)
    // The front side then holds a corner and its edge, turned a quarter too.
    const on = applyMoves(up, parseMoves('F'))
    expect(applyMoves(on, parseMoves("F' R'"))).toEqual(FLOPPY)
  })

  it('flips an edge alone, both rows beside it stood up: flat, but needing the mode', () => {
    const flipped = applyMoves(FLOPPY, parseMoves("R L F2 L' R'"))
    expect(outOfShape(flipped)).toBe(false)
    expect(isSolved(flipped)).toBe(false)
    expect(needsUnlock(flipped)).toBe(true)
  })

  it('needs no mode for a state its half turns reach', () => {
    expect(needsUnlock(applyMoves(FLOPPY, parseMoves('R2 F2 L2')))).toBe(false)
  })

  it('scrambles with quarter turns once unlocked, out of shape', () => {
    let seed = 1
    const rng = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
    const moves = scramble('331', 12, rng, FLOPPY, true)
    expect(moves.some((m) => m.amount !== 2)).toBe(true)
    expect(scramble('331', 12, rng, FLOPPY).every((m) => m.amount === 2)).toBe(true)
  })
})
