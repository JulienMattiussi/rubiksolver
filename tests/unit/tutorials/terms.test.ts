import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { FACE_NORMAL } from '@/lib/core/geometry'
import { parseMoves } from '@/lib/core/moves'
import { applyMoves } from '@/lib/core/turn'
import { termStep } from '@/lib/teach/tutorial'
import { tutorialFor } from '@/lib/tutorials/registry'
import { TUTORIAL_EN } from '@/i18n/en/tutorial'
import { TUTORIAL_MIRROR_EN } from '@/i18n/en/tutorialMirror'
import { TUTORIAL_FR } from '@/i18n/fr/tutorial'
import { TUTORIAL_MIRROR_FR } from '@/i18n/fr/tutorialMirror'

const cube3 = tutorialFor('3', 'beginner')!
const cube2 = tutorialFor('2', 'beginner')!

describe('tutorial glossary', () => {
  it('names the kinds of pieces first, the thicknesses on a mirror only', () => {
    const keys = (tutorial: typeof cube3, mirror: boolean) =>
      tutorial.glossary.filter((t) => !t.only || (mirror && t.only === 'mirror')).map((t) => t.key)
    const turning = ['termClockwise', 'termCounterclockwise']
    expect(keys(cube3, false)).toEqual(['termCenter', 'termEdge', 'termCorner', ...turning])
    expect(keys(cube2, false)).toEqual(['termCorner', ...turning])
    // Thinnest first: the mirror's six thicknesses.
    expect(keys(cube3, true).slice(5)).toEqual(
      ['O', 'Y', 'B', 'G', 'W', 'R'].map((c) => `termThickness${c}`),
    )
  })

  it('lights each word’s pieces, as a step before the stages', () => {
    const solved = solvedCube('3')
    const counts = cube3.glossary.map((t) => t.pieces(solved).length)
    expect(counts).toEqual([6, 12, 8, 9, 9, 9, 9, 9, 9, 9, 9])
    const step = termStep(cube3, cube3.glossary[1]!, 1, 3, solved)
    expect(step).toMatchObject({ kind: 'term', stage: 0, progress: { done: 2, total: 3 } })
    expect(step.focus).toHaveLength(12)
  })

  it('shows the ways of turning by a turn of the front, each way', () => {
    const demo = (key: string) => cube3.glossary.find((t) => t.key === key)!.demo
    expect(demo('termClockwise')).toEqual({ face: 'F', amount: 1 })
    expect(demo('termCounterclockwise')).toEqual({ face: 'F', amount: 3 })
  })

  it('looks at a thickness from the side wearing it, center or not', () => {
    const yellow = cube3.glossary.find((t) => t.key === 'termThicknessY')!
    expect(yellow.from!(applyMoves(solvedCube('3'), parseMoves("R U F'")))).toEqual(FACE_NORMAL.D)
    const yellow2 = cube2.glossary.find((t) => t.key === 'termThicknessY')!
    expect(yellow2.from!(applyMoves(solvedCube('2'), parseMoves('U')))).toEqual(FACE_NORMAL.D)
  })

  it('says every word in both languages', () => {
    for (const texts of [TUTORIAL_FR, TUTORIAL_EN]) {
      for (const term of cube3.glossary.filter((t) => !t.only)) {
        expect(texts.terms[term.key], term.key).toBeTruthy()
      }
    }
    for (const mirror of [TUTORIAL_MIRROR_FR, TUTORIAL_MIRROR_EN]) {
      expect(new Set(Object.values(mirror.thickness)).size).toBe(6)
      expect(mirror.thicknessTerm('fine', true).length).toBeGreaterThan(
        mirror.thicknessTerm('fine', false).length,
      )
    }
  })
})
