import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { parseMoves } from '@/lib/core/notation'
import { applyMoves } from '@/lib/core/turn'
import { CUBE_HOLDS } from '@/lib/core/hold'
import { arrowsOf } from '@/lib/teach/scene'
import { tutorialFor } from '@/lib/tutorials/registry'
import { stepOf } from './cube3Fixture'

describe('the white cross, by its figures', () => {
  /** The first two layers solved, the top as a few turns leave it. */
  const top = (moves: string) => {
    const cube = applyMoves(solvedCube('3'), parseMoves(moves))
    return { cube, step: stepOf(cube) }
  }

  it('reads a line held across, an L held back left, a dot, each by one formula', () => {
    const formula = parseMoves("F R U R' U' F'")
    // F R U R' U' F' turns a cross into a line; its inverse back.
    const line = top("F U R U' R' F'")
    expect(line.step).toMatchObject({ key: 'stepTutorialTopCross', figure: 'figureLine' })
    const held = line.step.formula(null)!.map((m) => CUBE_HOLDS.inHold(line.step.hold(null), m))
    expect(held).toEqual(formula)
    // An arrow for each edge moved whose white ends up: the line's two
    // missing edges among them.
    const arrows = arrowsOf(line.cube, line.step.formula(null)!, line.step, null)
    expect(arrows.length).toBeGreaterThanOrEqual(2)
    for (const arrow of arrows) expect(arrow.toNormal).toEqual([0, 1, 0])
    // Played, the line becomes the cross: the stage is done.
    const after = tutorialFor('3', 'beginner')!.stepOf(
      applyMoves(line.cube, line.step.formula(null)!),
    )
    expect(after?.key).not.toBe('stepTutorialTopCross')
  })

  it('takes any top to the cross in three formulas at most', () => {
    for (const moves of [
      "F R U R' U' F'",
      "F R U R' U' F' U F R U R' U' F'",
      "R U2 R2 F R F' U2 R' F R F'",
    ]) {
      let { cube, step } = top(moves)
      for (let k = 0; step.key === 'stepTutorialTopCross'; k++) {
        expect(k).toBeLessThan(3)
        expect(['figureDot', 'figureL', 'figureLine']).toContain(step.figure)
        cube = applyMoves(cube, step.formula(null)!)
        step = stepOf(cube)
      }
      expect(step.key).not.toBe('stepTutorialTopCross')
    }
  })
})
