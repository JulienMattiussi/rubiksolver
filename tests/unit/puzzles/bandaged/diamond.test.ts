import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { allTurnsOf } from '@/lib/core/moveSet'
import { formsOfBlocks } from '@/lib/puzzles/bandaged/bonds'
import {
  MIDDLE,
  CORNERS,
  DIAMOND_PLAN,
  DOWN,
  DOWN_LEFT,
  J,
  START,
  TWIST,
} from '@/lib/methods/bandaged/diamond'
import { effect } from './pageEffect'

const SOLVED = solvedCube('diamond')

describe('Diamond', () => {
  it('has its 110 forms', () => {
    expect(formsOfBlocks(SOLVED)).toHaveLength(110)
  })

  it('plays each formula of its method from START, as its effect says', () => {
    expect(effect('diamond', DOWN, START)).toEqual([
      '(AD)->(HP)',
      '(BAD)->(HAD)',
      '(HAD)->(BAD)',
      '(HD)->(AD)',
      '(HP)->(HD)',
      '(HPD)->(HPG)',
      '(HPG)->(HPD)',
    ])
    expect(effect('diamond', DOWN_LEFT, START)).toEqual([
      '(AG)->(HD)',
      '(BAG)->(HAG)',
      '(HA)->(AG)',
      '(HAD)->(HPD)',
      '(HAG)->(BAG)',
      '(HD)->(HA)',
      '(HPD)->(HAD)',
    ])
    expect(effect('diamond', J, START)).toEqual([
      '(HA)\u00b0',
      '(HAD)->(HPG)',
      '(HAG)\u00b0',
      '(HG)->(HP)',
      '(HP)->(HG)',
      '(HPG)->(HAD)',
    ])
    expect(effect('diamond', CORNERS, START)).toEqual([
      '(HAG)->(HPG)',
      '(HPD)->(HAG)',
      '(HPG)->(HPD)',
    ])
    expect(effect('diamond', TWIST, START)).toEqual(['(HAG)\u00b0', '(HPG)\u00b0'])
  })

  it('inserts a top edge into the equator with each of its middle formulas', () => {
    for (const formula of MIDDLE) {
      expect(effect('diamond', formula, START).some((e) => /->\((AD|AG)\)$/.test(e))).toBe(true)
    }
  })

  it('solves with the turns it has, at every step', () => {
    const turns = allTurnsOf('diamond').generators.map((m) => ('face' in m ? m.face : ''))
    for (const step of DIAMOND_PLAN) {
      expect(step.moves.generators.map((m) => ('face' in m ? m.face : ''))).toEqual(turns)
    }
  })
})
