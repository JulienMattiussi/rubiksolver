import { describe, expect, it } from 'vitest'
import { solvedCube, stateKey, turnDims } from '@/lib/core/cube'
import { AXIS_ROTATIONS } from '@/lib/core/geometry'
import { formatMoves, NOTATION_US, parseMoves } from '@/lib/core/notation'
import { applyMoves } from '@/lib/core/turn'
import type { Cube, Turn } from '@/lib/core/types'
import { withoutRotations } from '@/lib/solve/rotations'

const TOWER = turnDims('224')

/** Whether two states are the same, but for how the puzzle is held. */
const sameHeldAnyway = (a: Cube, b: Cube) =>
  AXIS_ROTATIONS.some(
    (r) =>
      stateKey(
        b.map((c) => ({
          position: r(c.position),
          stickers: c.stickers.map((s) => ({ ...s, normal: r(s.normal) })),
        })),
      ) === stateKey(a),
  )

const text = (moves: readonly Turn[]) => formatMoves(moves, NOTATION_US)

describe('a solution without the turns in hand', () => {
  it("leaves out the tower turned whole (Uw' Dw), the turns after it as then held", () => {
    const moves = parseMoves("Rw Uw' Dw Rw Fw' Uw Dw' F R2 Dw2 Uw2 L")
    const [lean] = withoutRotations([moves], TOWER)
    expect(text(lean!)).toBe("Rw Fw Lw' F R2 R")
    const solved = solvedCube('224')
    expect(sameHeldAnyway(applyMoves(solved, moves), applyMoves(solved, lean!))).toBe(true)
  })

  it('keeps what turns the layers apart, and a whole turn written as such', () => {
    const moves = parseMoves('Uw Dw R')
    expect(withoutRotations([moves], TOWER)[0]).toEqual(moves)
    const whole: Turn[] = [{ face: 'U', amount: 1, whole: true }, ...parseMoves('R')]
    expect(withoutRotations([whole], TOWER)[0]).toEqual(whole)
  })

  it('leaves out a turn in hand across two steps, each keeping its own turns', () => {
    const [a, b] = withoutRotations([parseMoves("R Uw'"), parseMoves('Dw R')], TOWER)
    expect(text(a!)).toBe('R')
    expect(text(b!)).toBe('F')
  })
})
