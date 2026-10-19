import { describe, expect, it } from 'vitest'
import { FACE_COLOR, isSolved, solvedCube } from '@/lib/core/cube'
import { FACE_NORMAL } from '@/lib/core/geometry'
import { invertMoves, scramble } from '@/lib/core/moves'
import { formatMoves, parseMoves } from '@/lib/core/notation'
import { applyMoves } from '@/lib/core/turn'
import { isFaceMove, type Cube } from '@/lib/core/types'
import { ANTISUNE, PLL_AB, PLL_Y, SUNE } from '@/lib/methods/standard/algs'
import { tutorialFor } from '@/lib/tutorials/registry'
import { TUTORIAL_EN } from '@/i18n/en/tutorial'
import { TUTORIAL_FR } from '@/i18n/fr/tutorial'
import { seededRng } from '../../helpers'

const tutorial = tutorialFor('2', 'beginner')!
const stepOf = (cube: Cube) => tutorial.stepOf(cube)!

/** The steps from a state to the solve, each suggestion's formula played. */
function walk(cube: Cube) {
  const steps = []
  for (let n = 0; n < 30 && !isSolved(cube); n++) {
    const step = stepOf(cube)
    const moves = step.formula(step.suggestion)
    expect(moves, step.key).not.toBeNull()
    steps.push(step)
    cube = applyMoves(cube, moves!)
  }
  return { steps, cube }
}

describe('2x2 tutorial', () => {
  it('has four stages, as its manual (four steps, three formulas)', () => {
    expect(tutorial.stages).toBe(4)
    expect(tutorial.stageKeys).toEqual([
      'stepTutorialFace2',
      'stepTutorialLayer2',
      'stepTutorialTopFace2',
      'stepTutorialTopCorners2',
    ])
    expect(tutorial.openings).toEqual([])
  })

  it('walks every scramble to the solve, stage after stage', () => {
    const rng = seededRng(7)
    const figures = new Set<string>()
    for (let k = 0; k < 8; k++) {
      const { steps, cube } = walk(applyMoves(solvedCube('2'), scramble('2', 12, rng)))
      expect(isSolved(cube)).toBe(true)
      const stages = steps.map((s) => s.stage ?? 0)
      expect(stages).toEqual([...stages].sort())
      // The whole cube turned once only: over, its yellow face done.
      const whole = steps.filter((s) =>
        s.formula(s.suggestion)!.some((m) => isFaceMove(m) && m.whole),
      )
      expect(whole.map((s) => s.figure)).toEqual(['figureTurnOver2'])
      steps.forEach((s) => s.figure && figures.add(s.figure))
    }
    // Every figure met is told in both languages.
    for (const key of figures) {
      expect(TUTORIAL_FR.figures[key], key).toBeDefined()
      expect(TUTORIAL_EN.figures[key], key).toBeDefined()
    }
  })

  it('names each stage in both languages', () => {
    for (const texts of [TUTORIAL_FR, TUTORIAL_EN]) {
      for (const key of tutorial.stageKeys) {
        expect(texts.titles[key], key).toBeDefined()
        expect(texts.hints[key], key).toBeDefined()
        expect(texts.progress[key], key).toBeDefined()
      }
    }
  })

  it('builds the yellow face on top, a corner at a time, keeping those up', () => {
    // Yellow on top, two of its corners lifted off.
    const cube = applyMoves(solvedCube('2'), parseMoves('x2 R'))
    const step = stepOf(cube)
    expect(step.key).toBe('stepTutorialFace2')
    expect(step.progress).toEqual({ done: 2, total: 4 })
    // One more up, or the face done (a later stage).
    const next = stepOf(applyMoves(cube, step.formula(step.suggestion)!))
    expect(next.stage! > 1 || next.progress!.done > 2).toBe(true)
  })

  it('puts the yellow layer right by formula 1, still on top', () => {
    const yellowUp = applyMoves(solvedCube('2'), parseMoves('x2'))
    const cube = applyMoves(yellowUp, parseMoves(PLL_AB))
    const step = stepOf(cube)
    expect(step.key).toBe('stepTutorialLayer2')
    expect(step.figure).toBe('figureLayer2Once')
    // Its sides' colors: none read before the layer is down.
    expect(tutorial.faceColor(cube, FACE_NORMAL.F)).toBeNull()
    const done = applyMoves(cube, step.formula(null)!)
    expect(stepOf(done).figure).toBe('figureTurnOver2')
  })

  it('turns the cube over, then reads its sides on the yellow layer', () => {
    const cube = applyMoves(solvedCube('2'), parseMoves('x2'))
    const step = stepOf(cube)
    expect(step.figure).toBe('figureTurnOver2')
    const over = applyMoves(cube, step.formula(null)!)
    expect(isSolved(over)).toBe(true)
    expect(tutorial.faceColor(over, FACE_NORMAL.L)).toEqual({ color: FACE_COLOR.L, center: false })
  })

  it('tells the white face’s seven cases, each by the manual’s formulas', () => {
    const A = ANTISUNE
    const S = SUNE
    const cases = [A, S, `${A} ${A}`, `${A} U' ${A}`, `${A} U2 ${S}`, `${A} U ${S}`, `${A} U' ${S}`]
    cases.forEach((moves, i) => {
      const cube = applyMoves(solvedCube('2'), invertMoves(parseMoves(moves)))
      const step = stepOf(cube)
      expect(step.key).toBe('stepTutorialTopFace2')
      expect(step.figure).toBe(`figureFace2Case${i + 1}`)
      // The white face done: its corners next, or the cube solved already.
      const next = tutorial.stepOf(applyMoves(cube, step.formula(null)!))
      expect(next === null || next.key === 'stepTutorialTopCorners2').toBe(true)
    })
  })

  it('places the white corners by formula 1: a turn, once or twice', () => {
    const cases = [
      ['U', 'figureCorners2Turn'],
      [PLL_AB, 'figureCorners2Once'],
      [PLL_Y, 'figureCorners2Twice'],
    ] as const
    for (const [setup, figure] of cases) {
      let cube = applyMoves(solvedCube('2'), parseMoves(setup))
      const step = stepOf(cube)
      expect(step.key).toBe('stepTutorialTopCorners2')
      expect(step.figure).toBe(figure)
      cube = walk(cube).cube
      expect(isSolved(cube)).toBe(true)
    }
  })
})

describe('2x2 tutorial reminder', () => {
  it('lists its stages and their three formulas, the first taught twice', () => {
    const recap = tutorial.recap.map((s) => [s.key, s.formulas.map((f) => formatMoves(f))])
    expect(recap).toEqual([
      ['stepTutorialFace2', []],
      ['stepTutorialLayer2', [PLL_AB]],
      ['stepTutorialTopFace2', [ANTISUNE, SUNE]],
      ['stepTutorialTopCorners2', [PLL_AB]],
    ])
  })
})
