import { describe, expect, it } from 'vitest'
import { FACE_COLOR, solvedCube } from '@/lib/core/cube'
import { parseMoves } from '@/lib/core/moves'
import { colorAt, hasColors } from '@/lib/core/pieces'
import { applyMoves } from '@/lib/core/turn'
import type { Cube, Move } from '@/lib/core/types'
import { crossDone, edgePlaced, firstLayerDone } from '@/lib/methods/standard/layers3'
import { centersHome } from '@/lib/methods/standard/recenter'
import { formulaUnderWay, keepsPlaced } from '@/lib/tutorial/keep'
import { SIDES } from '@/lib/solve/solverKit'
import {
  formulaParts,
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

  it('walks the cross, then the corners, then the rest is still to come', () => {
    const walk = (cube: Cube, key: string) => {
      for (let guard = 0; ; guard++) {
        expect(guard).toBeLessThan(5)
        const step = stepOf(cube)
        if (step.key !== key) return cube
        cube = applyMoves(cube, step.formula(step.suggestion)!)
      }
    }
    const cross = walk(scrambled, 'stepTutorialCross')
    expect(crossDone(cross)).toBe(true)
    expect(stepOf(cross)).toMatchObject({ key: 'stepTutorialCorner', stage: 2 })
    const layer = walk(cross, 'stepTutorialCorner')
    expect(firstLayerDone(layer)).toBe(true)
    const next = stepOf(layer)
    expect(next).toMatchObject({ key: 'stepMiddle', stage: 3, comingSoon: true })
    expect(next.formula(null)).toBeNull()
    // On the solved puzzle too: nothing further taught yet.
    expect(stepOf(solvedCube('3')).comingSoon).toBe(true)
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
        // Ends on the slot's trigger, repeated: a corner's formula reads so.
        expect(formulaParts(moves).block.length % 4).toBe(0)
      }
    }
  })
})

describe('a formula read as taught', () => {
  it('shows a block it repeats once, with its count', () => {
    const parts = formulaParts(parseMoves("U2 R U R' U' R U R' U' R U R' U'"))
    expect(parts.lead).toEqual(parseMoves('U2'))
    expect(parts.block).toEqual(parseMoves("R U R' U'"))
    expect(parts.times).toBe(3)
  })

  it('leaves a formula that repeats nothing whole', () => {
    expect(formulaParts(parseMoves("R U F'"))).toEqual({
      lead: parseMoves("R U F'"),
      block: [],
      times: 0,
    })
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
