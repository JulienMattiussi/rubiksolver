import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube } from '@/lib/core/cube'
import { normalIndex } from '@/lib/core/geometry'
import { methodsFor } from '@/lib/solve/solver'
import { scrambleTurns } from '@/lib/core/moves'
import { applyMoves } from '@/lib/core/turn'
import type { Cube, Move, Turn } from '@/lib/core/types'
import { CORNER_CYCLE, EDGE_FLIP, FACE_CYCLE, GEM_CYCLE } from '@/lib/methods/polyhedron/vto'
import { seededRng } from '../../../helpers'

const SOLVED = solvedCube('vto')

/** A formula as the VTO plays it: its corners turn wide (Rw), the tips
 *  alone being its outer turns. */
const asCorners = (moves: readonly Move[]): Move[] =>
  moves.map((m) => ({ ...m, depth: 2, wide: true }))

/** What a sequence does from solved: the pieces it moves (where they went)
 *  and those it turns in place. */
function effect(moves: readonly Turn[], solved: Cube = SOLVED) {
  const after = applyMoves(solved, moves)
  const moved: string[] = []
  const turned: string[] = []
  solved.forEach((c, i) => {
    const now = after[i]!
    if (now.position.join() !== c.position.join()) moved.push(c.position.join())
    else if (
      now.stickers.some((s, k) => normalIndex(s.normal) !== normalIndex(c.stickers[k]!.normal))
    )
      turned.push(c.position.join())
  })
  return { moved, turned, after }
}

describe('Octahedron VTO', () => {
  it('is 6 tips, the 6 cube centers (four triangles each) and 12 edges', () => {
    const tips = SOLVED.filter((c) => c.position.some((v) => Math.abs(v) === 2))
    expect(tips).toHaveLength(6)
    expect(SOLVED.filter((c) => c.stickers.length === 4)).toHaveLength(12)
    expect(SOLVED.filter((c) => c.stickers.length === 2)).toHaveLength(12)
  })

  it('turns a tip alone (R), or its whole corner (Rw): tip, triangles, four edges', () => {
    expect(effect([{ face: 'R', amount: 1 }]).turned).toEqual(['2,0,0'])
    const { moved, turned } = effect([{ face: 'R', amount: 1, depth: 2, wide: true }])
    expect(turned.sort()).toEqual(['1,0,0', '2,0,0'])
    expect(moved).toHaveLength(4)
  })

  it('cycles three edges of a face with [G D’] (the corner they share hidden)', () => {
    const { moved, turned } = effect(asCorners(FACE_CYCLE))
    expect(turned).toEqual([])
    expect(moved).toHaveLength(3)
    // Three edges of one face of the octahedron: around one cube corner.
    const octant = moved.map((p) => p.split(',').map(Number))
    const corner = [0, 1, 2].map((a) => Math.sign(octant.reduce((s, p) => s + p[a]!, 0)))
    for (const p of octant) {
      expect(p.every((v, a) => v === 0 || v === corner[a])).toBe(true)
    }
  })

  it('cycles three edges around a corner with G’PG.P.G’P²G', () => {
    const { moved, turned } = effect(asCorners(CORNER_CYCLE))
    expect(turned).toEqual([])
    expect(moved).toHaveLength(3)
    // All beside one corner of the octahedron: a coordinate they share.
    const edges = moved.map((p) => p.split(',').map(Number))
    expect([0, 1, 2].some((a) => edges.every((p) => p[a] === edges[0]![a] && p[a] !== 0))).toBe(
      true,
    )
  })

  it('flips two edges of a face in place with [G D’][P’ D]', () => {
    const { moved, turned } = effect(asCorners(EDGE_FLIP))
    expect(moved).toEqual([])
    expect(turned).toHaveLength(2)
  })

  it('is solved from 30 scrambles: centers, edges placed, flipped, tips', () => {
    const [method] = methodsFor('vto')
    for (let seed = 0; seed < 30; seed++) {
      const cube: Cube = applyMoves(SOLVED, scrambleTurns('vto', 25, seededRng(seed), SOLVED))
      const steps = method!.solve(cube)
      expect(
        isSolved(
          applyMoves(
            cube,
            steps.flatMap((s) => [...s.moves]),
          ),
        ),
      ).toBe(true)
    }
  })
})

describe('GEM-0 (Jewel)', () => {
  const GEM = solvedCube('gem')
  // Its edges by the page's faces: H(aut) = U, A(vant) = F, D(roite) = R,
  // P(ostérieur) = B.
  const HP = '0,1,-1'
  const HD = '1,1,0'
  const AD = '1,0,1'
  const HA = '0,1,1'

  it('is the VTO with a golden square on each corner', () => {
    const centers = GEM.filter((c) => c.stickers.length === 5)
    expect(centers).toHaveLength(6)
    expect(centers.every((c) => c.stickers.some((s) => s.color === 'C'))).toBe(true)
  })

  it('cycles (HP) -> (HD) -> (AD) with [H D], nothing else', () => {
    const { moved, turned, after } = effect(GEM_CYCLE, GEM)
    expect(turned).toEqual([])
    expect(moved.sort()).toEqual([HP, HD, AD].sort())
    const at = (home: string) =>
      after[GEM.findIndex((c) => c.position.join() === home)]!.position.join()
    expect([at(HP), at(HD), at(AD)]).toEqual([HD, AD, HP])
  })

  it('flips (HA) and (HD) in place with [A D’][H’ D]', () => {
    const { moved, turned } = effect(EDGE_FLIP, GEM)
    expect(moved).toEqual([])
    expect(turned.sort()).toEqual([HA, HD].sort())
  })
})
