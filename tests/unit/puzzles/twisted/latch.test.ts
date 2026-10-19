import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { FACE_NORMAL } from '@/lib/core/geometry'
import { scrambleTurns } from '@/lib/core/moves'
import { parseMoves } from '@/lib/core/notation'
import { applyMoves, turnAllowed } from '@/lib/core/turn'
import type { Face } from '@/lib/core/types'
import { CORNER_CYCLE, CORNER_TWIST, LATCH_PLAN } from '@/lib/methods/twisted/latch'
import { faceWays } from '@/lib/puzzles/twisted/latch'
import { buildSteps } from '@/lib/solve/solverKit'
import { seededRng } from '../../../helpers'

const SOLVED = solvedCube('latch')
const FACES = Object.keys(FACE_NORMAL) as Face[]

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

/** What a formula does from the solved cube: (a)->(b) for a piece moved,
 *  (a)° for one turned in place. */
function effect(formula: string): string[] {
  const after = applyMoves(SOLVED, parseMoves(formula))
  return after
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

describe('Latch Cube', () => {
  it('solved, turns its top, front and left counterclockwise, the others the other way', () => {
    const ways = Object.fromEntries(FACES.map((f) => [f, faceWays(SOLVED, f)]))
    for (const f of ['U', 'F', 'L'] as const) expect(ways[f]).toEqual({ cw: false, ccw: true })
    for (const f of ['D', 'B', 'R'] as const) expect(ways[f]).toEqual({ cw: true, ccw: false })
    expect(turnAllowed(SOLVED, { face: 'U', amount: 2 })).toBe(true)
  })

  it('locks a face with arrows of both kinds on it', () => {
    // R takes the top right edge's white arrow to the back: B locks.
    const cube = applyMoves(SOLVED, parseMoves('R'))
    expect(faceWays(cube, 'B')).toEqual({ cw: false, ccw: false })
    expect(turnAllowed(cube, { face: 'B', amount: 2 })).toBe(false)
  })

  it('does what fan2cube.fr says of each formula', () => {
    // (HGP) -> (HAG) -> (HPD) = [DH] .G'[HD]G, the edges kept.
    expect(effect(CORNER_CYCLE)).toEqual(['(HAG)->(HPD)', '(HPD)->(HPG)', '(HPG)->(HAG)'])
    // (HGP)-(HAG)+ = [DH]² .G'[HD]²G, nothing else.
    expect(effect(CORNER_TWIST)).toEqual(['(HAG)°', '(HPG)°'])
  })

  it('solves its scrambles by turns that all go', () => {
    for (let seed = 1; seed <= 3; seed++) {
      const cube = applyMoves(SOLVED, scrambleTurns('latch', 30, seededRng(seed), SOLVED))
      const moves = buildSteps(cube, LATCH_PLAN).flatMap((s) => s.moves)
      let state = cube
      for (const m of moves) {
        expect(turnAllowed(state, m)).toBe(true)
        state = applyMoves(state, [m])
      }
    }
  }, 60000)
})
