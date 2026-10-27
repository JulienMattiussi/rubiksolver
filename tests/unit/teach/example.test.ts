import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import type { CubeShape } from '@/lib/core/shapes'
import { applyMoves } from '@/lib/core/turn'
import { formulaExample } from '@/lib/teach/example'
import { arrowsOf } from '@/lib/teach/scene'
import { tutorialFor } from '@/lib/tutorials/registry'

describe('formulaExample', () => {
  it.each([
    ['3', 'beginner'],
    ['pyra', 'centersFirst'],
  ] as [CubeShape, string][])(
    'shows each formula of the %s reminder on a puzzle it solves',
    (shape, method) => {
      const tutorial = tutorialFor(shape, method)!
      const solved = solvedCube(shape)
      const formulas = tutorial.recap.flatMap((stage) => stage.formulas.map((f) => ({ stage, f })))
      expect(formulas.length).toBeGreaterThan(0)
      for (const { stage, f } of formulas) {
        const { cube, moves, step } = formulaExample(tutorial, solved, stage, f)
        expect(isSolved(cube)).toBe(false)
        expect(isSolved(applyMoves(cube, moves))).toBe(true)
        // An arrow for each piece it puts back, and none for the others.
        const subjects = step.subjects ?? []
        expect(subjects.length).toBeGreaterThan(0)
        const arrows = arrowsOf(cube, moves, step, null).map((a) => a.piece)
        expect(arrows.every((piece) => subjects.includes(piece))).toBe(true)
        expect(arrows.length).toBeGreaterThan(0)
      }
    },
  )
})
