import { describe, expect, it } from 'vitest'
import { solvedCube, stateKey } from '@/lib/core/cube'
import { scrambleTurns } from '@/lib/core/moves'
import { applyMoves } from '@/lib/core/turn'
import {
  entersJoints,
  fixedJoints,
  handlesOf,
  piecesLeft,
  splitAt,
  splits,
  jointOf,
  jointsFit,
  jointsOf,
  jointsToClick,
  matchesJoints,
  withJoints,
} from '@/lib/editor/modes/joints'
import { withoutMarks } from '@/lib/puzzles/bandaged/bonds'
import { seededRng } from '../../../helpers'

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

  it('offers a 2x1 from two cubes alone, then a 2x2 along its whole length', () => {
    // On the Quad, its squares (corner, two edges, center) are its blocks:
    // one on G, its top front corner and its top edge.
    const corner = [-1, 1, 1] as const
    const edge = [-1, 1, 0] as const
    const first = handlesOf('quad', []).find(
      (h) => h.add.length === 1 && h.add[0] === jointOf(corner, edge),
    )
    expect(first).toBeDefined()
    const bar = [...first!.add]
    // Along the 2x1, on G: the two pieces below it, fused at once.
    const square = handlesOf('quad', bar).find((h) => h.sides[0].length === 2)
    expect(square?.add).toHaveLength(3)
    const quad = [...bar, ...square!.add]
    // A 2x2 is as big as a block gets: nothing more around it.
    expect(
      handlesOf('quad', quad).some((h) =>
        h.sides.flat().some((p) => quad.some((j) => j.includes(p.join()))),
      ),
    ).toBe(false)
  })

  it('takes a 2x1 apart, a 2x2 into two 2x1s across the axis clicked', () => {
    const square = [
      jointOf([-1, 1, 1], [0, 1, 1]),
      jointOf([-1, 1, 0], [0, 1, 0]),
      jointOf([-1, 1, 1], [-1, 1, 0]),
      jointOf([0, 1, 1], [0, 1, 0]),
    ]
    // Cut across x: the two cells at x = -1 apart from those at x = 0.
    expect(splitAt('quad', square, [-1, 1, 1], 0).sort()).toEqual(
      [jointOf([-1, 1, 1], [-1, 1, 0]), jointOf([0, 1, 1], [0, 1, 0])].sort(),
    )
    expect(splitAt('quad', square.slice(0, 1), [0, 1, 1], 2)).toEqual([])
    // The Alcatraz's 2x2x2 never moves: it is not taken apart.
    expect(splits('alcatraz', fixedJoints('alcatraz'), [-1, -1, -1])).toBe(false)
  })

  it('counts the 2x1s and 2x2s left to fuse', () => {
    // The Alcatraz: three bars and two tabs, a square on top.
    expect(piecesLeft('alcatraz', fixedJoints('alcatraz'))).toEqual({
      pairs: { total: 5, left: 5 },
      squares: { total: 1, left: 1 },
    })
    expect(piecesLeft('stripe', jointsOf(solvedCube('stripe'))).pairs.left).toBe(0)
  })

  it('offers no 2x2 on a puzzle that has none, nor where no form has one', () => {
    // The Stripe's blocks are bars: a 2x1 never grows.
    const stripe = jointsOf(solvedCube('stripe'))
    expect(handlesOf('stripe', stripe).every((h) => h.sides[0].length === 1)).toBe(true)
    // The Alcatraz's tabs (a center and its edge) never grow either.
    const alcatraz = jointsOf(solvedCube('alcatraz'))
    expect(handlesOf('alcatraz', alcatraz).every((h) => h.sides[0].length === 1)).toBe(true)
  })
})
