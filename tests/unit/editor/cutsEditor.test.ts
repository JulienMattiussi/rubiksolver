import { describe, expect, it } from 'vitest'
import { isBoxed, solvedCube } from '@/lib/core/cube'
import { parseMoves } from '@/lib/core/moves'
import { applyMoves } from '@/lib/core/turn'
import { lookOf } from '@/lib/editor/forms'
import {
  boxCuts,
  cutPieces,
  cutsOf,
  entersCuts,
  formOfCuts,
  nextCut,
  wholeCount,
} from '@/lib/editor/cutsEditor'

const SOLVED = solvedCube('fashion')

describe('cutsEditor (the Fashion-V entered by its halves)', () => {
  it('starts from the box: every pair lying, four whole edges', () => {
    expect(entersCuts('fashion')).toBe(true)
    expect(entersCuts('3')).toBe(false)
    expect(boxCuts()).toEqual(cutsOf(SOLVED))
    expect(wholeCount(boxCuts())).toBe(4)
    expect(isBoxed(formOfCuts(boxCuts())!)).toBe(true)
  })

  it('goes round a cell’s ways: a corner its three cuts, an edge its two and whole', () => {
    let cuts = boxCuts()
    const corner = ['1', '0', '2', '1']
    for (const want of corner.slice(1)) {
      cuts = nextCut(cuts, '1,1,1')
      expect(String(cuts['1,1,1'])).toBe(want)
    }
    cuts = boxCuts()
    const edge = [1, 0, 9, 1]
    for (const want of edge.slice(1)) {
      cuts = nextCut(cuts, '1,1,0')
      expect(cuts['1,1,0']).toBe(want)
    }
  })

  it('finds a state standing as entered', () => {
    const stood = applyMoves(SOLVED, parseMoves('Rw Uw Fw2 Lw'))
    const form = formOfCuts(cutsOf(stood))!
    expect(cutsOf(form)).toEqual(cutsOf(stood))
    expect(lookOf(form)).toBe(lookOf(stood))
    // Drawn while entered: a piece in every place of the form.
    expect(
      cutPieces(cutsOf(stood))
        .map((c) => c.position.join())
        .sort(),
    ).toEqual(
      stood
        .filter((c) => c.stickers.length)
        .map((c) => c.position.join())
        .sort(),
    )
  })

  it('refuses halves no turn can stand so', () => {
    // A single corner standing on its side: its cut turns with two others.
    expect(formOfCuts(nextCut(boxCuts(), '1,1,1'))).toBeNull()
    // Five whole edges.
    expect(formOfCuts(nextCut(nextCut(boxCuts(), '1,1,0'), '1,1,0'))).toBeNull()
  })
})
