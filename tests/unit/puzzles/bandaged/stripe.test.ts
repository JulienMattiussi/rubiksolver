import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { allTurnsOf } from '@/lib/core/moveSet'
import { formsOfBlocks } from '@/lib/puzzles/bandaged/bonds'
import {
  MIDDLE,
  CYCLE,
  CYCLE_CORNERS,
  DOWN,
  FLIP,
  START,
  STRIPE_PLAN,
  SWAP,
  TWIST,
} from '@/lib/methods/bandaged/stripe'
import { effect } from './pageEffect'

const SOLVED = solvedCube('stripe')

describe('Stripe', () => {
  it('has its 1296 forms', () => {
    expect(formsOfBlocks(SOLVED)).toHaveLength(1296)
  })

  it('plays each formula of its method from START, as its effect says', () => {
    expect(effect('stripe', DOWN, START)).toEqual([
      '(AD)->(HP)',
      '(BAD)->(HAD)',
      '(HAD)->(BAD)',
      '(HD)->(AD)',
      '(HP)->(HD)',
      '(HPD)->(HPG)',
      '(HPG)->(HPD)',
    ])
    expect(effect('stripe', SWAP, START)).toEqual([
      '(HA)->(HD)',
      '(HAD)\u00b0',
      '(HAG)->(HPG)',
      '(HD)->(HA)',
      '(HG)\u00b0',
      '(HPG)->(HAG)',
    ])
    expect(effect('stripe', CYCLE_CORNERS, START)).toEqual([
      '(HAD)->(HAG)',
      '(HAG)->(HPD)',
      '(HD)->(HG)',
      '(HG)->(HP)',
      '(HP)->(HD)',
      '(HPD)->(HAD)',
    ])
    expect(effect('stripe', FLIP, START)).toEqual([
      '(HAD)\u00b0',
      '(HAG)\u00b0',
      '(HD)->(HG)',
      '(HG)->(HP)',
      '(HP)->(HD)',
      '(HPD)\u00b0',
      '(HPG)\u00b0',
    ])
    expect(effect('stripe', TWIST, START)).toEqual([
      '(HA)->(HP)',
      '(HAD)\u00b0',
      '(HD)->(HA)',
      '(HP)->(HD)',
      '(HPD)\u00b0',
      '(HPG)\u00b0',
    ])
    expect(effect('stripe', CYCLE, START)).toEqual(['(HA)->(HG)', '(HD)->(HA)', '(HG)->(HD)'])
  })

  it('inserts a top edge into the equator with each of its middle formulas', () => {
    for (const formula of MIDDLE) {
      expect(effect('stripe', formula, START).some((e) => /->\((AD|AG)\)$/.test(e))).toBe(true)
    }
  })

  it('solves with the turns it has, at every step', () => {
    const turns = allTurnsOf('stripe').generators.map((m) => ('face' in m ? m.face : ''))
    for (const step of STRIPE_PLAN) {
      expect(step.moves.generators.map((m) => ('face' in m ? m.face : ''))).toEqual(turns)
    }
  })
})
