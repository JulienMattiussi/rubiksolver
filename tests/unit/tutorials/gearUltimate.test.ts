import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { CUBE_HOLDS } from '@/lib/core/hold'
import { scrambleTurns } from '@/lib/core/moves'
import { applyMoves } from '@/lib/core/turn'
import type { GearMove } from '@/lib/core/types'
import { tutorialFor } from '@/lib/tutorials/registry'
import { TUTORIAL_EN } from '@/i18n/en/tutorial'
import { TUTORIAL_FR } from '@/i18n/fr/tutorial'
import { seededRng } from '../../helpers'
import { expectTexts, walk } from './walk'

const tutorial = tutorialFor('gearU', 'gearCornersFirst')!
const SOLVED = solvedCube('gearU')

describe('Gear Cube Ultimate tutorial', () => {
  it('has four stages, for the Gear Cube Ultimate only', () => {
    expect(tutorial.stageKeys).toEqual([
      'stepGearCorners',
      'stepGearEdges',
      'stepGearClips',
      'stepGearSpins',
    ])
    expect(tutorialFor('gearCube', 'gearCornersFirst')).toBeUndefined()
  })

  it('walks every scramble to the solve, stage after stage', () => {
    const rng = seededRng(3)
    const figures = new Set<string>()
    for (let k = 0; k < 8; k++) {
      const scrambled = applyMoves(SOLVED, scrambleTurns('gearU', 20, rng, SOLVED))
      const { steps, cube } = walk(tutorial, scrambled, 60)
      expect(isSolved(cube)).toBe(true)
      const stages = steps.map((s) => s.stage!)
      expect(stages).toEqual([...stages].sort())
      steps.forEach((s) => s.figure && figures.add(s.figure))
    }
    expect(figures.size).toBe(3)
    for (const texts of [TUTORIAL_FR, TUTORIAL_EN]) {
      for (const key of figures) expect(texts.figures[key], key).toBeTruthy()
    }
  })

  it('reads a gear move where its face stands in each hold', () => {
    const move: GearMove = { gear: 'R', amount: 1 }
    expect(CUBE_HOLDS.holds.map((h) => (CUBE_HOLDS.played(h, move) as GearMove).gear)).toEqual([
      'R',
      'B',
      'L',
      'F',
    ])
    for (const hold of CUBE_HOLDS.holds) {
      expect(CUBE_HOLDS.inHold(hold, CUBE_HOLDS.played(hold, move))).toEqual(move)
    }
  })

  it('is held by the center in front, whichever it is now', () => {
    expect(tutorial.faceColor(SOLVED, [0, 0, 1])).toEqual({ color: 'E', center: true })
  })

  it('says its stages and words in both languages', () => {
    expectTexts(tutorial)
    for (const texts of [TUTORIAL_FR, TUTORIAL_EN]) {
      for (const key of tutorial.stageKeys) expect(texts.progress[key], key).toBeTruthy()
      for (const key of tutorial.stageKeys.slice(1)) expect(texts.checks[key], key).toBeTruthy()
    }
  })
})
