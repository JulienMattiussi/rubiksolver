import { describe, expect, it } from 'vitest'
import { applyMoves, isSolved, solvedCube, stateKey } from '@/lib/cube'
import { scramble } from '@/lib/moves'
import { methodsFor, solve } from '@/lib/solver'
import { centersDone, solveCenters } from '@/lib/solver4/centers'
import { edgesPaired, pairedCount, pairEdges } from '@/lib/solver4/edges'
import { cornerTwistSum, edgeFlipParity, fixParities, permSignsMatch } from '@/lib/solver4/parity'
import { isReduced, to3x3 } from '@/lib/solver4/project'
import { seededRng, twistedCorner } from '../helpers'
import type { Cube, Vec3 } from '@/lib/types'

/** Swap the two colors of the wing at `p` (in place flip of one wing). */
function flipWingAt(cube: Cube, p: Vec3): Cube {
  return cube.map((c) => {
    if (c.position[0] !== p[0] || c.position[1] !== p[1] || c.position[2] !== p[2]) return c
    const [a, b] = c.stickers
    return {
      ...c,
      stickers: [
        { ...a!, color: b!.color },
        { ...b!, color: a!.color },
      ],
    }
  })
}

/** Solved 4x4 with the UF composite edge flipped in place (legal: OLL parity). */
function ollParityCube(): Cube {
  let cube = solvedCube(4)
  cube = flipWingAt(cube, [-1, 3, 3])
  cube = flipWingAt(cube, [1, 3, 3])
  return cube
}

/** Solved 4x4 with the UF and UB composite edges swapped (legal: PLL parity). */
function pllParityCube(): Cube {
  return solvedCube(4).map((c) => {
    const [x, y, z] = c.position
    if (c.stickers.length !== 2 || y !== 3 || Math.abs(z) !== 3) return c
    // The dedge travels to the mirrored slot; W stays on U, F/B swap.
    return {
      position: [-x, y, -z] as Vec3,
      stickers: c.stickers.map((s) => ({
        normal: [-s.normal[0], s.normal[1], -s.normal[2]] as Vec3,
        color: s.color,
      })),
    }
  })
}

describe('4x4 reduction phases', () => {
  it('solves centers, pairs edges, keeps both through the cascade', () => {
    const rng = seededRng(2024)
    for (let i = 0; i < 3; i++) {
      let state = applyMoves(solvedCube(4), scramble(4, 40, rng))
      state = applyMoves(state, solveCenters(state))
      expect(centersDone(state)).toBe(true)
      state = applyMoves(state, pairEdges(state))
      expect(edgesPaired(state)).toBe(true)
      expect(centersDone(state)).toBe(true)
      state = applyMoves(state, fixParities(state))
      const v = to3x3(state)
      expect(edgeFlipParity(v)).toBe(0)
      expect(permSignsMatch(v)).toBe(true)
      expect(cornerTwistSum(v)).toBe(0)
    }
  }, 120000)

  it('projection commutes with outer moves (homomorphism)', () => {
    // stateKey lists cubies in array order, which differs between a real 3x3
    // (piece identity) and the projection (canonical positions): compare the
    // states themselves by sorting the per-cubie segments.
    const canonical = (c: Cube) => stateKey(c).split('|').sort().join('|')
    const rng = seededRng(51)
    let four = solvedCube(4)
    let three = solvedCube(3)
    // Outer moves keep a reduced cube reduced, so both sides stay in sync.
    for (const move of scramble(3, 30, rng)) {
      four = applyMoves(four, [move])
      three = applyMoves(three, [move])
      expect(canonical(to3x3(four))).toBe(canonical(three))
    }
    expect(isReduced(four)).toBe(true)
  })

  it('outer scrambles never show a parity on the projection', () => {
    const rng = seededRng(77)
    for (let i = 0; i < 5; i++) {
      const state = applyMoves(solvedCube(4), scramble(3, 25, rng))
      const v = to3x3(state)
      expect(edgeFlipParity(v)).toBe(0)
      expect(permSignsMatch(v)).toBe(true)
      expect(cornerTwistSum(v)).toBe(0)
    }
  })
})

describe('4x4 parities', () => {
  it('detects and fixes OLL parity (one flipped composite edge)', () => {
    const cube = ollParityCube()
    expect(isReduced(cube)).toBe(true)
    expect(edgeFlipParity(to3x3(cube))).toBe(1)
    const moves = fixParities(cube)
    expect(moves.length).toBeGreaterThan(0)
    // The algorithm flips the UF dedge in place: here it solves the cube.
    expect(isSolved(applyMoves(cube, moves))).toBe(true)
  })

  it('detects and fixes PLL parity (two swapped composite edges)', () => {
    const cube = pllParityCube()
    expect(isReduced(cube)).toBe(true)
    expect(edgeFlipParity(to3x3(cube))).toBe(0)
    expect(permSignsMatch(to3x3(cube))).toBe(false)
    const moves = fixParities(cube)
    expect(moves.length).toBeGreaterThan(0)
    expect(isSolved(applyMoves(cube, moves))).toBe(true)
  })

  it('methods emit a parity step and solve parity states', () => {
    const rng = seededRng(31)
    for (const base of [ollParityCube(), pllParityCube()]) {
      const cube = applyMoves(base, scramble(3, 15, rng))
      const method = methodsFor(4).find((m) => m.id === 'reduction')!
      const steps = method.solve(cube)
      expect(steps.some((s) => s.key === 'stepParity' && s.moves.length > 0)).toBe(true)
      expect(
        isSolved(
          applyMoves(
            cube,
            steps.flatMap((s) => [...s.moves]),
          ),
        ),
      ).toBe(true)
    }
  }, 120000)

  it('throws on a twisted corner (unsolvable cube)', () => {
    expect(() => fixParities(twistedCorner(4))).toThrow()
    expect(() => solve(twistedCorner(4))).toThrow()
  })
})

describe('4x4 solver', () => {
  it('returns no moves for a solved 4x4', () => {
    expect(solve(solvedCube(4))).toEqual([])
  })

  it('pairs the last crossed slot (flip case) when it shows up', () => {
    // A flipped dedge among otherwise paired edges is exactly the crossed
    // case the L2E fallback handles; the full pairEdges must cope with it.
    const state = ollParityCube()
    expect(pairedCount(state)).toBe(12)
    // Splitting the UF pair via a slice then restoring pairs exercises joins.
    const rng = seededRng(63)
    const scrambled = applyMoves(state, scramble(4, 20, rng))
    let cube = scrambled
    cube = applyMoves(cube, solveCenters(cube))
    cube = applyMoves(cube, pairEdges(cube))
    expect(edgesPaired(cube)).toBe(true)
    expect(centersDone(cube)).toBe(true)
  }, 120000)
})
