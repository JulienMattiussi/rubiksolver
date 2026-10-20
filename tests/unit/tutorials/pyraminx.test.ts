import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { scrambleTurns } from '@/lib/core/moves'
import { applyMoves } from '@/lib/core/turn'
import type { PyraMove, PyraVertex } from '@/lib/core/types'
import { PYRA_HOLDS } from '@/lib/tutorials/pyramid/pyraHolds'
import { tutorialFor } from '@/lib/tutorials/registry'
import { TUTORIAL_EN } from '@/i18n/en/tutorial'
import { TUTORIAL_FR } from '@/i18n/fr/tutorial'
import { seededRng } from '../../helpers'
import { walk } from './walk'

const tutorial = tutorialFor('pyra', 'centersFirst')!

describe('Pyraminx tutorial', () => {
  it('has five stages, for its centers-first method only', () => {
    expect(tutorial.stageKeys).toEqual([
      'stepTutorialPyraCenters',
      'stepTutorialPyraTips',
      'stepTutorialPyraBottom',
      'stepTutorialPyraTop',
      'stepTutorialPyraFlip',
    ])
    expect(tutorialFor('tetra', 'centersFirst')).toBeUndefined()
  })

  it('walks every scramble to the solve, stage after stage', () => {
    const rng = seededRng(5)
    const figures = new Set<string>()
    for (let k = 0; k < 6; k++) {
      const scrambled = applyMoves(
        solvedCube('pyra'),
        scrambleTurns('pyra', 11, rng, solvedCube('pyra')),
      )
      const { steps, cube } = walk(tutorial, scrambled, 40)
      expect(isSolved(cube)).toBe(true)
      const stages = steps.map((s) => s.stage!)
      expect(stages).toEqual([...stages].sort())
      steps.forEach((s) => s.figure && figures.add(s.figure))
    }
    for (const texts of [TUTORIAL_FR, TUTORIAL_EN]) {
      for (const key of figures) expect(texts.figures[key], key).toBeTruthy()
    }
  })

  it('holds the puzzle round its top, a turn read where its corner stands', () => {
    const turn: PyraMove = { vertex: 'L', amount: 1 }
    for (const hold of PYRA_HOLDS.holds) {
      expect(PYRA_HOLDS.inHold(hold, PYRA_HOLDS.played(hold, turn))).toEqual(turn)
      // The top stays the top; the side in front is across from the back corner.
      expect(PYRA_HOLDS.played(hold, { vertex: 'U', amount: 1 })).toEqual({
        vertex: 'U',
        amount: 1,
      })
    }
    expect(
      PYRA_HOLDS.holds.map((h) => PYRA_HOLDS.played(h, turn) as PyraMove).map((m) => m.vertex),
    ).toEqual<PyraVertex[]>(['L', 'R', 'B'])
    expect(PYRA_HOLDS.front('B')).toEqual([1, -1, 1])
  })

  it('names its pieces tips, centers and edges, and its sides by color', () => {
    const cube = solvedCube('pyra')
    const kinds = cube.map((c) => tutorial.pieceKind(c))
    expect(kinds.filter((k) => k === 'tip')).toHaveLength(4)
    expect(kinds.filter((k) => k === 'center')).toHaveLength(4)
    expect(kinds.filter((k) => k === 'edge')).toHaveLength(6)
    expect(tutorial.holding).toBe('flat')
    expect(tutorial.faceColor(cube, PYRA_HOLDS.front('B'))?.color).toBe('G')
  })

  it('says its stages and words in both languages', () => {
    for (const texts of [TUTORIAL_FR, TUTORIAL_EN]) {
      for (const key of tutorial.stageKeys) {
        expect(texts.titles[key], key).toBeTruthy()
        expect(texts.hints[key], key).toBeTruthy()
        expect(texts.progress[key], key).toBeTruthy()
      }
      for (const term of tutorial.glossary) expect(texts.terms[term.key], term.key).toBeTruthy()
      expect(texts.holding.flat!('rouge', 'jaune')).toContain('jaune')
    }
  })
})
