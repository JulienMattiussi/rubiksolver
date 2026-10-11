import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/cube'
import { applyMoves } from '@/lib/turn'
import { formatMoves, parseMoves, scramble } from '@/lib/moves'
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
} from '@/lib/methods/layers3'
import {
  bottomLayerDone2,
  solveBottomLayer2,
  solveOptimal2,
  solvePermuteTop2,
  solveTopFace2,
  topFaceDone2,
} from '@/lib/methods/cube2'
import { methodsFor, solve } from '@/lib/solver'
import { LOCALES } from '@/i18n/translations'
import { SHAPE_DIMS, type CubeShape } from '@/lib/types'
import { seededRng, twistedCorner2 } from '../helpers'

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

  it('every method of every shape solves scrambles as translated, named steps', () => {
    const rng = seededRng(808)
    const shapes = Object.keys(SHAPE_DIMS) as CubeShape[]
    for (const shape of shapes) {
      for (const method of methodsFor(shape)) {
        for (let i = 0; i < 3; i++) {
          const cube = applyMoves(solvedCube(shape), scramble(shape, 25, rng))
          const steps = method.solve(cube)
          for (const step of steps) {
            expect(step.moves.length).toBeGreaterThan(0)
            for (const locale of Object.values(LOCALES)) {
              expect((locale.steps as Record<string, string>)[step.key]).toBeTruthy()
            }
          }
          expect(
            isSolved(
              applyMoves(
                cube,
                steps.flatMap((s) => [...s.moves]),
              ),
            ),
          ).toBe(true)
        }
      }
    }
  }, 240000)

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

  it('layer method reaches each phase goal in order', () => {
    const rng = seededRng(4242)
    for (let i = 0; i < 8; i++) {
      let state = applyMoves(solvedCube('2'), scramble('2', 11, rng))
      state = applyMoves(state, solveBottomLayer2(state))
      expect(bottomLayerDone2(state)).toBe(true)
      state = applyMoves(state, solveTopFace2(state))
      expect(topFaceDone2(state)).toBe(true)
      state = applyMoves(state, solvePermuteTop2(state))
      expect(isSolved(state)).toBe(true)
    }
  }, 120000)

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
