import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { scramble } from '@/lib/core/moves'
import { parseMoves } from '@/lib/core/notation'
import { applyMoves } from '@/lib/core/turn'
import type { Cube } from '@/lib/core/types'
import { centersDone } from '@/lib/methods/standard/solver5/centers'
import { EDGE_PARITY } from '@/lib/methods/standard/solver5/edges'
import { PAIR_FORMULAS } from '@/lib/tutorials/standard/pair5'
import { PROJECT_5 } from '@/lib/tutorials/standard/reduced'
import { tutorialFor } from '@/lib/tutorials/registry'
import { TUTORIAL_EN } from '@/i18n/en/tutorial'
import { TUTORIAL_FR } from '@/i18n/fr/tutorial'
import { seededRng } from '../../helpers'

const tutorial = tutorialFor('5', 'reduction')!

/** The steps from a state to the solve, each suggestion's formula played. */
function walk(start: Cube) {
  let cube = start
  const steps = []
  for (let n = 0; n < 200 && !isSolved(cube); n++) {
    const step = tutorial.stepOf(cube)!
    const moves = step.formula(step.suggestion)
    expect(moves, step.key).not.toBeNull()
    steps.push(step)
    cube = applyMoves(cube, moves!)
  }
  return { steps, cube }
}

describe('5x5 tutorial', () => {
  it('reduces, fixes the edge parity, then plays the 3x3 stages', () => {
    expect(tutorial.openings).toEqual(['stepHoldCube'])
    expect(tutorial.stageKeys).toEqual([
      'stepTutorialCenters5',
      'stepTutorialPair5',
      'stepTutorialParity5',
      'stepTutorialCross',
      'stepTutorialCorner',
      'stepTutorialMiddle',
      'stepTutorialTopCross',
      'stepTutorialTopEdges',
      'stepTutorialTopCorners',
      'stepTutorialTopTwist',
    ])
  })

  it('walks scrambles to the solve, stage after stage, a center at least a step', () => {
    const rng = seededRng(5)
    for (let k = 0; k < 2; k++) {
      const { steps, cube } = walk(applyMoves(solvedCube('5'), scramble('5', 60, rng)))
      expect(isSolved(cube)).toBe(true)
      const stages = steps.flatMap((s) => (s.stage ? [s.stage] : []))
      expect(stages).toEqual([...stages].sort((a, b) => a - b))
      // A face full, the next one counts the centers it already shows.
      const centers = steps
        .filter((s) => s.key === 'stepTutorialCenters5')
        .map((s) => s.progress!.done)
      centers.slice(1).forEach((done, i) => expect(done).toBeGreaterThan(centers[i]!))
    }
  }, 60000)

  it('pairs a wing by a slice, the front right edge flipped, the slice back', () => {
    for (const formula of PAIR_FORMULAS) {
      // The centers stay whole whatever the edges.
      const cube = applyMoves(solvedCube('5'), parseMoves("R U2 F' L D B2"))
      expect(centersDone(applyMoves(cube, formula))).toBe(true)
    }
  })

  it('fixes the edge parity where it shows, by its slice formula', () => {
    const crossed = applyMoves(solvedCube('5'), EDGE_PARITY)
    const step = tutorial.stepOf(crossed)!
    expect(step.key).toBe('stepTutorialParity5')
    expect(step.focus).toHaveLength(2)
    expect(isSolved(applyMoves(crossed, step.formula(null)!))).toBe(true)
  })

  it('reads a reduced 5x5 as a 3x3, the middle piece first', () => {
    const cube = applyMoves(solvedCube('5'), parseMoves("R U F'"))
    const small = PROJECT_5.project(cube)
    expect(isSolved(applyMoves(small, parseMoves("F U' R'")))).toBe(true)
    // A 3x3 edge is a middle edge and two wings, a center nine, a corner one.
    const at = (p: string) => small.findIndex((c) => c.position.join() === p)
    const edge = PROJECT_5.up(cube, at('0,1,1'))
    expect(edge).toHaveLength(3)
    expect(cube[edge[0]!]!.position.join()).toBe('0,2,2')
    expect(PROJECT_5.up(cube, at('0,1,0'))).toHaveLength(9)
    expect(PROJECT_5.up(cube, at('1,1,1'))).toHaveLength(1)
    expect(PROJECT_5.upSlots([0, -1, 1])).toEqual([
      [0, -2, 2],
      [-1, -2, 2],
      [1, -2, 2],
    ])
    expect(PROJECT_5.downSlot([1, -2, 2])).toEqual([0, -1, 1])
  })

  it('says its own stages and words in both languages', () => {
    for (const texts of [TUTORIAL_FR, TUTORIAL_EN]) {
      for (const key of tutorial.stageKeys) {
        expect(texts.titles[key], key).toBeTruthy()
        expect(texts.hints[key], key).toBeTruthy()
      }
      for (const term of tutorial.glossary.filter((t) => !t.only)) {
        expect(texts.terms[term.key], term.key).toBeTruthy()
      }
    }
  })
})
