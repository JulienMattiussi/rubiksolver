import { describe, expect, it } from 'vitest'
import { applyMoves, isSolved, solvedCube } from '@/lib/cube'
import { formatMoves, parseMoves, scramble } from '@/lib/moves'
import {
  crossDone,
  firstLayerDone,
  secondLayerDone,
  solve,
  SOLVE_METHODS,
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
} from '@/lib/solver'
import { seededRng } from '../helpers'

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
      const moves = scramble(25, rng)
      const scrambled = applyMoves(solvedCube(), moves)
      if (!isSolved(applyMoves(scrambled, solve(scrambled)))) failures.push(formatMoves(moves))
    }
    expect(failures).toEqual([])
  }, 120000)

  it('every method solves random scrambles as named steps', () => {
    const rng = seededRng(808)
    for (const method of SOLVE_METHODS) {
      for (let i = 0; i < 5; i++) {
        const cube = applyMoves(solvedCube(), scramble(25, rng))
        const steps = method.solve(cube)
        expect(steps.every((s) => s.key && s.moves.length > 0)).toBe(true)
        const moves = steps.flatMap((s) => [...s.moves])
        expect(isSolved(applyMoves(cube, moves))).toBe(true)
      }
    }
  }, 120000)

  it('reaches each phase goal in order', () => {
    const rng = seededRng(2026)
    for (let i = 0; i < 6; i++) {
      let state = applyMoves(solvedCube(), scramble(25, rng))
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
