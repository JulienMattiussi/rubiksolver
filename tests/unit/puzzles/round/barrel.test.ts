import { describe, expect, it } from 'vitest'
import { cubeShape, isSolved, solvedCube } from '@/lib/core/cube'
import { buildCube, cubeToEdit } from '@/lib/editor/editor'
import { EDGE_CYCLE, EDGE_FLIP, EDGE_FLIP_ALONE, EQUATOR_INSERT } from '@/lib/methods/round/barrel'
import { parseMoves } from '@/lib/core/moves'
import { methodsFor } from '@/lib/solve/solver'
import { applyMoves } from '@/lib/core/turn'
import type { Cube } from '@/lib/core/types'

const SOLVED = solvedCube('barrel')

/** fan2cube's slot names: H B A P G D = U D F B L R. */
const LETTER: Record<string, string> = {
  '0,1,0': 'H',
  '0,-1,0': 'B',
  '0,0,1': 'A',
  '0,0,-1': 'P',
  '-1,0,0': 'G',
  '1,0,0': 'D',
}
const ORDER = 'HBAPGD'
const nameOf = (p: readonly number[]) =>
  p
    .flatMap((v, a) => {
      const unit = [0, 0, 0]
      unit[a] = v
      return v ? [LETTER[unit.join()]!] : []
    })
    .sort((x, y) => ORDER.indexOf(x) - ORDER.indexOf(y))
    .join('')

/** What a formula does from the solved puzzle: `(HP)->(HA)`, or `(HA)°`
 *  turned over in place. */
function effect(formula: string): string[] {
  const cube = applyMoves(SOLVED, parseMoves(formula))
  return cube
    .flatMap((c, i) => {
      const home = SOLVED[i]!
      if (c.position.join() !== home.position.join()) {
        return [`(${nameOf(home.position)})->(${nameOf(c.position)})`]
      }
      const turned = c.stickers.some((s, k) => s.normal.join() !== home.stickers[k]!.normal.join())
      return turned ? [`(${nameOf(home.position)})°`] : []
    })
    .sort()
}

/** The top front edge turned over, with the middle front right one. */
const oneFlipped: Cube = applyMoves(SOLVED, parseMoves(EDGE_FLIP_ALONE))

describe('Barrel', () => {
  it('is a 3x3 of its own', () => {
    expect(cubeShape(SOLVED)).toBe('barrel')
  })

  it('does what fan2cube.fr says of each formula', () => {
    // [HD].[H'A'] takes the top front edge down to the front right.
    expect(effect(EQUATOR_INSERT)).toContain('(AD)->(HP)')
    expect(effect(EDGE_CYCLE)).toEqual(['(HA)->(HP)', '(HD)->(HA)', '(HP)->(HD)'])
    expect(effect(EDGE_FLIP)).toEqual(['(HA)°', '(HD)°'])
    expect(effect(EDGE_FLIP_ALONE)).toEqual(['(AD)°', '(HA)°'])
  })

  it('counts a middle edge either way round', () => {
    const middle = applyMoves(SOLVED, parseMoves(EDGE_FLIP_ALONE + ' ' + EDGE_FLIP_ALONE))
    expect(isSolved(middle)).toBe(true)
    expect(isSolved(oneFlipped)).toBe(false)
    // Its middle edge alone turned over: solved as it shows.
    const back = applyMoves(oneFlipped, parseMoves(EDGE_FLIP_ALONE))
    expect(isSolved(back)).toBe(true)
  })

  it('solves a top edge turned over alone, as entered', () => {
    // Entered, its middle edges are taken the way that makes it real.
    const entered = buildCube(cubeToEdit(oneFlipped), 'barrel')
    const steps = methodsFor('barrel')[0]!.solve(entered)
    expect(steps.map((s) => s.key)).toEqual(['stepBarrelFlip'])
    expect(
      isSolved(
        applyMoves(
          entered,
          steps.flatMap((s) => [...s.moves]),
        ),
      ),
    ).toBe(true)
  })
})
