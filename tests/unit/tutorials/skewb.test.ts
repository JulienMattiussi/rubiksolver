import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { FACE_NORMAL } from '@/lib/core/geometry'
import { scrambleTurns } from '@/lib/core/moves'
import { applyMoves } from '@/lib/core/turn'
import type { RainbowMove } from '@/lib/core/types'
import { parse } from '@/lib/methods/shared/skewbKit'
import { holdAt, SKEWB_HOLDS } from '@/lib/tutorials/diagonal/skewbHolds'
import { tutorialFor } from '@/lib/tutorials/registry'
import { TUTORIAL_EN } from '@/i18n/en/tutorial'
import { TUTORIAL_FR } from '@/i18n/fr/tutorial'
import { seededRng } from '../../helpers'
import { expectTexts, walk } from './walk'

const tutorial = tutorialFor('skewb', 'skewbTopFirst')!
const SOLVED = solvedCube('skewb')

describe('Skewb tutorial', () => {
  it('has four stages, for its top-first method', () => {
    expect(tutorial.stageKeys).toEqual([
      'stepSkewbTopPlaced',
      'stepSkewbTopTwist',
      'stepSkewbCenters',
      'stepSkewbBottom',
    ])
    expect(tutorialFor('skewbU', 'skewbTopFirst')).toBeUndefined()
  })

  it('walks every scramble to the solve, stage after stage', () => {
    const rng = seededRng(7)
    const figures = new Set<string>()
    for (let k = 0; k < 8; k++) {
      const scrambled = applyMoves(SOLVED, scrambleTurns('skewb', 15, rng, SOLVED))
      const { steps, cube } = walk(tutorial, scrambled, 30)
      expect(isSolved(cube)).toBe(true)
      const stages = steps.map((s) => s.stage!)
      expect(stages).toEqual([...stages].sort())
      // Four turns at most for the top, three double formulas for the bottom.
      const place = steps.filter((s) => s.key === 'stepSkewbTopPlaced')
      expect(place.flatMap((s) => s.formula(s.suggestion)!).length).toBeLessThanOrEqual(4)
      expect(steps.filter((s) => s.key === 'stepSkewbBottom').length).toBeLessThanOrEqual(3)
      steps.forEach((s) => s.figure && figures.add(s.figure))
    }
    for (const texts of [TUTORIAL_FR, TUTORIAL_EN]) {
      for (const key of figures) expect(texts.figures[key], key).toBeTruthy()
    }
  })

  it('holds the Skewb round its top, a turn read where its corner stands', () => {
    const [turn] = parse('B') as [RainbowMove]
    for (const hold of SKEWB_HOLDS.holds) {
      expect(SKEWB_HOLDS.inHold(hold, SKEWB_HOLDS.played(hold, turn))).toEqual(turn)
    }
    // The bottom front right corner, seen from each side: B, E, H, O.
    expect(
      SKEWB_HOLDS.holds.map((h) => (SKEWB_HOLDS.played(h, turn) as RainbowMove).triangle),
    ).toEqual(['R', 'r', 'd', 'D'])
    // Each top corner in front on the right in its own hold.
    expect(holdAt([1, 1, 1])).toBe('F')
    expect(holdAt([1, 1, -1])).toBe('R')
  })

  it('names a side by its color once a top corner tells it', () => {
    expect(tutorial.faceColor(SOLVED, FACE_NORMAL.F)?.color).toBe('G')
    expect(tutorial.faceColor(SOLVED, FACE_NORMAL.U)).toEqual({ color: 'W', center: true })
    expect(tutorial.holding).toBe('skewb')
  })

  it('says its stages and words in both languages', () => {
    expectTexts(tutorial)
    for (const texts of [TUTORIAL_FR, TUTORIAL_EN]) {
      for (const key of tutorial.stageKeys) expect(texts.progress[key], key).toBeTruthy()
      expect(texts.holding.skewb!('rouge', '')).toContain('rouge')
      // Its top corners placed among themselves, not by the side centers.
      expect(texts.placed.stepSkewbTopPlaced!('X', 0, 'jaune')).toContain('jaune')
      expect(texts.placed.stepSkewbTopPlaced!('X', 1, 'jaune')).not.toEqual(
        texts.placed.stepSkewbTopPlaced!('X', 0, 'jaune'),
      )
    }
  })
})
