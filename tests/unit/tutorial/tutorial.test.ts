import { describe, expect, it } from 'vitest'
import { FACE_COLOR, isSolved, solvedCube } from '@/lib/core/cube'
import { formatMoves, parseMoves } from '@/lib/core/moves'
import { colorAt, hasColors } from '@/lib/core/pieces'
import { applyMoves } from '@/lib/core/turn'
import type { Cube, Move } from '@/lib/core/types'
import {
  crossDone,
  edgePlaced,
  firstLayerDone,
  secondLayerDone,
} from '@/lib/methods/standard/layers3'
import { centersHome } from '@/lib/methods/standard/recenter'
import { formulaUnderWay, keepsPlaced } from '@/lib/tutorial/keep'
import { CUBE_HOLDS } from '@/lib/core/hold'
import { SIDES } from '@/lib/solve/solverKit'
import {
  arrowsOf,
  formulaSegments,
  markerPath,
  occupantOf,
  pieceColors,
  tonesOf,
  tutorialFor,
  type TutorialStep,
} from '@/lib/tutorial/tutorial'

const Y = FACE_COLOR.D
const SCRAMBLE = parseMoves("R U F' L2 D B' R2 U' F L D2 B")
const scrambled = applyMoves(solvedCube('3'), SCRAMBLE)
const stepOf = (cube: Cube, begun?: Cube): TutorialStep => tutorialFor('3')!.stepOf(cube, begun)!

describe('tutorial registry', () => {
  it('has the 3x3 only', () => {
    expect(tutorialFor('3')).toBeDefined()
    expect(tutorialFor('2')).toBeUndefined()
    expect(tutorialFor('4')).toBeUndefined()
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
    const tutorial = tutorialFor('3')!
    const underWay = (manual: Move[]) => {
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
        const step = tutorialFor('3')!.stepOf(cube)
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
      const step = tutorialFor('3')!.stepOf(top)
      if (step?.key === key) expect(step.stage).toBe(stage)
      top = walk(top, key)
    }
    expect(isSolved(top)).toBe(true)
    expect(tutorialFor('3')!.stepOf(top)).toBeNull()
    expect(tutorialFor('3')!.stepOf(solvedCube('3'))).toBeNull()
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
    const after = tutorialFor('3')!.stepOf(applyMoves(line.cube, line.step.formula(null)!))
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

describe('a formula read as taught', () => {
  const trigger = parseMoves("R U R' U'")
  const insert = [parseMoves("U R U' R'"), parseMoves("U' F' U F")]

  it('tells a sequence learnt repeated once, with its count', () => {
    expect(formulaSegments(parseMoves("U2 R U R' U' R U R' U' R U R' U'"), [[trigger]])).toEqual([
      { kind: 'moves', moves: parseMoves('U2'), times: 1 },
      { kind: 'sequence', moves: trigger, times: 3 },
    ])
  })

  it('knows a sequence learnt played from another side (an edge lifted out)', () => {
    // The insertion held from the left: U L U' L' U' F' U F... read as held.
    const lift = insert.flat().map((m) => CUBE_HOLDS.played('L', m))
    const segments = formulaSegments([...lift, ...parseMoves('U2'), ...insert.flat()], [insert])
    // Each insertion told gesture by gesture.
    expect(segments.map((s) => [s.kind, s.moves.length])).toEqual([
      ['sequence', 4],
      ['sequence', 4],
      ['moves', 1],
      ['sequence', 4],
      ['sequence', 4],
    ])
  })

  it('leaves a formula with no sequence learnt as moves', () => {
    expect(formulaSegments(parseMoves("R U F'"))).toEqual([
      { kind: 'moves', moves: parseMoves("R U F'"), times: 1 },
    ])
  })
})

describe('what a formula does to the pieces', () => {
  const step = stepOf(scrambled)
  const pick = step.suggestion!
  const moves = step.formula(pick)!

  it('tells the piece aimed at, the one in its way, the moved and the still', () => {
    const tones = tonesOf(scrambled, moves, pick, step.placed)
    expect(tones[pick.piece]).toBe('target')
    const occupant = occupantOf(scrambled, pick)
    if (occupant !== null) expect(tones[occupant]).toBe('slot')
    for (const p of step.placed) expect(tones[p]).toBe('placed')
    expect(tones).toContain('moved')
    // The centers never move under outer turns.
    const centers = scrambled.flatMap((c, i) => (c.stickers.length === 1 ? [i] : []))
    for (const c of centers) expect(tones[c]).toBe('still')
  })

  it('follows the marker sticker from its face to the one it lands on', () => {
    const path = markerPath(scrambled, moves, pick, Y)
    expect(path.from).toEqual(scrambled[pick.piece]!.position)
    expect(path.to).toEqual(pick.slot)
    expect(path.toNormal).toEqual([0, -1, 0])
  })

  it('names a piece by its colors, the marker first', () => {
    const colors = pieceColors(scrambled, pick.piece, Y)
    expect(colors[0]).toBe(Y)
    expect(hasColors(scrambled[pick.piece]!, colors)).toBe(true)
  })

  it('finds no one in the way of a piece already at its place', () => {
    expect(
      occupantOf(scrambled, { piece: pick.piece, slot: scrambled[pick.piece]!.position }),
    ).toBeNull()
  })
})
