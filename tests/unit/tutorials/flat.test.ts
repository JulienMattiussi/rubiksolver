import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube, stateKey } from '@/lib/core/cube'
import { movesFor } from '@/lib/core/moves'
import type { CubeShape } from '@/lib/core/shapes'
import { applyMove, applyMoves } from '@/lib/core/turn'
import type { Cube } from '@/lib/core/types'
import { FLIP_MIDDLE } from '@/lib/tutorials/flat/cube123'
import { tutorialFor } from '@/lib/tutorials/registry'

import { expectTexts } from './walk'

/** Every state a flat puzzle reaches (96 and 192: all of them). */
function everyState(shape: CubeShape): Cube[] {
  const solved = solvedCube(shape)
  const seen = new Map([[stateKey(solved), solved]])
  let frontier = [solved]
  while (frontier.length) {
    const next: Cube[] = []
    for (const cube of frontier) {
      for (const move of movesFor(shape)) {
        const turned = applyMove(cube, move)
        if (seen.has(stateKey(turned))) continue
        seen.set(stateKey(turned), turned)
        next.push(turned)
      }
    }
    frontier = next
  }
  return [...seen.values()]
}

describe.each([
  ['123', 96, ['stepTutorialFlatCorners', 'stepTutorialFlatEdge']],
  ['331', 192, ['stepTutorialFloppyCorners', 'stepTutorialFloppyEdges']],
] as const)('%s tutorial', (shape, states, stages) => {
  const tutorial = tutorialFor(shape, 'cornersFirst')!

  it('places the corners, then flips edges', () => {
    expect(tutorial.stageKeys).toEqual(stages)
  })

  it('walks every state to the solve, in short formulas', () => {
    const all = everyState(shape)
    expect(all).toHaveLength(states)
    for (const start of all) {
      let cube = start
      for (let n = 0; n < 12 && !isSolved(cube); n++) {
        const step = tutorial.stepOf(cube)!
        const moves = step.formula(step.suggestion)!
        expect(moves, step.key).not.toBeNull()
        // A corner in five half turns at most (those placed by chance kept);
        // the last one comes with the one before.
        if (step.kind === 'pieces') {
          expect(moves.length).toBeLessThanOrEqual(5)
          expect(step.progress!.done).toBeLessThan(3)
        }
        cube = applyMoves(cube, moves)
      }
      expect(isSolved(cube)).toBe(true)
    }
  })

  it('names a piece by its rim, the big faces aside', () => {
    const corner = solvedCube(shape).find((c) => tutorial.pieceKind(c) === 'corner')!
    expect(tutorial.outside!(corner)).toHaveLength(2)
  })

  it('says its own stages and words in both languages', () => {
    expectTexts(tutorial)
  })
})

it('flips the 1x2x3’s bottom edge with U2 L2 U2 R2 D2 R2, nothing else', () => {
  const solved = solvedCube('123')
  const after = applyMoves(solved, FLIP_MIDDLE)
  const changed = after.flatMap((c, i) =>
    c.position.join() === solved[i]!.position.join() &&
    c.stickers.every((s, j) => s.normal.join() === solved[i]!.stickers[j]!.normal.join())
      ? []
      : [c.position.join()],
  )
  expect(changed).toEqual(['0,-1,0'])
})
