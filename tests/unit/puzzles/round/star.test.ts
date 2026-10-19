import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube, stateKey } from '@/lib/core/cube'
import { NOTATION_FR, NOTATION_US } from '@/lib/core/notation'
import { formatStarMove, parseStarMoves, simplifyStarMoves } from '@/lib/puzzles/round/star'
import { applyMoves, turnedBy } from '@/lib/core/turn'
import type { Cube } from '@/lib/core/types'

const SOLVED = solvedCube('star')
const play = (text: string, from: Cube = SOLVED) =>
  applyMoves(from, parseStarMoves(text, NOTATION_FR))

describe('star prism model', () => {
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

describe('4-Star Prism', () => {
  const SOLVED4 = solvedCube('star4')
  const play4 = (text: string, from: Cube = SOLVED4) =>
    applyMoves(from, parseStarMoves(text, NOTATION_FR))
  const layer = (cube: Cube, y: number) => cube.filter((c) => c.position[1] === y)

  it('turns each layer on its own, named in lowercase for the inner ones', () => {
    const moves = parseStarMoves('2h -b B /', NOTATION_FR)
    expect(moves).toEqual([
      { ring: 'u', amount: 2 },
      { ring: 'd', amount: 5 },
      { ring: 'D', amount: 1 },
      { slash: true },
    ])
    expect(moves.map((m) => formatStarMove(m, NOTATION_US)).join(' ')).toBe('2u -d D /')
    const turned = play4('h')
    expect(layer(turned, 1).map((c) => c.position.join())).not.toEqual(
      layer(SOLVED4, 1).map((c) => c.position.join()),
    )
    for (const y of [2, -1, -2]) expect(layer(turned, y)).toEqual(layer(SOLVED4, y))
  })

  it('slashes through the four layers: outer onto outer, inner onto inner', () => {
    const slashed = play4('/')
    SOLVED4.forEach((c, i) => {
      expect(Math.abs(slashed[i]!.position[1])).toBe(Math.abs(c.position[1]))
    })
    expect(stateKey(play4('//'))).toBe(stateKey(SOLVED4))
  })

  it('is not solved with its inner star turned against the outer one', () => {
    expect(isSolved(play4('h -b'))).toBe(false)
    expect(isSolved(play4('1 h -b -B'))).toBe(true)
  })

  it('K on the inner layers leaves the outer star alone (an even number of slashes)', () => {
    const after = play4('/-h/h+b/-b/')
    expect(layer(after, 2)).toEqual(layer(SOLVED4, 2))
    expect(layer(after, -2)).toEqual(layer(SOLVED4, -2))
    expect(isSolved(after)).toBe(false)
  })
})
