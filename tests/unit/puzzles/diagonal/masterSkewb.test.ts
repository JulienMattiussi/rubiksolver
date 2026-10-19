import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { scrambleTurns } from '@/lib/core/moves'
import { NOTATION_FR } from '@/lib/core/notation'
import { applyMoves } from '@/lib/core/turn'
import { formatRainbowMove, parseDinoMoves } from '@/lib/puzzles/shared/rainbow'
import { EDGE_CYCLES, MASTER_SKEWB_PLAN, PETAL_CYCLES } from '@/lib/methods/diagonal/masterSkewb'
import { buildSteps } from '@/lib/solve/solverKit'
import { seededRng } from '../../../helpers'

const SOLVED = solvedCube('masterSkewb')
const parse = (formula: string) => parseDinoMoves(formula, 'master')

/** fan2cube's face letters, by axis. */
const FACE: Record<string, string> = {
  '0,1,0': 'H',
  '0,-1,0': 'B',
  '0,0,1': 'A',
  '0,0,-1': 'P',
  '-1,0,0': 'G',
  '1,0,0': 'D',
}
const sign = (v: number) => Math.sign(v)
/** A petal by its face (`(D)`, the one on the top side of it), an edge by
 *  its two faces (`(HG)`): where the formulas of the page name them. */
function nameOf(p: readonly number[]): string {
  const faces = p.flatMap((v, i) => {
    if (Math.abs(v) !== 4) return []
    const axis = [0, 0, 0]
    axis[i] = sign(v)
    return [FACE[axis.join()]!]
  })
  if (faces.length === 2) return `(${faces.sort().join('')})`
  // A petal: its face, then where it leans (`(D)H` leans up).
  const leans = p.flatMap((v, i) => {
    if (Math.abs(v) !== 2) return []
    const axis = [0, 0, 0]
    axis[i] = sign(v)
    return [FACE[axis.join()]!]
  })
  return `(${faces[0]})${leans.sort().join('')}`
}

/** What a formula moves from the solved puzzle, petals then edges. */
function moved(formula: string, kind: (c: (typeof SOLVED)[number]) => boolean): string[] {
  const cube = applyMoves(SOLVED, parse(formula))
  return cube
    .flatMap((c, i) => {
      const home = SOLVED[i]!
      if (!kind(home) || c.position.join() === home.position.join()) return []
      return [`${nameOf(home.position)}->${nameOf(c.position)}`]
    })
    .sort()
}
const isEdge = (c: (typeof SOLVED)[number]) => c.stickers.length === 2
const isPetal = (c: (typeof SOLVED)[number]) =>
  c.stickers.length === 1 && c.position.filter((v) => v !== 0).length > 1
const isOther = (c: (typeof SOLVED)[number]) => !isEdge(c) && !isPetal(c)

describe('Master Skewb', () => {
  it('is 8 corners, 6 centers, 12 edges and 24 petals in two families', () => {
    expect(SOLVED.filter((c) => c.stickers.length === 3)).toHaveLength(8)
    expect(SOLVED.filter(isEdge)).toHaveLength(12)
    expect(SOLVED.filter(isPetal)).toHaveLength(24)
    const family = (p: readonly number[]) => sign(p[0]! * p[1]! * p[2]!)
    const mixed = applyMoves(SOLVED, scrambleTurns('masterSkewb', 40, seededRng(3), SOLVED))
    mixed.forEach((c, i) => {
      if (isPetal(c)) expect(family(c.position)).toBe(family(SOLVED[i]!.position))
    })
  })

  it('writes its slices in lowercase, as fan2cube.fr does', () => {
    expect(
      parse("o'(P'DP)o")
        .map((m) => formatRainbowMove(m, NOTATION_FR))
        .join(' '),
    ).toBe("o' P' D P o")
  })

  it('does what fan2cube.fr says of each formula', () => {
    // Each 3-cycles three pieces of its kind, the corners and centers kept.
    for (const [formulas, kind] of [
      [EDGE_CYCLES, isEdge],
      [PETAL_CYCLES, isPetal],
    ] as const) {
      for (const f of formulas) {
        expect(moved(f, kind)).toHaveLength(3)
        expect(moved(f, isOther)).toEqual([])
      }
    }
    // (HG) -> (HD) -> (AD), and its mirror (HP) -> (HA) -> (AD).
    expect(moved(EDGE_CYCLES[0]!, isEdge)).toEqual(['(AD)->(GH)', '(DH)->(AD)', '(GH)->(DH)'])
    expect(moved(EDGE_CYCLES[1]!, isEdge)).toEqual(['(AD)->(HP)', '(AH)->(AD)', '(HP)->(AH)'])
    // The edges' formulas keep the petals; the petals' keep the edges.
    for (const f of PETAL_CYCLES) expect(moved(f, isEdge)).toEqual([])
  })

  it('solves its petals in both families', () => {
    for (let seed = 1; seed <= 4; seed++) {
      const cube = applyMoves(SOLVED, scrambleTurns('masterSkewb', 30, seededRng(seed), SOLVED))
      expect(buildSteps(cube, MASTER_SKEWB_PLAN).length).toBeGreaterThan(0)
    }
  })
})
