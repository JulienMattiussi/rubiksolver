import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { megaSlotAt } from '@/lib/puzzles/polyhedron/megaminx'
import {
  CORNER,
  SIDE_CORNERS,
  STAR,
  EQUATOR,
  megaFormula,
  TOP_CORNERS,
  TOP_EDGES,
  TOP_FLIP,
  TOP_TWIST,
} from '@/lib/methods/polyhedron/megaminx'
import { formatMove, NOTATION_FR } from '@/lib/core/moves'
import { applyMoves } from '@/lib/core/turn'
import type { MegaMove } from '@/lib/core/types'

const SOLVED = solvedCube('megaminx')

/** fan2cube's names of the faces, held with A in front and H above it. */
const PAGE: Record<string, string> = { U: 'H', F: 'A', R: 'D', L: 'G', BR: 'P', BL: 'b', DR: 'B' }
const name = (p: readonly number[]) =>
  megaSlotAt(p as [number, number, number])
    .map((f) => PAGE[f] ?? f)
    .sort((x, y) => 'HADGPbB'.indexOf(x) - 'HADGPbB'.indexOf(y))
    .join('')

/** What a formula does from the solved puzzle, on edges or corners:
 *  `(HA)->(HP)`, or `(HA)°` turned in place. */
function effect(formula: string, size: 2 | 3): string[] {
  const cube = applyMoves(SOLVED, megaFormula(formula))
  return cube
    .flatMap((c, i) => {
      const home = SOLVED[i]!
      if (home.stickers.length !== size) return []
      if (c.position.join() !== home.position.join()) {
        return [`(${name(home.position)})->(${name(c.position)})`]
      }
      const turned = c.stickers.some((s, k) => s.normal.join() !== home.stickers[k]!.normal.join())
      return turned ? [`(${name(home.position)})°`] : []
    })
    .sort()
}

describe('Megaminx', () => {
  it('turns a face back in five fifths', () => {
    const turn: MegaMove = { megaFace: 'BL', amount: 1 }
    expect(isSolved(applyMoves(SOLVED, [turn, turn, turn, turn]))).toBe(false)
    expect(isSolved(applyMoves(SOLVED, [turn, turn, turn, turn, turn]))).toBe(true)
  })

  it('writes its turns as fan2cube does, underlining the far faces', () => {
    expect(formatMove({ megaFace: 'F', amount: 2 }, NOTATION_FR)).toBe('A2')
    expect(formatMove({ megaFace: 'D', amount: 4 }, NOTATION_FR)).toBe("H̲'")
    expect(formatMove({ megaFace: 'DBL', amount: 3 })).toBe("DBL2'")
  })

  it('does what fan2cube.fr says of each formula', () => {
    // A.H'DH turns the edge (HA) over, its star built on H.
    expect(effect(STAR[1]!, 2)).toContain('(HA)°')
    // HDH'D' takes the corner (BAD) up to (HDA), the last of a face.
    expect(effect(SIDE_CORNERS[4]!, 3)).toContain('(ADB)->(HAD)')
    // D'B'D: (BAD) -> (HDA).
    expect(effect(CORNER[0]!, 3)).toContain('(ADB)->(HAD)')
    // [H'A'][HD]: (HD) -> (AD); [HD][H'A']: (HA) -> (AD).
    expect(effect(EQUATOR[0]!, 2)).toContain('(HD)->(AD)')
    expect(effect(EQUATOR[1]!, 2)).toContain('(HA)->(AD)')
    expect(effect(TOP_EDGES[0]!, 2)).toEqual(['(HA)->(HP)', '(HD)->(HA)', '(HP)->(HD)'])
    expect(effect(TOP_FLIP[0]!, 2)).toEqual(['(HA)°', '(HD)°'])
    expect(effect(TOP_CORNERS[0]!, 3)).toEqual(['(HAD)->(HDP)', '(HDP)->(HPb)', '(HPb)->(HAD)'])
    expect(effect(TOP_TWIST[0]!, 3)).toEqual(['(HAD)°', '(HAG)°'])
    // The last two leave the rest alone.
    for (const formula of [...TOP_CORNERS, ...TOP_TWIST]) {
      expect(effect(formula, 2)).toEqual([])
    }
  })
})
