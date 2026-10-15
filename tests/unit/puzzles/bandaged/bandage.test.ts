import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { allTurnsOf } from '@/lib/core/moveSet'
import { formsOfBlocks } from '@/lib/puzzles/bandaged/bonds'
import { BANDAGE_PLAN, Q, S, T, X, Y } from '@/lib/methods/bandaged/bandage'
import { effect } from './pageEffect'

const SOLVED = solvedCube('bandage')

describe('Bandage Cube', () => {
  it('has its 440 forms, as the page counts them', () => {
    expect(formsOfBlocks(SOLVED)).toHaveLength(440)
  })

  it('plays each formula of its method, as its effect says', () => {
    expect(effect('bandage', X)).toEqual([
      '(AD)->(HD)',
      '(AG)->(HA)',
      '(BAD)->(HPD)',
      '(BAG)->(HAG)',
      '(BPG)->(BAD)',
      '(HA)->(PG)',
      '(HAG)->(BPG)',
      '(HD)->(AG)',
      '(HPD)->(BAG)',
      '(PG)->(AD)',
    ])
    expect(effect('bandage', Q)).toEqual([
      '(AG)->(HA)',
      '(BAG)->(HAG)',
      '(BD)->(HD)',
      '(BPD)->(HPD)',
      '(HA)->(BD)',
      '(HAG)->(BPD)',
      '(HD)->(HP)',
      '(HP)->(AG)',
      '(HPD)->(HPG)',
      '(HPG)->(BAG)',
    ])
    expect(effect('bandage', S)).toEqual([
      '(AD)->(HP)',
      '(AG)->(HD)',
      '(BAD)->(HPG)',
      '(BAG)->(HPD)',
      '(HA)->(AG)',
      '(HAG)->(BAG)',
      '(HD)->(AD)',
      '(HP)->(HA)',
      '(HPD)->(BAD)',
      '(HPG)->(HAG)',
    ])
    expect(effect('bandage', Y)).toEqual([
      '(AD)->(HP)',
      '(BAD)->(HPG)',
      '(HA)->(AD)',
      '(HAG)->(BAD)',
      '(HP)->(HA)',
      '(HPG)->(HAG)',
    ])
    expect(effect('bandage', T)).toEqual([
      '(HA)->(HP)',
      '(HAG)->(HPG)',
      '(HD)->(HA)',
      '(HP)->(HD)',
      '(HPD)->(HAG)',
      '(HPG)->(HPD)',
    ])
  })

  it('solves with the turns it has, at every step', () => {
    const turns = allTurnsOf('bandage').generators.map((m) => ('face' in m ? m.face : ''))
    for (const step of BANDAGE_PLAN) {
      expect(step.moves.generators.map((m) => ('face' in m ? m.face : ''))).toEqual(turns)
    }
  })
})
