import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { scramble } from '@/lib/core/moves'
import { applyMoves } from '@/lib/core/turn'
import { TURN_HALF } from '@/lib/methods/standard/superCube'
import { tutorialFor } from '@/lib/tutorials/registry'

import { seededRng } from '../../helpers'
import { expectTexts, walk } from './walk'

describe.each(['super4', 'super5'] as const)('%s tutorial', (shape) => {
  const tutorial = tutorialFor(shape, 'reduction')!
  const big = tutorialFor(shape === 'super4' ? '4' : '5', 'reduction')!

  it('plays its big cube’s stages, then its own', () => {
    const own =
      shape === 'super4'
        ? ['stepTutorialSuperCenters']
        : ['stepTutorialSuperMiddles', 'stepTutorialSuperCenters']
    expect(tutorial.stageKeys).toEqual([...big.stageKeys, ...own])
    expect(tutorial.openings).toEqual(big.openings)
  })

  it('walks a scramble to the solve, stage after stage, the centers cycled home last', () => {
    const start = applyMoves(solvedCube(shape), scramble(shape, 40, seededRng(9)))
    const { steps, cube } = walk(tutorial, start, 250)
    expect(isSolved(cube)).toBe(true)
    const stages = steps.flatMap((s) => (s.stage ? [s.stage] : []))
    expect(stages).toEqual([...stages].sort((a, b) => a - b))
    // Three centers a cycle (or two, one put home through a right slot).
    const centers = steps.filter((s) => s.key === 'stepTutorialSuperCenters')
    expect(centers.length).toBeGreaterThan(0)
    for (const step of centers) {
      expect(step.focus!.length).toBeGreaterThanOrEqual(2)
      expect(step.progress!.total).toBe(shape === 'super4' ? 24 : 48)
    }
  }, 120000)

  it('names a center by its own color, its borders aside', () => {
    const solved = solvedCube(shape)
    const center = solved.find((c) => tutorial.pieceKind(c) === 'center')!
    expect(center.stickers.length).toBeGreaterThan(1)
    expect(tutorial.outside!(center)).toHaveLength(1)
  })

  it('says its own stages and words in both languages', () => {
    expectTexts(tutorial)
  })
})

it('straightens the Super Professor’s middle centers first', () => {
  const tutorial = tutorialFor('super5', 'reduction')!
  const turned = applyMoves(solvedCube('super5'), TURN_HALF)
  const step = tutorial.stepOf(turned)!
  expect(step.key).toBe('stepTutorialSuperMiddles')
  expect(step.progress).toEqual({ done: 5, total: 6 })
  expect(isSolved(applyMoves(turned, step.formula(null)!))).toBe(true)
})
