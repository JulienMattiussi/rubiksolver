import { describe, expect, it } from 'vitest'
import { faceInHold, heldFace, heldMove, moveInHold } from '@/lib/core/hold'
import { formatMoves, parseMoves } from '@/lib/core/moves'

describe('the way the puzzle is held', () => {
  it('names each side where it stands, the top and bottom kept', () => {
    // The right side held in front: the back is on the right, the front on the left.
    expect(heldFace('R', 'F')).toBe('R')
    expect(heldFace('R', 'R')).toBe('B')
    expect(heldFace('R', 'L')).toBe('F')
    expect(heldFace('R', 'U')).toBe('U')
    expect(faceInHold('R', 'B')).toBe('R')
    for (const hold of ['F', 'R', 'B', 'L'] as const) {
      for (const face of ['U', 'D', 'F', 'R', 'B', 'L'] as const) {
        expect(faceInHold(hold, heldFace(hold, face))).toBe(face)
      }
    }
  })

  it('reads a formula in a hold, and plays it back', () => {
    const trigger = parseMoves("R U R' U'")
    const played = trigger.map((m) => heldMove('B', m))
    expect(formatMoves(played)).toBe("L U L' U'")
    expect(played.map((m) => moveInHold('B', m))).toEqual(trigger)
  })
})
