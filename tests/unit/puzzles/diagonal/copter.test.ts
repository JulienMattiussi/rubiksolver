import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { applyMoves } from '@/lib/core/turn'
import type { Cube, Vec3 } from '@/lib/core/types'
import {
  applyCopterMove,
  COPTER_TURNS,
  formatCopterMove,
  parseCopterMoves,
} from '@/lib/puzzles/diagonal/copter'
import { COPTER3_FORMULAS, COPTER_FORMULAS } from '@/lib/methods/diagonal/copter'
import { NOTATION_FR, NOTATION_US } from '@/lib/core/notation'

/** fan2cube's face letters. */
const FACE: Record<string, string> = {
  '0,1,0': 'H',
  '0,-1,0': 'B',
  '0,0,1': 'A',
  '0,0,-1': 'P',
  '-1,0,0': 'G',
  '1,0,0': 'D',
}
const ORDER = 'HBAPGD'
const faces = (p: readonly number[], keep: (v: number) => boolean) =>
  p
    .flatMap((v, i) => {
      if (!keep(v)) return []
      const unit = [0, 0, 0]
      unit[i] = Math.sign(v)
      return [FACE[unit.join()]!]
    })
    .sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b))
    .join('')

/** A slot as the page names it: a corner (HAG), an edge (HA), a center
 *  (H); a leaf or a petal by its face, then where it leans: {A:GH}. */
function nameOf(p: Vec3, scale: number): string {
  const outer = faces(p, (v) => Math.abs(v) === scale)
  const lean = faces(p, (v) => v !== 0 && Math.abs(v) !== scale)
  return lean ? `{${outer}:${lean}}` : `(${outer})`
}

/** What a formula does from the solved puzzle: `a->b` for a piece moved,
 *  `a°` for one turned in place. */
function effect(solved: Cube, scale: number, formula: string): string[] {
  const after = applyMoves(solved, parseCopterMoves(formula))
  return after
    .flatMap((c, i) => {
      const home = solved[i]!
      if (c.position.join() !== home.position.join()) {
        return [`${nameOf(home.position, scale)}->${nameOf(c.position, scale)}`]
      }
      const turned = c.stickers.some((s, k) => s.normal.join() !== home.stickers[k]!.normal.join())
      return turned ? [`${nameOf(home.position, scale)}°`] : []
    })
    .sort()
}

const COPTER = solvedCube('copter')
const COPTER3 = solvedCube('copter3')

/** The orbits of the pieces `kind` keeps, by size. */
function orbitSizes(solved: Cube, kind: (p: Vec3) => boolean): number[] {
  const seen = new Set<string>()
  const sizes: number[] = []
  for (const start of solved.map((c) => c.position).filter(kind)) {
    if (seen.has(start.join())) continue
    let frontier: Cube = [{ position: start, stickers: [] }]
    seen.add(start.join())
    let size = 1
    while (frontier.length) {
      frontier = frontier.flatMap((c) =>
        COPTER_TURNS.flatMap((turn) => {
          const [next] = applyCopterMove([c], turn)
          if (seen.has(next!.position.join())) return []
          seen.add(next!.position.join())
          size++
          return [next!]
        }),
      )
    }
    sizes.push(size)
  }
  return sizes
}

