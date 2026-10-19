import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { applyMoves } from '@/lib/core/turn'
import { emptyEdit } from '@/lib/editor/edit'
import { formatMove, movesFor } from '@/lib/core/moves'
import {
  CYCLE_EDGES,
  DESCEND_CORNER,
  DESCEND_EDGE,
  SWAP_CORNERS,
  SWAP_EDGES_BACK,
  SWAP_EDGES_RIGHT,
} from '@/lib/methods/tower/domino'
import type { Move, Vec3 } from '@/lib/core/types'

const SOLVED = solvedCube('332')

/** A Domino position as cubers name it: U/D, then F/B, then R/L. */
function nameOf([x, y, z]: Vec3): string {
  return (y > 0 ? 'U' : 'D') + (z > 0 ? 'F' : z < 0 ? 'B' : '') + (x > 0 ? 'R' : x < 0 ? 'L' : '')
}

/** What a formula moves, from the solved Domino, as `from->to`. */
function effect(moves: readonly Move[]): string[] {
  return applyMoves(SOLVED, moves)
    .flatMap((c, i) => {
      const was = SOLVED[i]!
      const same =
        c.position.join() === was.position.join() &&
        c.stickers.every((s, j) => s.normal.join() === was.stickers[j]!.normal.join())
      return same ? [] : [`${nameOf(was.position)}->${nameOf(c.position)}`]
    })
    .sort()
}

describe('Domino', () => {
  it('turns U and D freely, its sides by half turns only', () => {
    expect(movesFor('332').map((m) => formatMove(m))).toEqual([
      'U',
      'U2',
      "U'",
      'D',
      'D2',
      "D'",
      'L2',
      'R2',
      'F2',
      'B2',
    ])
  })

  it('keeps its two fixed centers pre-filled in the editor', () => {
    expect(Object.keys(emptyEdit('332'))).toHaveLength(2)
  })
})

describe('Domino formulas (from fan2cube.fr)', () => {
  it('descend a corner: UFR goes down to DFR (the top layer may move)', () => {
    expect(effect(DESCEND_CORNER)).toContain('UFR->DFR')
    expect(effect(DESCEND_CORNER).filter((e) => e.startsWith('D'))).toEqual(['DFR->UFR'])
  })

  it('swap two corners: UFR and UBR (two top edges swap along)', () => {
    expect(effect(SWAP_CORNERS)).toEqual(['UBR->UFR', 'UFR->UBR', 'UL->UR', 'UR->UL'])
  })

  it('descend an edge: UR and DR swap, nothing else', () => {
    expect(effect(DESCEND_EDGE)).toEqual(['DR->UR', 'UR->DR'])
  })

  it('cycle three top edges, or swap two, nothing else', () => {
    expect(effect(CYCLE_EDGES)).toEqual(['UB->UF', 'UF->UR', 'UR->UB'])
    expect(effect(SWAP_EDGES_RIGHT)).toEqual(['UF->UR', 'UR->UF'])
    expect(effect(SWAP_EDGES_BACK)).toEqual(['UB->UF', 'UF->UB'])
  })
})
