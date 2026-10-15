import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { allTurnsOf } from '@/lib/core/moveSet'
import { formsOfBlocks } from '@/lib/puzzles/bandaged/bonds'
import {
  BARS_BOTTOM,
  BARS_TOP,
  CYCLE,
  FLIP,
  QUAD_STRIPE_PLAN,
  SWAP,
  TWIST,
} from '@/lib/methods/bandaged/quadStripe'
import { effect } from './pageEffect'

const SOLVED = solvedCube('quadStripe')

describe('QuadStripe', () => {
  it('has its 580 forms, as the page counts them', () => {
    expect(formsOfBlocks(SOLVED)).toHaveLength(580)
  })

  it('plays each formula of its method, as its effect says', () => {
    expect(effect('quadStripe', BARS_TOP)).toEqual([
      '(AD)->(HD)',
      '(BAG)->(HPG)',
      '(BG)->(PG)',
      '(BPG)->(HAD)',
      '(HAD)->(BPG)',
      '(HD)->(AD)',
      '(HPG)->(BAG)',
      '(PG)->(BG)',
    ])
    expect(effect('quadStripe', BARS_BOTTOM)).toEqual([
      '(BAG)->(BPD)',
      '(BG)->(BP)',
      '(BP)->(BG)',
      '(BPD)->(BAG)',
      '(BPG)->(HAD)',
      '(HA)->(HD)',
      '(HAD)->(BPG)',
      '(HD)->(HA)',
    ])
    expect(effect('quadStripe', SWAP)).toEqual([
      '(AD)\u00b0',
      '(BPG)->(HAD)',
      '(HA)->(HD)',
      '(HAD)->(BPG)',
      '(HD)->(HA)',
    ])
    expect(effect('quadStripe', CYCLE)).toEqual([
      '(AD)->(HA)',
      '(BPG)\u00b0',
      '(HA)->(HD)',
      '(HAD)\u00b0',
      '(HD)->(AD)',
    ])
    expect(effect('quadStripe', FLIP)).toEqual(['(HA)\u00b0', '(HD)\u00b0'])
    expect(effect('quadStripe', TWIST)).toEqual(['(BPG)\u00b0', '(HAD)\u00b0'])
  })

  it('solves with the turns it has, at every step', () => {
    const turns = allTurnsOf('quadStripe').generators.map((m) => ('face' in m ? m.face : ''))
    for (const step of QUAD_STRIPE_PLAN) {
      expect(step.moves.generators.map((m) => ('face' in m ? m.face : ''))).toEqual(turns)
    }
  })
})