describe('Curvy Copter', () => {
  it('turns an edge: it pivots, its two corners swap, four leaves cross', () => {
    expect(effect(COPTER, 4, 'A')).toEqual([
      '(HA)°',
      '(HAD)->(HAG)',
      '(HAG)->(HAD)',
      '{A:HD}->{H:AG}',
      '{A:HG}->{H:AD}',
      '{H:AD}->{A:HG}',
      '{H:AG}->{A:HD}',
    ])
  })

  it('keeps its leaves in four orbits of six, one of each color', () => {
    expect(
      orbitSizes(
        COPTER,
        (p) =>
          p.every((v) => Math.abs(v) === 2 || Math.abs(v) === 4) &&
          p.some((v) => Math.abs(v) === 2),
      ),
    ).toEqual([6, 6, 6, 6])
  })

  it('does what fan2cube.fr says of each formula', () => {
    const corners = (f: string) =>
      effect(COPTER, 4, f).filter((e) => e.startsWith('(') && !/^\(..\)/.test(e))
    // (HAG) -> (HPD) -> (HDA) = (DA)².
    expect(corners(COPTER_FORMULAS.corners[0]!)).toEqual([
      '(HAD)->(HAG)',
      '(HAG)->(HPD)',
      '(HPD)->(HAD)',
    ])
    // Two corners turned, the others kept: (DA)².G(DP)²G.
    expect(corners(COPTER_FORMULAS.twist)).toEqual(['(HAD)°', '(HAG)°'])
    // {HDA} -> {HAG} -> {HPD} = (DEAE)², nothing else.
    expect(effect(COPTER, 4, COPTER_FORMULAS.leaves[0]!)).toEqual([
      '{A:HG}->{D:HP}',
      '{D:HP}->{H:AD}',
      '{H:AD}->{A:HG}',
    ])
  })

  it('writes its turns as fan2cube does, or by the edge’s faces', () => {
    const [turn] = parseCopterMoves("A'")
    expect(formatCopterMove(turn!, NOTATION_FR)).toBe('A')
    expect(formatCopterMove(turn!, NOTATION_US)).toBe('UF')
    expect(parseCopterMoves('((AD)² E)4')).toHaveLength(20)
  })
})

describe('Curvy Copter III', () => {
  it('turns an edge: two centers and six petals go too', () => {
    const moved = effect(COPTER3, 6, 'A')
    expect(moved.filter((e) => /^\(.\)/.test(e))).toEqual(['(A)->(H)', '(H)->(A)'])
    expect(moved.filter((e) => /^\{.:.\}/.test(e))).toHaveLength(6)
  })

  it('keeps its leaves in four orbits of six, its petals in one', () => {
    expect(orbitSizes(COPTER3, (p) => p.every((v) => v !== 0))).toEqual([8, 6, 6, 6, 6])
    expect(
      orbitSizes(
        COPTER3,
        (p) => p.filter((v) => v !== 0).length === 2 && p.some((v) => Math.abs(v) === 2),
      ),
    ).toEqual([24])
  })

  it('does what fan2cube.fr says of each formula', () => {
    const of = (f: string, kind: RegExp) => effect(COPTER3, 6, f).filter((e) => kind.test(e))
    const CENTER = /^\(.\)/
    const CORNER = /^\(...\)/
    const LEAF = /^\{.:..\}/
    const PETAL = /^\{.:.\}/
    // (H) -> (A) -> (D) = (DA)².
    expect(of(COPTER3_FORMULAS.centers![0]!, CENTER)).toEqual(['(A)->(D)', '(D)->(H)', '(H)->(A)'])
    // (HGP) -> (HAG) -> (HPD) = (DADP)², and Q = (PGPD)²(PDPG)², the
    // centers kept; Q alone, nothing else.
    expect(of(COPTER3_FORMULAS.corners[0]!, CORNER)).toEqual([
      '(HAG)->(HPD)',
      '(HPD)->(HPG)',
      '(HPG)->(HAG)',
    ])
    expect(of(COPTER3_FORMULAS.corners[0]!, CENTER)).toEqual([])
    expect(effect(COPTER3, 6, COPTER3_FORMULAS.corners[1]!)).toEqual([
      '(HAG)->(HPD)',
      '(HPD)->(HPG)',
      '(HPG)->(HAG)',
    ])
    // Two corners turned: (DADP)²(ADAG)².
    expect(of(COPTER3_FORMULAS.twist, CORNER)).toEqual(['(HPD)°', '(HPG)°'])
    // V = ((AD)²E)4, a 3-cycle of leaves alone; T and X, of petals alone.
    expect(effect(COPTER3, 6, COPTER3_FORMULAS.leaves[1]!)).toEqual([
      '{A:HG}->{H:AD}',
      '{D:HP}->{A:HG}',
      '{H:AD}->{D:HP}',
    ])
    // {HAG} -> {HDA} -> {HPD} = (AEDE)², the petals stirred (placed after).
    expect(of(COPTER3_FORMULAS.leaves[0]!, LEAF)).toHaveLength(3)
    for (const f of COPTER3_FORMULAS.petals!) {
      const moved = effect(COPTER3, 6, f)
      expect(moved).toHaveLength(3)
      expect(moved.every((e) => PETAL.test(e))).toBe(true)
    }
  })
})
