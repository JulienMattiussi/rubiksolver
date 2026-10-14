import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/cube'
import { CORNER_CYCLE, CORNER_TWIST, EDGE_CYCLE, EDGE_FLIP } from '@/lib/methods/quarter'
import { parseMoves } from '@/lib/moves'
import { applyMoves, turnAllowed } from '@/lib/turn'
import type { Cube, Move } from '@/lib/types'

const SOLVED = solvedCube('quarter')

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

/** Played from the solved cube, every turn checked: what each piece does
 *  (`(HP)->(HA)`, or `(HA)°` turned in place). */
function effect(moves: readonly Move[]): string[] {
  let cube: Cube = SOLVED
  for (const m of moves) {
    expect(turnAllowed(cube, m)).toBe(true)
    cube = applyMoves(cube, [m])
  }
  expect(cube.every((c) => !c.spin)).toBe(true)
  return cube
    .flatMap((c, i) => {
      const home = SOLVED[i]!
      if (c.stickers.length < 2) return []
      if (c.position.join() !== home.position.join()) {
        return [`(${nameOf(home.position)})->(${nameOf(c.position)})`]
      }
      const turned = c.stickers.some((s, k) => s.normal.join() !== home.stickers[k]!.normal.join())
      return turned ? [`(${nameOf(home.position)})°`] : []
    })
    .sort()
}

describe('Quarter Cube', () => {
  it('turns each face a quarter, then back only', () => {
    expect(turnAllowed(SOLVED, { face: 'F', amount: 1 })).toBe(true)
    expect(turnAllowed(SOLVED, { face: 'F', amount: 3 })).toBe(false)
    expect(turnAllowed(SOLVED, { face: 'F', amount: 2 })).toBe(false)
    const turned = applyMoves(SOLVED, parseMoves('F'))
    expect(turnAllowed(turned, { face: 'F', amount: 1 })).toBe(false)
    expect(turnAllowed(turned, { face: 'F', amount: 3 })).toBe(true)
  })

  it('is solved as its colors say, its faces either way', () => {
    const marks = SOLVED.map((c) => (c.stickers.length === 1 ? { ...c, spin: 1 } : c))
    expect(isSolved(marks)).toBe(true)
  })

  /** The effect on the edges alone (two letters a slot). */
  const edges = (fx: string[]) => fx.filter((e) => /^\(\w\w\)(°|->\(\w\w\))$/.test(e))

  it('cycles three edges with A[DH]A’, (HP) -> (HA) -> (HD), the corners left to later', () => {
    expect(edges(effect(EDGE_CYCLE))).toEqual(['(HA)->(HD)', '(HD)->(HP)', '(HP)->(HA)'])
  })

  it('turns two edges over with A[DH]A’.G[HA]G’.D[HP]D’, moving none', () => {
    const fx = edges(effect(EDGE_FLIP))
    expect(fx).toHaveLength(2)
    expect(fx.every((e) => e.endsWith('°'))).toBe(true)
  })

  it('cycles three corners with [[DH], G], and turns two with [[DH]², G]', () => {
    expect(effect(CORNER_CYCLE).every((e) => e.length > 7)).toBe(true)
    expect(effect(CORNER_CYCLE).filter((e) => e.includes('->'))).toHaveLength(3)
    const twist = effect(CORNER_TWIST)
    expect(twist.filter((e) => e.includes('->'))).toEqual([])
    expect(twist).toHaveLength(2)
  })
})
