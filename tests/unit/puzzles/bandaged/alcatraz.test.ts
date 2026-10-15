import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { allTurnsOf } from '@/lib/core/moveSet'
import { formsOfBlocks } from '@/lib/puzzles/bandaged/bonds'
import {
  ALCATRAZ_PLAN,
  BARS_LEFT,
  BARS_RIGHT,
  CYCLE,
  Q,
  TWIST_BACK,
  TWIST_FRONT,
} from '@/lib/methods/bandaged/alcatraz'
import { effect } from './pageEffect'

const SOLVED = solvedCube('alcatraz')

describe('Alcatraz', () => {
  it('has its 1449 forms', () => {
    expect(formsOfBlocks(SOLVED)).toHaveLength(1449)
  })

  it('plays each formula of its method, as its effect says', () => {
    expect(effect('alcatraz', BARS_RIGHT)).toEqual([
      '(AD)->(PD)',
      '(BAD)->(BPD)',
      '(BPD)->(BAD)',
      '(HA)->(HD)',
      '(HAG)->(HPD)',
      '(HD)->(HA)',
      '(HPD)->(HAG)',
      '(PD)->(AD)',
    ])
    expect(effect('alcatraz', BARS_LEFT)).toEqual([
      '(AD)->(AG)',
      '(AG)->(AD)',
      '(BAD)->(BAG)',
      '(BAG)->(BAD)',
      '(HA)->(HD)',
      '(HAD)->(HAG)',
      '(HAG)->(HAD)',
      '(HD)->(HA)',
    ])
    expect(effect('alcatraz', CYCLE)).toEqual(['(HAD)->(HPD)', '(HAG)->(HAD)', '(HPD)->(HAG)'])
    expect(effect('alcatraz', Q)).toEqual([
      '(HA)\u00b0',
      '(HAD)\u00b0',
      '(HAG)\u00b0',
      '(HD)\u00b0',
      '(HPD)\u00b0',
    ])
    expect(effect('alcatraz', TWIST_FRONT)).toEqual(['(HAD)\u00b0', '(HAG)\u00b0'])
    expect(effect('alcatraz', TWIST_BACK)).toEqual(['(HAG)\u00b0', '(HPD)\u00b0'])
  })

  it('solves with the turns it has, at every step', () => {
    const turns = allTurnsOf('alcatraz').generators.map((m) => ('face' in m ? m.face : ''))
    for (const step of ALCATRAZ_PLAN) {
      expect(step.moves.generators.map((m) => ('face' in m ? m.face : ''))).toEqual(turns)
    }
  })
})
