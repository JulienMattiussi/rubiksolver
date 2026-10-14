import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/cube'
import { CRYSTAL_TURNS, megaSlotAt } from '@/lib/megaminx'
import { CRYSTAL_FORMULAS, megaFormula } from '@/lib/methods/megaminx'
import { applyMoves, turnedBy } from '@/lib/turn'

const SOLVED = solvedCube('crystal')

/** fan2cube's names of the faces, held with A in front and H above it. */
const PAGE: Record<string, string> = { U: 'H', F: 'A', R: 'D', L: 'G', BR: 'P', BL: 'b' }
const name = (p: readonly number[]) =>
  megaSlotAt(p as [number, number, number])
    .map((f) => PAGE[f] ?? f)
    .sort((x, y) => 'HADGPb'.indexOf(x) - 'HADGPb'.indexOf(y))
    .join('')

/** The pieces a formula leaves otherwise, as `(HA)->(HP)` or `(HA)°`. */
function effect(formula: string): string[] {
  const cube = applyMoves(
    SOLVED,
    megaFormula(formula).map((m) => ({ ...m, crystal: true as const })),
  )
  return cube
    .flatMap((c, i) => {
      const home = SOLVED[i]!
      if (!home.stickers.length) return []
      if (c.position.join() !== home.position.join()) {
        return [`(${name(home.position)})->(${name(c.position)})`]
      }
      const turned = c.stickers.some((s, k) => s.normal.join() !== home.stickers[k]!.normal.join())
      return turned ? [`(${name(home.position)})°`] : []
    })
    .sort()
}

describe('Pyraminx Crystal', () => {
  it('turns fifteen pieces with a face: its corners, its edges and those leaving its corners', () => {
    const turned = turnedBy(SOLVED, CRYSTAL_TURNS[0]!)
    expect(SOLVED.filter((_, i) => turned(i))).toHaveLength(15)
    expect(isSolved(applyMoves(SOLVED, Array(5).fill(CRYSTAL_TURNS[0]!)))).toBe(true)
  })

  it('does what fan2cube.fr says of its formulas on the top', () => {
    // [G'P]: three top edges; ([G'P]H')².([PG']H)²: two turned over.
    expect(effect(CRYSTAL_FORMULAS[6]!)).toEqual(['(HA)->(Hb)', '(HD)->(HA)', '(Hb)->(HD)'])
    expect(effect(CRYSTAL_FORMULAS[7]!)).toEqual(['(HA)°', '(HD)°'])
    // [HA].P'[AH]P: three top corners (and edges, put back later).
    expect(effect(CRYSTAL_FORMULAS[4]!)).toEqual(
      expect.arrayContaining(['(HAD)->(HDP)', '(HDP)->(HPb)', '(HPb)->(HAD)']),
    )
    // D'BDABA'.H'.AB'A'D'B'D.H: two top corners twisted (and edges).
    expect(effect(CRYSTAL_FORMULAS[5]!)).toEqual(expect.arrayContaining(['(HAD)°', '(HAG)°']))
  })
})
