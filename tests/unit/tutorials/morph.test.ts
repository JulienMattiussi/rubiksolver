import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { scramble } from '@/lib/core/moves'
import { parseMoves } from '@/lib/core/notation'
import { applyMoves } from '@/lib/core/turn'
import { tutorialFor } from '@/lib/tutorials/registry'
import { TUTORIAL_EN } from '@/i18n/en/tutorial'
import { TUTORIAL_FR } from '@/i18n/fr/tutorial'
import { seededRng } from '../../helpers'
import { walk } from './walk'

const tutorial = tutorialFor('morph', 'asPocket')!

describe('Pyramorphinx tutorial', () => {
  it('has three stages, for its as-a-Pocket method', () => {
    expect(tutorial.stageKeys).toEqual([
      'stepTutorialMorphHalf',
      'stepTutorialMorphTurn',
      'stepTutorialMorphPlace',
    ])
    // Held one way only: its halves stay the 2x2's layers.
    expect(tutorial.frame.holds).toHaveLength(1)
  })

  it('walks every scramble to the solve, stage after stage', () => {
    const rng = seededRng(3)
    const figures = new Set<string>()
    for (let k = 0; k < 8; k++) {
      const { steps, cube } = walk(
        tutorial,
        applyMoves(solvedCube('morph'), scramble('morph', 12, rng)),
        30,
      )
      expect(isSolved(cube)).toBe(true)
      const stages = steps.map((s) => s.stage ?? 0)
      expect(stages).toEqual([...stages].sort())
      steps.forEach((s) => s.figure && figures.add(s.figure))
    }
    for (const texts of [TUTORIAL_FR, TUTORIAL_EN]) {
      for (const key of figures) expect(texts.figures[key], key).toBeTruthy()
    }
  })

  it('reads a corner of the first half as the landmark, or brings one there', () => {
    // Solved: the first half done, the sides' colors read on its corner.
    const solved = solvedCube('morph')
    expect(tutorial.faceColor(solved, tutorial.frame.down)).not.toBeNull()
    // Both corner places of the first half holding middles: one turn first.
    const shifted = applyMoves(solved, parseMoves('D'))
    const step = tutorial.stepOf(shifted)!
    expect(step.key).toBe('stepTutorialMorphCorner')
    expect(step.formula(null)).toHaveLength(1)
  })

  it('names its pieces tips and middles, in both languages', () => {
    const kinds = solvedCube('morph').map((c) => tutorial.pieceKind(c))
    expect(kinds.filter((k) => k === 'tip')).toHaveLength(4)
    expect(kinds.filter((k) => k === 'middle')).toHaveLength(4)
    for (const texts of [TUTORIAL_FR, TUTORIAL_EN]) {
      for (const key of ['stepTutorialMorphCorner', ...tutorial.stageKeys]) {
        expect(texts.titles[key], key).toBeTruthy()
        expect(texts.hints[key], key).toBeTruthy()
      }
      for (const term of tutorial.glossary) expect(texts.terms[term.key], term.key).toBeTruthy()
    }
  })
})
