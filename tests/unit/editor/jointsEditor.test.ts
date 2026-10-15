import { describe, expect, it } from 'vitest'
import { solvedCube, stateKey } from '@/lib/core/cube'
import { scrambleTurns } from '@/lib/core/moves'
import { applyMoves } from '@/lib/core/turn'
import {
  entersJoints,
  fixedJoints,
  jointOf,
  jointsFit,
  jointsOf,
  jointsToClick,
  matchesJoints,
  withJoints,
} from '@/lib/editor/jointsEditor'
import { withoutMarks } from '@/lib/puzzles/bandaged/bonds'
import { seededRng } from '../../helpers'

describe('entering a bandaged puzzle by its joints', () => {
  it('is for the bandaged 3x3x3s whose blocks move', () => {
    expect(entersJoints('stripe')).toBe(true)
    expect(entersJoints('alcatraz')).toBe(true)
    expect(entersJoints('fused')).toBe(false)
    expect(entersJoints('3')).toBe(false)
  })

  it('reads a state’s joints, and fuses a state as they say', () => {
    const solved = solvedCube('stripe')
    expect(jointsOf(solved)).toEqual(
      [
        jointOf([-1, -1, 1], [0, -1, 1]),
        jointOf([1, -1, 0], [1, -1, -1]),
        jointOf([1, 0, 1], [1, 1, 1]),
      ].sort(),
    )
    expect(stateKey(withJoints(withoutMarks(solved), jointsOf(solved)))).toBe(stateKey(solved))
  })

  it('starts from the joints every form has: the Alcatraz’s 2x2x2', () => {
    // The 2x2x2's 12 joints, its core's among them, are never clicked.
    expect(fixedJoints('alcatraz')).toHaveLength(12)
    expect(fixedJoints('stripe')).toEqual([])
    expect(jointsToClick('stripe').length).toBeGreaterThan(3)
  })

  it('takes the joints of a form the puzzle takes, not others', () => {
    const solved = solvedCube('stripe')
    const mixed = applyMoves(solved, scrambleTurns('stripe', 25, seededRng(2), solved))
    expect(jointsFit('stripe', jointsOf(mixed))).toBe(true)
    expect(jointsFit('stripe', [])).toBe(false)
    expect(jointsFit('stripe', jointsOf(solved).slice(1))).toBe(false)
  })

  it('checks a built state against the joints entered', () => {
    const solved = solvedCube('stripe')
    const mixed = applyMoves(solved, scrambleTurns('stripe', 25, seededRng(4), solved))
    expect(matchesJoints(mixed, jointsOf(mixed))).toBe(true)
    expect(matchesJoints(mixed, jointsOf(solved))).toBe(
      jointsOf(mixed).join() === jointsOf(solved).join(),
    )
  })
})
