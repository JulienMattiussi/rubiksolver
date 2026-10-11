import { describe, expect, it } from 'vitest'
import { cubeShape, isSolved, solvedCube, stateKey } from '@/lib/cube'
import { NOTATION_FR, NOTATION_US, scrambleTurns } from '@/lib/moves'
import { STAR_PLAN } from '@/lib/methods/starPrism'
import { methodsFor } from '@/lib/solver'
import { buildSteps } from '@/lib/solverKit'
import { seededRng } from '../helpers'
import {
  applyStarMove,
  formatStarMove,
  invertStarMove,
  parseStarMoves,
  simplifyStarMoves,
} from '@/lib/star'
import { decodeCube, encodeCube } from '@/lib/snapshot'
import { applyMoves, turnedBy } from '@/lib/turn'
import type { Cube, StarMove } from '@/lib/types'

const SOLVED = solvedCube('star')
const play = (text: string, from: Cube = SOLVED) =>
  applyMoves(from, parseStarMoves(text, NOTATION_FR))

describe('star prism model', () => {
  it('has 12 points and 2 screw halves, recognized by their count', () => {
    expect(SOLVED).toHaveLength(14)
    expect(cubeShape(SOLVED)).toBe('star')
    expect(isSolved(SOLVED)).toBe(true)
  })

  it('undoes each turn with its inverse, and comes back after a full round', () => {
    const turns: StarMove[] = [{ ring: 'U', amount: 1 }, { ring: 'D', amount: 2 }, { slash: true }]
    for (const move of turns) {
      const there = applyStarMove(SOLVED, move)
      expect(isSolved(there)).toBe(false)
      expect(stateKey(applyStarMove(there, invertStarMove(move)))).toBe(stateKey(SOLVED))
    }
    expect(stateKey(play('1 1 1 1 1 1'))).toBe(stateKey(SOLVED))
  })

  it('counts a whole-puzzle rotation as solved (both layers turned together)', () => {
    // Top one piece clockwise seen from above, bottom the same way: from
    // below, that is counterclockwise.
    expect(isSolved(play('1 -B'))).toBe(true)
    expect(isSolved(play('1 B'))).toBe(false)
  })

  it('slashes the right half: three points up, three down, its screw half flipped', () => {
    const turned = turnedBy(SOLVED, { slash: true })
    expect(SOLVED.filter((_, i) => turned(i))).toHaveLength(7)
    // Twice is nothing.
    expect(stateKey(play('//'))).toBe(stateKey(SOLVED))
  })

  it("reads and writes fan2cube's notation, in both notations", () => {
    const moves = parseStarMoves('/-1/1+B/-B/', NOTATION_FR)
    expect(moves.map((m) => formatStarMove(m, NOTATION_FR)).join(' ')).toBe('/ -1 / 1 B / -B /')
    expect(moves.map((m) => formatStarMove(m, NOTATION_US)).join(' ')).toBe('/ -1 / 1 D / -D /')
    expect(() => parseStarMoves('/x/', NOTATION_FR)).toThrow()
  })

  it('merges turns of the same layer and cancels two slashes', () => {
    expect(simplifyStarMoves(parseStarMoves('1 2 / / 3 -3 B', NOTATION_FR))).toEqual([
      { ring: 'U', amount: 3 },
      { ring: 'D', amount: 1 },
    ])
  })

  it('survives a snapshot (its valley normals included)', () => {
    const scrambled = play('/3/-1B/2/')
    expect(stateKey(decodeCube(encodeCube(scrambled))!)).toBe(stateKey(scrambled))
  })
})

describe('star prism formulas (from fan2cube.fr)', () => {
  /** What a formula moves, from solved, as `from->to` slot names (H/B by
   *  layer, then the slot), `f` when the piece comes back upside down. */
  const effect = (text: string) => {
    const after = play(text)
    return after
      .flatMap((c, i) => {
        const was = SOLVED[i]!
        const same =
          c.position.join() === was.position.join() &&
          c.stickers.every((s, j) => s.normal.join() === was.stickers[j]!.normal.join())
        return same ? [] : [`${was.position.join(',')}->${c.position.join(',')}`]
      })
      .sort()
  }

  it('K = /-1/1+B/-B/ swaps two top points and the two below them, nothing else', () => {
    const moved = effect('/-1/1+B/-B/')
    expect(moved).toHaveLength(4)
    // Each piece stays in its layer.
    for (const m of moved) {
      const [from, to] = m.split('->').map((p) => p.split(',').map(Number)[1])
      expect(from).toBe(to)
    }
  })

  it('/3/3/ flips the half-screw, the top layer half turned (3 puts it back)', () => {
    const fixed = play('/3/3/ 3')
    const screw = (c: Cube) => c.filter((p) => p.position[1] === 0)
    expect(effect('/3/3/ 3')).toEqual(
      screw(SOLVED)
        .filter((p) => p.position[0] > 0)
        .map((p) => `${p.position.join(',')}->${p.position.join(',')}`),
    )
    expect(isSolved(fixed)).toBe(false)
  })
})

describe('Isolate then permute (Star Prism method)', () => {
  it('is the method offered for the star prism', () => {
    expect(methodsFor('star').map((m) => m.id)).toEqual(['isolateFirst'])
  })

  it('solves scrambles, every step reaching its goal', () => {
    const rng = seededRng(41)
    for (let i = 0; i < 15; i++) {
      let state = applyMoves(SOLVED, scrambleTurns('star', 30, rng, SOLVED))
      for (const step of buildSteps(state, STAR_PLAN)) {
        state = applyMoves(state, step.moves)
        expect(STAR_PLAN.find((s) => s.key === step.key)!.goal(state)).toBe(true)
      }
      expect(isSolved(state)).toBe(true)
    }
  }, 120000)
})
