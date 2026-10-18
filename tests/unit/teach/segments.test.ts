import { describe, expect, it } from 'vitest'
import { parseMoves } from '@/lib/core/moves'
import { CUBE_HOLDS } from '@/lib/core/hold'
import { formulaSegments } from '@/lib/teach/segments'

describe('a formula read as taught', () => {
  const trigger = parseMoves("R U R' U'")
  const insert = [parseMoves("U R U' R'"), parseMoves("U' F' U F")]

  it('tells a sequence learnt repeated once, with its count', () => {
    expect(formulaSegments(parseMoves("U2 R U R' U' R U R' U' R U R' U'"), [[trigger]])).toEqual([
      { kind: 'moves', moves: parseMoves('U2'), times: 1 },
      { kind: 'sequence', moves: trigger, times: 3 },
    ])
  })

  it('knows a sequence learnt played from another side (an edge lifted out)', () => {
    // The insertion held from the left: U L U' L' U' F' U F... read as held.
    const lift = insert.flat().map((m) => CUBE_HOLDS.played('L', m))
    const segments = formulaSegments([...lift, ...parseMoves('U2'), ...insert.flat()], [insert])
    // Each insertion told gesture by gesture.
    expect(segments.map((s) => [s.kind, s.moves.length])).toEqual([
      ['sequence', 4],
      ['sequence', 4],
      ['moves', 1],
      ['sequence', 4],
      ['sequence', 4],
    ])
  })

  it('leaves a formula with no sequence learnt as moves', () => {
    expect(formulaSegments(parseMoves("R U F'"))).toEqual([
      { kind: 'moves', moves: parseMoves("R U F'"), times: 1 },
    ])
  })
})
