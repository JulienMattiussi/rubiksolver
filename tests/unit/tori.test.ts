import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/cube'
import {
  CYCLE,
  CYCLE_BACK,
  DOWN,
  PLACE_LEFT,
  PLACE_RIGHT,
  RAISE,
  TURN_OVER,
  TURN_TWO,
} from '@/lib/methods/tori'
import { applyMoves } from '@/lib/turn'
import type { Move, Vec3 } from '@/lib/types'
import { validateCube } from '@/lib/validate'

const SOLVED = solvedCube('tori')

/** fan2cube's names of the slots: H B A P G D = U D F B L R. */
const LETTER: Record<string, string> = {
  '0,1,0': 'H',
  '0,-1,0': 'B',
  '0,0,1': 'A',
  '0,0,-1': 'P',
  '-1,0,0': 'G',
  '1,0,0': 'D',
}
const ORDER = 'HBAPGD'
const nameOf = (p: Vec3) =>
  p
    .flatMap((v, a) => {
      const unit = [0, 0, 0]
      unit[a] = v
      return v ? [LETTER[unit.join()]!] : []
    })
    .sort((x, y) => ORDER.indexOf(x) - ORDER.indexOf(y))
    .join('')

/** What a formula does to the edges, as the page writes it: (HA)->(BA)
 *  for an edge moved, (BA)° for one turned over in place. */
function effect(moves: readonly Move[]): string[] {
  const after = applyMoves(SOLVED, moves)
  return after
    .flatMap((c, i) => {
      const home = SOLVED[i]!
      if (c.stickers.length !== 2) return []
      if (c.position.join() !== home.position.join()) {
        return [`(${nameOf(home.position)})->(${nameOf(c.position)})`]
      }
      const turned = c.stickers.some((s, k) => s.normal.join() !== home.stickers[k]!.normal.join())
      return turned ? [`(${nameOf(home.position)})°`] : []
    })
    .sort()
}

describe('Tori', () => {
  it('is a 3x3 without corners: 6 centers, 12 edges, the core', () => {
    expect(SOLVED.filter((c) => c.stickers.length === 2)).toHaveLength(12)
    expect(SOLVED.filter((c) => c.stickers.length === 3)).toHaveLength(0)
  })

  it('brings an edge down with A², up from the equator with DHD’', () => {
    expect(effect(DOWN)).toContain('(HA)->(BA)')
    expect(effect(RAISE)).toContain('(AD)->(HA)')
  })

  it('turns the bottom front edge over with BDB’A, the bottom kept but for it', () => {
    const fx = effect(TURN_OVER)
    expect(fx).toContain('(BA)°')
    expect(fx.filter((e) => e.startsWith('(B'))).toEqual(['(BA)°'])
  })

  it('places a middle edge from the top with [H’A’] or [HD], and nothing else moves below', () => {
    expect(effect(PLACE_LEFT)).toEqual(['(AD)->(HG)', '(HA)->(AD)', '(HG)->(HA)'])
    expect(effect(PLACE_RIGHT)).toEqual(['(AD)->(HP)', '(HD)->(AD)', '(HP)->(HD)'])
  })

  it('turns the top edges with A[HD]A’H’, cycles them with the two 3-cycles', () => {
    expect(effect(TURN_TWO).every((e) => e.startsWith('(H'))).toBe(true)
    expect(effect(CYCLE)).toEqual(['(HA)->(HG)', '(HD)->(HA)', '(HG)->(HD)'])
    expect(effect(CYCLE_BACK)).toEqual(['(HD)->(HP)', '(HG)->(HD)', '(HP)->(HG)'])
  })

  it('rejects a single edge turned over', () => {
    const flipped = SOLVED.map((c) =>
      c.position.join() === '0,1,1'
        ? { ...c, stickers: c.stickers.map((s, i) => ({ ...s, color: c.stickers[1 - i]!.color })) }
        : c,
    )
    expect(validateCube(flipped)).toMatchObject({ ok: false, error: 'impossible' })
  })
})
