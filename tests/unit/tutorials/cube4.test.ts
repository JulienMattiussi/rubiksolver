import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { scramble } from '@/lib/core/moves'
import { parseMoves } from '@/lib/core/notation'
import { applyMoves } from '@/lib/core/turn'
import { OLL_PARITY, PLL_PARITY } from '@/lib/methods/standard/solver4/parity'
import { PROJECT_4 } from '@/lib/tutorials/standard/reduced'
import { tutorialFor } from '@/lib/tutorials/registry'

import { seededRng } from '../../helpers'
import { expectTexts, walk } from './walk'

const tutorial = tutorialFor('4', 'reduction')!

describe('4x4 tutorial', () => {
  it('reduces, then plays the 3x3 stages, a parity before each of its two', () => {
    expect(tutorial.stageKeys).toEqual([
      'stepTutorialCenters4',
      'stepTutorialPair4',
      'stepTutorialCross',
      'stepTutorialCorner',
      'stepTutorialMiddle',
      'stepTutorialOllParity4',
      'stepTutorialTopCross',
      'stepTutorialPllParity4',
      'stepTutorialTopEdges',
      'stepTutorialTopCorners',
      'stepTutorialTopTwist',
    ])
  })

  it('walks scrambles to the solve, stage after stage, a center at least a step', () => {
    const rng = seededRng(4)
    for (let k = 0; k < 3; k++) {
      const { steps, cube } = walk(
        tutorial,
        applyMoves(solvedCube('4'), scramble('4', 25, rng)),
        120,
      )
      expect(isSolved(cube)).toBe(true)
      const stages = steps.map((s) => s.stage!)
      expect(stages).toEqual([...stages].sort((a, b) => a - b))
      // A face full, the next one counts the centers it already shows.
      const centers = steps
        .filter((s) => s.key === 'stepTutorialCenters4')
        .map((s) => s.progress!.done)
      centers.slice(1).forEach((done, i) => expect(done).toBeGreaterThan(centers[i]!))
    }
  }, 60000)

  it('fixes each parity where it shows, by its slice formula', () => {
    // A reduced 4x4 with a single edge flipped: the OLL parity after the
    // first two layers.
    const oll = applyMoves(solvedCube('4'), OLL_PARITY)
    const step = tutorial.stepOf(oll)!
    expect(step.key).toBe('stepTutorialOllParity4')
    expect(isSolved(applyMoves(oll, step.formula(null)!))).toBe(true)
    const pll = applyMoves(solvedCube('4'), PLL_PARITY)
    expect(tutorial.stepOf(pll)!.key).toBe('stepTutorialPllParity4')
  })

  it('reads a reduced 4x4 as a 3x3, its pieces kept by what they are', () => {
    const cube = applyMoves(solvedCube('4'), parseMoves("R U F'"))
    const small = PROJECT_4.project(cube)
    expect(isSolved(applyMoves(small, parseMoves("F U' R'")))).toBe(true)
    // A 3x3 edge is two wings, a center four, a corner one.
    const at = (p: string) => small.findIndex((c) => c.position.join() === p)
    expect(PROJECT_4.up(cube, at('0,1,1'))).toHaveLength(2)
    expect(PROJECT_4.up(cube, at('0,1,0'))).toHaveLength(4)
    expect(PROJECT_4.up(cube, at('1,1,1'))).toHaveLength(1)
    expect(PROJECT_4.upSlots([0, -1, 1])).toEqual([
      [-1, -3, 3],
      [1, -3, 3],
    ])
    expect(PROJECT_4.downSlot([1, -3, 3])).toEqual([0, -1, 1])
  })

  it('says its own stages and words in both languages', () => {
    expectTexts(tutorial)
  })
})
