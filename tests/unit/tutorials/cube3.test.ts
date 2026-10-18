import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { formatMoves, parseMoves } from '@/lib/core/moves'
import { colorAt } from '@/lib/core/pieces'
import { applyMoves } from '@/lib/core/turn'
import type { Cube, Turn } from '@/lib/core/types'
import {
  crossDone,
  edgePlaced,
  firstLayerDone,
  secondLayerDone,
} from '@/lib/methods/standard/layers3'
import { centersHome } from '@/lib/methods/standard/recenter'
import { formulaUnderWay, keepsPlaced } from '@/lib/teach/keep'
import { CUBE_HOLDS } from '@/lib/core/hold'
import { SIDES } from '@/lib/solve/solverKit'
import { tutorialFor } from '@/lib/tutorials/registry'
import { Y, scrambled, stepOf } from './cube3Fixture'

describe('tutorial registry', () => {
  it('counts its stages, to the last', () => {
    expect(tutorialFor('3', 'beginner')!.stages).toBe(7)
    expect(tutorialFor('3', 'beginner')!.stageKeys).toEqual([
      'stepTutorialCross',
      'stepTutorialCorner',
      'stepTutorialMiddle',
      'stepTutorialTopCross',
      'stepTutorialTopEdges',
      'stepTutorialTopCorners',
      'stepTutorialTopTwist',
    ])
  })

  it('has the 3x3, for its layer-by-layer method only', () => {
    expect(tutorialFor('3', 'beginner')).toBeDefined()
    // Bound to the method it teaches: none for the 3x3's others.
    expect(tutorialFor('3', 'roux')).toBeUndefined()
    expect(tutorialFor('3', 'cfop')).toBeUndefined()
    expect(tutorialFor('2', 'optimal')).toBeUndefined()
    expect(tutorialFor('4', 'reduction')).toBeUndefined()
  })
})

