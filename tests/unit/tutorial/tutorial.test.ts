import { describe, expect, it } from 'vitest'
import { FACE_COLOR, solvedCube } from '@/lib/core/cube'
import { parseMoves } from '@/lib/core/moves'
import { colorAt, hasColors } from '@/lib/core/pieces'
import { applyMoves } from '@/lib/core/turn'
import type { Cube } from '@/lib/core/types'
import { crossDone, edgePlaced } from '@/lib/methods/standard/layers3'
import { centersHome } from '@/lib/methods/standard/recenter'
import { SIDES } from '@/lib/solve/solverKit'
import {
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
const stepOf = (cube: Cube): TutorialStep => tutorialFor('3')!.stepOf(cube)!

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

  it('walks the cross to its end, then the corners are still to come', () => {
    let cube = scrambled
    for (let guard = 0; !crossDone(cube); guard++) {
      expect(guard).toBeLessThan(4)
      const step = stepOf(cube)
      cube = applyMoves(cube, step.formula(step.suggestion)!)
    }
    const next = stepOf(cube)
    expect(next.key).toBe('stepBottomCorners')
    expect(next.comingSoon).toBe(true)
    expect(next.formula(null)).toBeNull()
    // On the solved puzzle too: nothing further taught yet.
    expect(stepOf(solvedCube('3')).comingSoon).toBe(true)
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
