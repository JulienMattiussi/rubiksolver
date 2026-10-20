import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { scrambleTurns } from '@/lib/core/moves'
import { applyMoves } from '@/lib/core/turn'
import { tutorialFor } from '@/lib/tutorials/registry'
import { TUTORIAL_EN } from '@/i18n/en/tutorial'
import { TUTORIAL_FR } from '@/i18n/fr/tutorial'
import { seededRng } from '../../helpers'
import { expectTexts, walk } from './walk'

const tutorial = tutorialFor('ghost', 'cornersFirst')!
const SOLVED = solvedCube('ghost')

describe('Floppy Ghost tutorial', () => {
  it('places the corners, turns them over, then flips the edges', () => {
    expect(tutorial.stageKeys).toEqual([
      'stepTutorialGhostCorners',
      'stepTutorialGhostTwist',
      'stepTutorialGhostEdges',
    ])
  })

  it('walks scrambles to the solve, a piece at a time', () => {
    const rng = seededRng(3)
    for (let k = 0; k < 20; k++) {
      const start = applyMoves(SOLVED, scrambleTurns('ghost', 15, rng, SOLVED))
      const { steps, cube } = walk(tutorial, start, 40)
      expect(isSolved(cube)).toBe(true)
      // No turn undone by the next (a half turn twice is none).
      for (const step of steps) {
        const moves = step.formula(step.suggestion)!
        moves.forEach((m, i) => expect(moves[i + 1]).not.toEqual(m))
      }
      const stages = steps.map((s) => s.stage!)
      expect(stages).toEqual([...stages].sort((a, b) => a - b))
    }
  }, 60000)

  it('names its ten pieces in a legend, corners A to E and edges 1 to 5', () => {
    const legend = tutorial.legend!
    expect(legend.labels.map((l) => l.label).join('')).toBe('ABCDE12345')
    const kinds = legend.labels.map((l) => tutorial.pieceKind(SOLVED[l.piece]!))
    expect(kinds).toEqual([...Array(5).fill('corner'), ...Array(5).fill('edge')])
    // The hold told by the corner top left, whichever stands there.
    const scrambled = applyMoves(SOLVED, [{ side: 'U' }, { side: 'R' }])
    expect(tutorial.pieceKind(scrambled[legend.anchor!(scrambled)]!)).toBe('corner')
    // Solved, every piece shows its front; a turn shows the back of those it moves.
    expect(SOLVED.some((c) => legend.turned(c))).toBe(false)
    const flipped = applyMoves(SOLVED, [{ side: 'U' }])
    expect(flipped.filter((c) => legend.turned(c))).toHaveLength(3)
  })

  it('says its own stages and words in both languages', () => {
    expectTexts(tutorial)
    for (const texts of [TUTORIAL_FR, TUTORIAL_EN]) expect(texts.holding.ghost).toBeTruthy()
  })
})