describe('3x3 tutorial', () => {
  it('puts the centers back first, when a slice moved them', () => {
    const cube = applyMoves(scrambled, parseMoves('M'))
    const step = stepOf(cube)
    expect(step.key).toBe('stepRecenter')
    expect(step.stage).toBeUndefined()
    expect(centersHome(applyMoves(cube, step.formula(null)!))).toBe(true)
  })

  it('builds the yellow cross an edge at a time, its suggestion first', () => {
    const step = stepOf(scrambled)
    expect(step.key).toBe('stepTutorialCross')
    expect(step.stage).toBe(1)
    expect(step.marker).toBe(Y)
    const placed = SIDES.filter((s) => edgePlaced(scrambled, s)).length
    expect(step.progress).toEqual({ done: placed, total: 4 })
    const pick = step.suggestion!
    expect(scrambled[pick.piece]!.stickers.some((s) => s.color === Y)).toBe(true)
    const after = applyMoves(scrambled, step.formula(pick)!)
    const edge = after[pick.piece]!
    expect(edge.position).toEqual(pick.slot)
    expect(colorAt(edge, 'D')).toBe(Y)
  })

  it('takes any yellow edge to any free cross slot, the placed ones kept', () => {
    // One edge placed first, by the tutorial's own formula.
    const first = stepOf(scrambled)
    const cube = applyMoves(scrambled, first.formula(first.suggestion)!)
    const step = stepOf(cube)
    expect(step.placed).toHaveLength(step.progress!.done)
    const piece = step.pickable.at(-1)!
    const slot = step.slots(piece).at(-1)!
    const after = applyMoves(cube, step.formula({ piece, slot })!)
    expect(after[piece]!.position).toEqual(slot)
    for (const p of step.placed) expect(after[p]).toEqual(cube[p])
  })

  it('keeps the pieces placed where the step began, through turns by hand', () => {
    // Every cross step of the walk, its formula's first moves played by hand.
    let cube = scrambled
    while (!crossDone(cube)) {
      const step = stepOf(cube)
      const pick = step.suggestion!
      const moves = step.formula(pick)!
      for (let k = 1; k < moves.length; k++) {
        const midway = applyMoves(cube, moves.slice(0, k))
        const under = stepOf(midway, cube)
        expect(under.key).toBe(step.key)
        expect(under.placed).toEqual(step.placed)
        const rest = under.formula(pick)!
        expect(keepsPlaced(midway, rest, step.placed, cube)).toBe(true)
        expect(applyMoves(midway, rest)[pick.piece]!.position).toEqual(pick.slot)
      }
      cube = applyMoves(cube, moves)
    }
  })

  it('keeps a corner formula followed by hand, and mends one strayed from', () => {
    let cube = scrambled
    while (!crossDone(cube)) {
      const step = stepOf(cube)
      cube = applyMoves(cube, step.formula(step.suggestion)!)
    }
    const step = stepOf(cube)
    const pick = step.suggestion!
    const moves = step.formula(pick)!
    const tutorial = tutorialFor('3', 'beginner')!
    const underWay = (manual: Turn[]) => {
      const now = applyMoves(cube, manual)
      return formulaUnderWay(tutorial, stepOf(now, cube), pick, now, cube, manual)
    }
    // Followed: the rest of it, move for move, the formula still shown.
    for (let k = 1; k < moves.length; k++) {
      expect(underWay(moves.slice(0, k))).toEqual({
        rest: moves.slice(k),
        shown: moves,
        done: k,
      })
    }
    // Strayed (the cross turned): still lands the corner, the rest kept.
    const strayed = parseMoves('D R')
    const now = applyMoves(cube, strayed)
    const mend = underWay(strayed).rest!
    expect(keepsPlaced(now, mend, step.placed, cube)).toBe(true)
    const after = applyMoves(now, mend)
    expect(after[pick.piece]!.position).toEqual(pick.slot)
  })

  it('walks every stage, from the yellow cross to the puzzle solved', () => {
    const walk = (cube: Cube, key: string) => {
      for (let guard = 0; ; guard++) {
        expect(guard).toBeLessThan(5)
        const step = tutorialFor('3', 'beginner')!.stepOf(cube)
        if (step?.key !== key) return cube
        cube = applyMoves(cube, step.formula(step.suggestion)!)
      }
    }
    const yellow = walk(scrambled, 'stepTutorialCross')
    expect(crossDone(yellow)).toBe(true)
    expect(stepOf(yellow)).toMatchObject({ key: 'stepTutorialCorner', stage: 2 })
    const layer = walk(yellow, 'stepTutorialCorner')
    expect(firstLayerDone(layer)).toBe(true)
    expect(stepOf(layer)).toMatchObject({ key: 'stepTutorialMiddle', stage: 3 })
    const two = walk(layer, 'stepTutorialMiddle')
    expect(secondLayerDone(two)).toBe(true)
    // The last layer, stage after stage (a stage the state already meets
    // skipped), to the puzzle solved: the tutorial over.
    let top = two
    for (const [key, stage] of [
      ['stepTutorialTopCross', 4],
      ['stepTutorialTopEdges', 5],
      ['stepTutorialTopCorners', 6],
      ['stepTutorialTopTwist', 7],
    ] as const) {
      const step = tutorialFor('3', 'beginner')!.stepOf(top)
      if (step?.key === key) expect(step.stage).toBe(stage)
      top = walk(top, key)
    }
    expect(isSolved(top)).toBe(true)
    expect(tutorialFor('3', 'beginner')!.stepOf(top)).toBeNull()
    expect(tutorialFor('3', 'beginner')!.stepOf(solvedCube('3'))).toBeNull()
  })

  it('takes any middle edge to any free slot, the first layer kept', () => {
    let cube = scrambled
    while (stepOf(cube).key !== 'stepTutorialMiddle') {
      const step = stepOf(cube)
      cube = applyMoves(cube, step.formula(step.suggestion)!)
    }
    const step = stepOf(cube)
    for (const piece of step.pickable) {
      for (const slot of step.slots(piece)) {
        const moves = step.formula({ piece, slot })!
        const after = applyMoves(cube, moves)
        expect(after[piece]!.position.join()).toBe(slot.join())
        expect(keepsPlaced(cube, moves, step.placed, cube)).toBe(true)
        // Held its way, every edge goes in by one of the two insertions
        // (none when it already stands there).
        if (moves.length === 0) continue
        const held = moves.map((m) => CUBE_HOLDS.inHold(step.hold({ piece, slot }), m))
        expect(["U R U' R' U' F' U F", "U' L' U L U F U' F'"]).toContain(
          formatMoves(held.slice(-8)),
        )
      }
    }
  })

  it('takes any yellow corner to any free slot by the trigger, the rest kept', () => {
    const cross = (() => {
      let cube = scrambled
      while (!crossDone(cube)) {
        const step = stepOf(cube)
        cube = applyMoves(cube, step.formula(step.suggestion)!)
      }
      return cube
    })()
    const step = stepOf(cross)
    for (const piece of step.pickable) {
      for (const slot of step.slots(piece)) {
        const moves = step.formula({ piece, slot })!
        const after = applyMoves(cross, moves)
        expect(after[piece]!.position).toEqual(slot)
        expect(colorAt(after[piece]!, 'D')).toBe(Y)
        for (const p of step.placed) expect(after[p]).toEqual(cross[p])
        // Held with its slot front right, every corner ends on R U R' U'.
        const held = moves.map((m) => CUBE_HOLDS.inHold(step.hold({ piece, slot }), m))
        expect(held.slice(-4)).toEqual(parseMoves("R U R' U'"))
      }
    }
  })
})
