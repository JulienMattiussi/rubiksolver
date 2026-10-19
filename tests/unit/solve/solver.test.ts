import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { applyMoves } from '@/lib/core/turn'
import { scramble } from '@/lib/core/moves'
import { formatMoves, parseMoves } from '@/lib/core/notation'
import {
  crossDone,
  firstLayerDone,
  secondLayerDone,
  solveCross,
  solveFirstLayerCorners,
  solveMiddleLayer,
  solvePermuteCorners,
  solvePermuteEdges,
  solveTopCross,
  solveTopFace,
  topCornersDone,
  topCrossDone,
  topFaceDone,
} from '@/lib/methods/standard/layers3'
import { solveOptimal2 } from '@/lib/methods/standard/cube2'
import { methodsFor, solve } from '@/lib/solve/solver'
import { seededRng, twistedCorner2 } from '../../helpers'

describe('solver', () => {
  it('returns no moves for an already-solved cube', () => {
    expect(solve(solvedCube())).toEqual([])
  })

  it('undoes a single move', () => {
    const cube = applyMoves(solvedCube(), parseMoves('R'))
    expect(isSolved(applyMoves(cube, solve(cube)))).toBe(true)
  })

  it('solves many random scrambles', () => {
    const rng = seededRng(12345)
    const failures: string[] = []
    for (let i = 0; i < 40; i++) {
      const moves = scramble('3', 25, rng)
      const scrambled = applyMoves(solvedCube(), moves)
      if (!isSolved(applyMoves(scrambled, solve(scrambled)))) failures.push(formatMoves(moves))
    }
    expect(failures).toEqual([])
  }, 120000)

  it('reaches each phase goal in order', () => {
    const rng = seededRng(2026)
    for (let i = 0; i < 6; i++) {
      let state = applyMoves(solvedCube(), scramble('3', 25, rng))
      const step = (
        fn: (c: typeof state) => ReturnType<typeof solveCross>,
        ok: (c: typeof state) => boolean,
      ) => {
        state = applyMoves(state, fn(state))
        expect(ok(state)).toBe(true)
      }
      step(solveCross, crossDone)
      step(solveFirstLayerCorners, firstLayerDone)
      step(solveMiddleLayer, secondLayerDone)
      step(solveTopCross, topCrossDone)
      step(solveTopFace, topFaceDone)
      step(solvePermuteCorners, topCornersDone)
      step(solvePermuteEdges, isSolved)
    }
  }, 120000)
})

describe('2x2 solver', () => {
  it('returns no moves for a solved 2x2', () => {
    expect(solve(solvedCube('2'))).toEqual([])
    expect(solveOptimal2(solvedCube('2'))).toEqual([])
  })

  it('optimal solver solves random scrambles in at most 11 moves', () => {
    const rng = seededRng(99)
    for (let i = 0; i < 15; i++) {
      const scrambled = applyMoves(solvedCube('2'), scramble('2', 11, rng))
      const moves = solveOptimal2(scrambled)
      expect(moves.length).toBeLessThanOrEqual(11)
      expect(isSolved(applyMoves(scrambled, moves))).toBe(true)
    }
  }, 120000)

  it('optimal solver finds the inverse of a short scramble', () => {
    const scrambled = applyMoves(solvedCube('2'), parseMoves("R U' F2"))
    expect(solveOptimal2(scrambled)).toHaveLength(3)
  })

  it('throws on an unsolvable 2x2 (one twisted corner)', () => {
    expect(() => solveOptimal2(twistedCorner2())).toThrow()
  })
})

describe('3x3 methods with the centers moved (M, E, S on the advanced tab)', () => {
  it('put the centers back first, then solve', () => {
    const rng = seededRng(77)
    for (const text of ['M', 'E S', "M U Rw' E2 S'"]) {
      const start = applyMoves(
        applyMoves(solvedCube('3'), scramble('3', 20, rng)),
        parseMoves(text),
      )
      for (const method of methodsFor('3')) {
        const steps = method.solve(start)
        expect(steps[0]!.key).toBe('stepHoldCube')
        expect(steps[0]!.moves.every((m) => 'whole' in m && m.whole)).toBe(true)
        let state = start
        for (const step of steps) state = applyMoves(state, step.moves)
        expect(isSolved(state)).toBe(true)
      }
    }
  }, 120000)
})
