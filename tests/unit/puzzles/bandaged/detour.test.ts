import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { allTurnsOf } from '@/lib/core/moveSet'
import { formsOfBlocks } from '@/lib/puzzles/bandaged/bonds'
import {
  MIDDLE,
  CORNERS,
  DETOUR_PLAN,
  DOWN,
  DOWN_RIGHT,
  J,
  START,
  TWIST,
} from '@/lib/methods/bandaged/detour'
import { effect } from './pageEffect'

const SOLVED = solvedCube('detour')

describe('Detour', () => {
  it('has its 4732 forms', () => {
    expect(formsOfBlocks(SOLVED)).toHaveLength(4732)
  })

  it('plays each formula of its method from START, as its effect says', () => {
    expect(effect('detour', DOWN, START)).toEqual([
      '(AD)->(HD)',
      '(BAD)->(HAD)',
      '(HA)->(AD)',
      '(HAD)->(BAD)',
      '(HAG)->(HPD)',
      '(HD)->(HA)',
      '(HPD)->(HAG)',
    ])
    expect(effect('detour', DOWN_RIGHT, START)).toEqual([
      '(AD)->(HP)',
      '(BAD)->(HAD)',
      '(HAD)->(BAD)',
      '(HD)->(AD)',
      '(HP)->(HD)',
      '(HPD)->(HPG)',
      '(HPG)->(HPD)',
    ])
    expect(effect('detour', J, START)).toEqual([
      '(HA)\u00b0',
      '(HAD)->(HPG)',
      '(HAG)\u00b0',
      '(HG)->(HP)',
      '(HP)->(HG)',
      '(HPG)->(HAD)',
    ])
    expect(effect('detour', CORNERS, START)).toEqual([
      '(HAG)->(HPG)',
      '(HPD)->(HAG)',
      '(HPG)->(HPD)',
    ])
    expect(effect('detour', TWIST, START)).toEqual(['(HAG)\u00b0', '(HPG)\u00b0'])
  })

  it('inserts a top edge into the equator with each of its middle formulas', () => {
    for (const formula of MIDDLE) {
      expect(effect('detour', formula, START).some((e) => /->\((AD|AG)\)$/.test(e))).toBe(true)
    }
  })

  it('solves with the turns it has, at every step', () => {
    const turns = allTurnsOf('detour').generators.map((m) => ('face' in m ? m.face : ''))
    for (const step of DETOUR_PLAN) {
      expect(step.moves.generators.map((m) => ('face' in m ? m.face : ''))).toEqual(turns)
    }
  })
})
