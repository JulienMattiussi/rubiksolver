import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { scrambleTurns } from '@/lib/core/moves'
import { FACE_NORMAL } from '@/lib/core/geometry'
import { formatMoves, parseMoves } from '@/lib/core/notation'
import { applyMoves } from '@/lib/core/turn'
import { arrowsOf, occupantOf, tonesOf } from '@/lib/teach/scene'
import { tutorialFor } from '@/lib/tutorials/registry'
import { methodsFor } from '@/lib/solve/solver'
import { seededRng } from '../../helpers'
import { expectSteady, expectTexts, walk } from './walk'

const tutorial = tutorialFor('223', 'cornersFirst')!
const SOLVED = solvedCube('223')

describe('Slim Tower (2x2x3) tutorial', () => {
  it('has three stages: the bottom corners, the top ones, the middle edges', () => {
    expect(tutorial.stageKeys).toEqual(['stepSlimBottom', 'stepSlimTop', 'stepSlimEdges'])
  })

  it('walks every scramble to the solve, never going back', () => {
    const rng = seededRng(3)
    for (let k = 0; k < 8; k++) {
      const scrambled = applyMoves(SOLVED, scrambleTurns('223', 20, rng, SOLVED))
      const { steps, cube } = walk(tutorial, scrambled, 40)
      expect(isSolved(cube)).toBe(true)
      expectSteady(steps)
    }
  })

  it('reads the tower the way keeping its corners placed: a bottom turned, or built on top', () => {
    for (const moves of ['D', 'R2 L2 U']) {
      const cube = applyMoves(SOLVED, parseMoves(moves))
      expect(tutorial.stepOf(cube)?.key).toBe('stepSlimTop')
    }
    // Its sides told as held so: green no longer in front once D turned.
    const turned = applyMoves(SOLVED, parseMoves('D'))
    expect(tutorial.faceColor(turned, FACE_NORMAL.F)?.color).not.toBe('G')
    expect(tutorial.faceColor(SOLVED, FACE_NORMAL.F)?.color).toBe('G')
  })

  it('plays formula 2 as its manual prints it, the tower then read turned a quarter', () => {
    const rng = seededRng(3)
    const scrambled = applyMoves(SOLVED, scrambleTurns('223', 20, rng, SOLVED))
    const { steps, cube } = walk(tutorial, scrambled, 40)
    const played = steps.map((s) => formatMoves(s.formula(s.suggestion)!))
    expect(played).toContain("U2 F2 R2 U R2 Uw' R2 D R2 U' R2 U'")
    expect(isSolved(cube)).toBe(true)
    // Its pick's place marked where it lands, the tower turned: the piece
    // standing there the one named, the arrow ending there.
    const step = steps[played.indexOf("U2 F2 R2 U R2 Uw' R2 D R2 U' R2 U'")]!
    const before = walk(tutorial, scrambled, steps.indexOf(step)).cube
    const pick = step.suggestion!
    const moves = step.formula(pick)!
    const lands = applyMoves(before, moves)[pick.piece]!.position
    expect(lands).not.toEqual(pick.slot)
    const occupant = occupantOf(before, pick, moves)!
    expect(before[occupant]!.position).toEqual(lands)
    expect(tonesOf(before, moves, pick, step.placed)[occupant]).toBe('slot')
    expect(arrowsOf(before, moves, step, pick)[0]!.to).toEqual(lands)
  })

  it('names its pieces corners and edges, its sides by the color they will be', () => {
    const kinds = SOLVED.map((c) => tutorial.pieceKind(c))
    expect(kinds.filter((k) => k === 'corner')).toHaveLength(8)
    expect(kinds.filter((k) => k === 'edge')).toHaveLength(4)
    expect(tutorial.holding).toBe('tower')
  })

  it('says its stages and words in both languages', () => {
    expectTexts(tutorial)
  })

  it('is the method Corners then edges, listed before Equator then corners', () => {
    const ids = methodsFor('223').map((m) => m.id)
    expect(ids.indexOf('cornersFirst')).toBe(0)
    expect(ids.indexOf('equatorFirst')).toBe(1)
  })
})
