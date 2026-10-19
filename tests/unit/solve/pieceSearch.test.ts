import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { applyMoves } from '@/lib/core/turn'
import { parseMoves } from '@/lib/core/notation'
import { allows, moveSet } from '@/lib/core/moveSet'
import { solvePieces } from '@/lib/solve/pieceSearch'
import {
  edgesOriented,
  homeOf,
  orientationKey,
  pieces,
  piecesHome,
} from '@/lib/methods/standard/pieces3'
import { seededRng } from '../../helpers'

const SOLVED = solvedCube('3')

describe('move sets', () => {
  it('allow every amount of a layer, or only the half turn when written so', () => {
    const set = moveSet('M U2')
    expect(allows(set, parseMoves("M'")[0]!)).toBe(true)
    expect(allows(set, parseMoves('U2')[0]!)).toBe(true)
    expect(allows(set, parseMoves('U')[0]!)).toBe(false)
    expect(allows(set, parseMoves('R')[0]!)).toBe(false)
  })
})

describe('solvePieces', () => {
  it('meets in the middle: undoes a short sequence on the tracked pieces', () => {
    const cube = applyMoves(SOLVED, parseMoves("R U R' U'"))
    const block = pieces('DR FR BR DFR DBR')
    const moves = solvePieces(cube, {
      track: block.map(homeOf),
      moves: moveSet('R U'),
      maxDepth: 10,
    })
    expect(moves.length).toBeLessThanOrEqual(5)
    expect(piecesHome(applyMoves(cube, moves), block)).toBe(true)
  })

  it('only ever uses the turns it is given', () => {
    const rng = seededRng(5)
    const set = moveSet('U R F')
    for (let i = 0; i < 10; i++) {
      // Scrambled within the set, so the piece is always within reach.
      const turns = Array.from(
        { length: 20 },
        () => set.turns[Math.floor(rng() * set.turns.length)]!,
      )
      const cube = applyMoves(SOLVED, turns)
      const moves = solvePieces(cube, { track: [homeOf('DFR')], moves: set, maxDepth: 10 })
      expect(moves.every((m) => allows(set, m))).toBe(true)
      expect(piecesHome(applyMoves(cube, moves), ['DFR'])).toBe(true)
    }
  })

  it('reaches a custom goal by plain search (orient all edges)', () => {
    const cube = applyMoves(SOLVED, parseMoves('F'))
    const edges = pieces('UF UB UL UR DF DB DL DR FL FR BL BR')
    const moves = solvePieces(cube, {
      track: edges.map(homeOf),
      moves: moveSet('U D L R F B'),
      goal: edgesOriented,
      key: orientationKey,
      maxDepth: 6,
    })
    // F' undoes it, and so does F (F2 flips nothing).
    expect(moves).toHaveLength(1)
    expect(moves[0]!.face).toBe('F')
    expect(edgesOriented(applyMoves(cube, moves))).toBe(true)
  })

  it('throws when the goal is out of reach', () => {
    const cube = applyMoves(SOLVED, parseMoves('F'))
    expect(() =>
      solvePieces(cube, { track: [homeOf('UF')], moves: moveSet('U R'), maxDepth: 6 }),
    ).toThrow()
  })
})
