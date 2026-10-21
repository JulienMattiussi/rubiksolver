import { describe, expect, it } from 'vitest'
import { FACE_NORMAL } from '@/lib/core/geometry'
import { CUBE_HOLDS, holdFrontRight, ringHolds } from '@/lib/core/hold'
import { formatMoves, parseMoves } from '@/lib/core/notation'

describe('the ways a cube is held', () => {
  it('finds its sides round the top from its faces', () => {
    expect(CUBE_HOLDS.holds).toEqual(['F', 'R', 'B', 'L'])
    expect(CUBE_HOLDS.front('R')).toEqual([1, 0, 0])
  })

  it('finds the sides round any axis of a model from its faces alone', () => {
    // Held with the right side up: the sides round it, the top first.
    expect(ringHolds(FACE_NORMAL, 'R', 'U').holds).toEqual(['U', 'F', 'D', 'B'])
    // Held down: the side across from the top, whatever the hold.
    expect(CUBE_HOLDS.down).toEqual(FACE_NORMAL.D)
    expect(ringHolds(FACE_NORMAL, 'R', 'U').down).toEqual(FACE_NORMAL.L)
  })

  it('names each side where it stands, the top and bottom kept', () => {
    // The right side held in front: the back is on the right, the front on the left.
    expect(CUBE_HOLDS.faceAt('R', 'F')).toBe('R')
    expect(CUBE_HOLDS.faceAt('R', 'R')).toBe('B')
    expect(CUBE_HOLDS.faceAt('R', 'L')).toBe('F')
    expect(CUBE_HOLDS.faceAt('R', 'U')).toBe('U')
  })

  it('reads a formula in a hold, and plays it back', () => {
    const trigger = parseMoves("R U R' U'")
    const played = trigger.map((m) => CUBE_HOLDS.played('B', m))
    expect(formatMoves(played)).toBe("L U L' U'")
    expect(played.map((m) => CUBE_HOLDS.inHold('B', m))).toEqual(trigger)
  })

  it('holds a corner in front on the right', () => {
    expect(holdFrontRight(CUBE_HOLDS, [1, 1, 1])).toBe('F')
    expect(holdFrontRight(CUBE_HOLDS, [1, -1, -1])).toBe('R')
    expect(holdFrontRight(CUBE_HOLDS, [-1, 1, -1])).toBe('B')
    expect(holdFrontRight(CUBE_HOLDS, [-1, -1, 1])).toBe('L')
  })
})
