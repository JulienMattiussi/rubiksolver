import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { scrambleTurns } from '@/lib/core/moves'
import { parseMoves } from '@/lib/core/notation'
import { applyMoves } from '@/lib/core/turn'
import { barAxis, isCorner, shapeDone } from '@/lib/methods/tower/tower'
import type { Cube } from '@/lib/core/types'
import { tutorialFor } from '@/lib/tutorials/registry'
import { TUTORIAL_EN } from '@/i18n/en/tutorial'
import { TUTORIAL_FR } from '@/i18n/fr/tutorial'
import { seededRng } from '../../helpers'
import { expectTexts, walk } from './walk'

const tutorial = tutorialFor('224', 'twoPockets')!
const SOLVED = solvedCube('224')

describe('2x2x4 tower tutorial', () => {
  it('has five stages: the shape, then each Pocket, bottom then top', () => {
    expect(tutorial.stageKeys).toEqual([
      'stepTowerShape',
      'stepTowerInnerDown',
      'stepTowerInnerUp',
      'stepTowerOuterDown',
      'stepTowerOuterUp',
    ])
  })

  it('walks every scramble to the solve, stage after stage', { timeout: 60000 }, () => {
    const rng = seededRng(4)
    const figures = new Set<string>()
    for (let k = 0; k < 4; k++) {
      const scrambled = applyMoves(SOLVED, scrambleTurns('224', 25, rng, SOLVED))
      const { steps, cube } = walk(tutorial, scrambled, 80)
      expect(isSolved(cube)).toBe(true)
      const stages = steps.map((s) => s.stage!)
      expect(stages).toEqual([...stages].sort())
      steps.forEach((s) => s.figure && figures.add(s.figure))
    }
    for (const texts of [TUTORIAL_FR, TUTORIAL_EN]) {
      for (const key of figures) expect(texts.figures[key], key).toBeTruthy()
    }
  })

  it('brings the tower back in its box by turns alone when a few do', () => {
    const bent = applyMoves(SOLVED, parseMoves('Rw Uw'))
    // One step: the two turns stand no bar up apart.
    const { steps, cube } = walk(tutorial, bent, 1)
    expect(shapeDone(cube)).toBe(true)
    expect(steps.map((s) => s.figure)).toEqual(['figureTowerTurn'])
    expect(steps[0]!.formula(steps[0]!.suggestion)).toHaveLength(2)
  })

  it('stands more bars up at each step of the shape', () => {
    const up = (c: Cube) => c.filter((x) => isCorner(x) && barAxis(x) === 1).length
    const rng = seededRng(4)
    for (let k = 0; k < 6; k++) {
      let cube = applyMoves(SOLVED, scrambleTurns('224', 25, rng, SOLVED))
      for (let step = tutorial.stepOf(cube)!; step.stage === 1; step = tutorial.stepOf(cube)!) {
        const before = up(cube)
        cube = applyMoves(cube, step.formula(step.suggestion)!)
        expect(up(cube)).toBeGreaterThan(before)
      }
      expect(shapeDone(cube)).toBe(true)
    }
  })

  it('names its pieces corners and middles, its sides by the color they will be', () => {
    const kinds = SOLVED.map((c) => tutorial.pieceKind(c))
    expect(kinds.filter((k) => k === 'corner')).toHaveLength(8)
    expect(kinds.filter((k) => k === 'middle')).toHaveLength(8)
    expect(tutorial.holding).toBe('tower')
    expect(tutorial.faceColor(SOLVED, [0, -1, 0])?.color).toBe('B')
  })

  it('says its stages and words in both languages', () => {
    expectTexts(tutorial)
    for (const texts of [TUTORIAL_FR, TUTORIAL_EN]) {
      for (const key of tutorial.stageKeys) expect(texts.progress[key], key).toBeTruthy()
      expect(texts.holding.tower!('vert', 'bleu')).toContain('bleu')
    }
  })
})
