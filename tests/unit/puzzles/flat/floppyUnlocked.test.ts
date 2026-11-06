import { describe, expect, it } from 'vitest'
import { cubeOrientations, isSolved, solvedCube, stateKey } from '@/lib/core/cube'
import { scramble } from '@/lib/core/moves'
import { parseMoves } from '@/lib/core/notation'
import { applyMoves } from '@/lib/core/turn'
import { FLIP_ONE } from '@/lib/methods/flat/floppyUnlocked'
import { methodsFor } from '@/lib/solve/solver'

const SOLVED = solvedCube('331')

/** A seeded generator, for scrambles the same on every run. */
function seeded(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
}

describe('Floppy unlocked: flat first', () => {
  const methods = methodsFor('331', true)

  it('is the unlocked mode’s only method, and none of the locked ones', () => {
    expect(methods.map((m) => m.id)).toEqual(['floppyFlatFirst'])
    expect(methodsFor('331').map((m) => m.id)).not.toContain('floppyFlatFirst')
  })

  it("flips the front edge alone with R L F2 L' R'", () => {
    const after = applyMoves(SOLVED, parseMoves(FLIP_ONE))
    const changed = after.flatMap((c, i) =>
      stateKey([c]) === stateKey([SOLVED[i]!]) ? [] : [c.position.join()],
    )
    expect(changed).toEqual(['0,0,1'])
  })

  it('solves scrambles out of shape: flat, corners, then an edge at a time', () => {
    const rng = seeded(7)
    for (let n = 0; n < 30; n++) {
      const cube = applyMoves(SOLVED, scramble('331', 12, rng, SOLVED, true))
      const steps = methods[0]!.solve(cube)
      expect(
        isSolved(
          applyMoves(
            cube,
            steps.flatMap((s) => [...s.moves]),
          ),
        ),
      ).toBe(true)
      const flips = steps.find((s) => s.key === 'stepFloppyFlipEdges')
      // Five turns a flipped edge, four edges at most.
      expect(flips?.moves.length ?? 0).toBeLessThanOrEqual(20)
    }
  })

  it('solves it held another way', () => {
    const cube = applyMoves(SOLVED, scramble('331', 12, seeded(3), SOLVED, true))
    for (const held of cubeOrientations(cube).slice(0, 4)) {
      const steps = methods[0]!.solve(held)
      expect(
        isSolved(
          applyMoves(
            held,
            steps.flatMap((s) => [...s.moves]),
          ),
        ),
      ).toBe(true)
    }
  })
})
