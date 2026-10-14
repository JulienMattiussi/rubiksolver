import { describe, expect, it } from 'vitest'
import { cubeShape, isSolved, solvedCube } from '@/lib/cube'
import { CORNER_TURN } from '@/lib/methods/dinoCyl'
import { parseDinoMoves } from '@/lib/rainbow'
import { applyMoves } from '@/lib/turn'
import type { RainbowMove } from '@/lib/types'

const SOLVED = solvedCube('dinoCyl')

/** The pieces a sequence moves or turns, from solved: positions, by kind. */
const moved = (moves: readonly RainbowMove[]) =>
  applyMoves(SOLVED, moves).flatMap((c, i) =>
    c.position.join() !== SOLVED[i]!.position.join() ||
    c.stickers.some((s, k) => s.normal.join() !== SOLVED[i]!.stickers[k]!.normal.join())
      ? [`${c.stickers.length === 3 ? 'corner' : 'edge'} ${SOLVED[i]!.position.join()}`]
      : [],
  )

describe('Dino Cylinder', () => {
  it('is the Dino Cube with its corners', () => {
    expect(cubeShape(SOLVED)).toBe('dinoCyl')
    expect(SOLVED.filter((c) => c.stickers.length === 3)).toHaveLength(8)
  })

  it('turns a corner in place, with its three edges', () => {
    const turn = parseDinoMoves('A')
    expect(moved(turn).sort()).toEqual(['corner 1,1,1', 'edge 0,1,1', 'edge 1,0,1', 'edge 1,1,0'])
    expect(isSolved(applyMoves(SOLVED, [...turn, ...turn, ...turn]))).toBe(true)
  })

  it('cycles three edges by [GA’] and turns a corner alone by (A)+ (fan2cube.fr)', () => {
    const cycle = moved(parseDinoMoves("[GA']"))
    expect(cycle).toHaveLength(3)
    expect(cycle.every((p) => p.startsWith('edge'))).toBe(true)
    expect(moved(CORNER_TURN)).toEqual(['corner 1,1,1'])
  })
})
