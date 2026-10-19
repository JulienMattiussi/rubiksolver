import { describe, expect, it } from 'vitest'
import { FACE_COLOR, isSolved, solvedCube, stateKey } from '@/lib/core/cube'
import { FACE_NORMAL } from '@/lib/core/geometry'
import { CUBE_HOLDS } from '@/lib/core/hold'
import { invertMoves, scramble } from '@/lib/core/moves'
import { parseMoves } from '@/lib/core/notation'
import { applyMoves } from '@/lib/core/turn'
import { isFaceMove, type Cube } from '@/lib/core/types'
import { PLL_T, PLL_Y, SUNE } from '@/lib/methods/standard/algs'
import { topFaceDone2 } from '@/lib/methods/standard/cube2'
import { markedOn } from '@/lib/teach/scene'
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
  it('has three stages, for its layer-by-layer method', () => {
    expect(tutorial.stages).toBe(3)
    expect(tutorial.stageKeys).toEqual([
      'stepTutorialCorner2',
      'stepTutorialTopFace2',
      'stepTutorialTopCorners2',
    ])
  })

  it('walks every scramble to the solve, stage after stage', () => {
    const rng = seededRng(7)
    const figures = new Set<string>()
    for (let k = 0; k < 8; k++) {
      const { steps, cube } = walk(applyMoves(solvedCube('2'), scramble('2', 12, rng)))
      expect(isSolved(cube)).toBe(true)
      const stages = steps.map((s) => s.stage ?? 0)
      expect(stages).toEqual([...stages].sort())
      // Nothing turns the whole cube but turning it over, before the stages.
      for (const step of steps.filter((s) => s.stage)) {
        expect(step.formula(step.suggestion)!.some((m) => isFaceMove(m) && m.whole)).toBe(false)
      }
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

  it('reads the landmark where it stands: a yellow corner, yellow down', () => {
    // Its left side untouched: two yellow corners placed side by side.
    const cube = applyMoves(solvedCube('2'), parseMoves("U R U'"))
    const step = stepOf(cube)
    expect(step.key).toBe('stepTutorialCorner2')
    expect(step.progress).toEqual({ done: 2, total: 4 })
    // The sides' colors read on it: the solved cube's, nothing turned.
    expect(tutorial.faceColor(cube, FACE_NORMAL.L)).toEqual({ color: FACE_COLOR.L, center: false })
  })

  it('turns the cube over first when no yellow is down', () => {
    const cube = applyMoves(solvedCube('2'), parseMoves('x2 R U'))
    const step = stepOf(cube)
    expect(step.key).toBe('stepTutorialTurnOver2')
    expect(step.stage).toBeUndefined()
    expect(tutorial.faceColor(cube, FACE_NORMAL.F)).toBeNull()
    const moves = step.formula(null)!
    expect(moves).toHaveLength(1)
    expect(moves.every((m) => isFaceMove(m) && m.whole)).toBe(true)
    expect(stepOf(applyMoves(cube, moves)).key).toBe('stepTutorialCorner2')
  })

  it('turns the white corners up by Sunes, the top turned first', () => {
    // Two Sunes undone, the top turned between: one corner white up.
    const cube = applyMoves(solvedCube('2'), invertMoves(parseMoves(`${SUNE} U ${SUNE}`)))
    const step = stepOf(cube)
    expect(step.key).toBe('stepTutorialTopFace2')
    expect(step.figure).toMatch(/^figureTop/)
    const { cube: solved } = walk(cube)
    expect(topFaceDone2(solved)).toBe(true)
  })

  it('takes a white corner down only on a detour, and says so', () => {
    // Every white face the Sunes lead to, three deep.
    const sunes = CUBE_HOLDS.holds.flatMap((hold) =>
      ['', 'U ', 'U2 ', "U' "].map((pre) =>
        parseMoves(pre + SUNE).map((m) => CUBE_HOLDS.played(hold, m)),
      ),
    )
    let states = [solvedCube('2')]
    for (let d = 0; d < 3; d++)
      states = states.flatMap((c) => sunes.map((s) => applyMoves(c, invertMoves(s))))
    const up = (cube: Cube) => tutorial.stepOf(cube)?.progress?.done ?? 4
    // Each white face once: every figure, every way it may be held.
    const distinct = [...new Map(states.map((c) => [stateKey(c), c])).values()]
    for (const start of distinct.slice(0, 30)) {
      let cube = start
      while (tutorial.stepOf(cube)?.key === 'stepTutorialTopFace2') {
        const step = stepOf(cube)
        const after = applyMoves(cube, step.formula(null)!)
        // A step back only where no Sune as short goes forward: the figure
        // says so.
        // The corners the check names: those it leaves white up.
        expect(markedOn(cube, step.formula(null)!, step)).toHaveLength(step.outcome!.done)
        const back = !topFaceDone2(after) && up(after) < up(cube)
        expect(back).toBe(step.figure!.endsWith('Detour'))
        cube = after
      }
    }
  }, 30000) // A search per step: slow on a loaded machine.

  it('swaps two corners side by side, or across: the parity', () => {
    // The corners in their place counted as they stand: none a turn off,
    // two of the four swapped.
    const cases = [
      ['U', 'figureCornersTurn', 0],
      [PLL_T, 'figureCornersAdjacent', 2],
      [PLL_Y, 'figureCornersDiagonal', 2],
    ] as const
    for (const [setup, figure, placed] of cases) {
      const cube = applyMoves(solvedCube('2'), parseMoves(setup))
      const step = stepOf(cube)
      expect(step.key).toBe('stepTutorialTopCorners2')
      expect(step.figure).toBe(figure)
      expect(step.progress).toEqual({ done: placed, total: 4 })
      expect(step.outcome).toEqual({ done: 4, total: 4 })
      expect(isSolved(applyMoves(cube, step.formula(null)!))).toBe(true)
    }
  })
})
