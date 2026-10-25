import { describe, expect, it } from 'vitest'
import { solvedCube, stateKey } from '@/lib/core/cube'
import { allTurnsOf } from '@/lib/core/moveSet'
import { colorsOf } from '@/lib/core/pieces'
import { applyMoves } from '@/lib/core/turn'
import type { Cube } from '@/lib/core/types'
import { methodsFor } from '@/lib/solve/solver'
import { ivyPolygons } from '@/three/puzzles/diagonal/ivyGeometry'

const SOLVED = solvedCube('ivy')
const TURNS = allTurnsOf('ivy').turns

describe('Ivy Cube', () => {
  it('has four corners of one set and six centers', () => {
    const corners = SOLVED.filter((c) => c.stickers.length === 3)
    expect(corners).toHaveLength(4)
    for (const c of corners) expect(c.position[0] * c.position[1] * c.position[2]).toBe(-1)
    expect(SOLVED.filter((c) => c.stickers.length === 1)).toHaveLength(6)
    // Its four corners turn, each a third either way.
    expect(TURNS).toHaveLength(8)
  })

  it('turns a corner in place and the three centers round it, nothing else', () => {
    for (const turn of TURNS) {
      const after = applyMoves(SOLVED, [turn])
      const moved = after.filter((c, i) => stateKey([c]) !== stateKey([SOLVED[i]!]))
      expect(moved.filter((c) => c.stickers.length === 3)).toHaveLength(1)
      expect(moved.filter((c) => c.stickers.length === 1)).toHaveLength(3)
      // Its corners never leave their places.
      for (const c of after.filter((c) => c.stickers.length === 3)) {
        const home = SOLVED.find((s) => colorsOf(s) === colorsOf(c))!
        expect(c.position).toEqual(home.position)
      }
    }
  })

  it('has 29,160 states', () => {
    const seen = new Set([stateKey(SOLVED)])
    let frontier: Cube[] = [SOLVED]
    while (frontier.length) {
      frontier = frontier.flatMap((cube) =>
        TURNS.flatMap((turn) => {
          const next = applyMoves(cube, [turn])
          const key = stateKey(next)
          if (seen.has(key)) return []
          seen.add(key)
          return [next]
        }),
      )
    }
    expect(seen.size).toBe(29160)
  })

  it('is solved face by face: the white face, the yellow one, the centers left', () => {
    const method = methodsFor('ivy').find((m) => m.id === 'ivyFaces')!
    const scrambled = applyMoves(SOLVED, [TURNS[0]!, TURNS[3]!, TURNS[4]!, TURNS[7]!, TURNS[2]!])
    const steps = method.solve(scrambled)
    // Its steps in order (one already met is left out).
    const keys = steps.map((s) => s.key)
    expect(keys).toEqual(ORDER.filter((k) => keys.includes(k)))
    expect(keys.length).toBeGreaterThan(0)
  })

  it('has its yellow, red and blue leaves meeting with no corner', () => {
    // The corner where the yellow, red and blue faces meet: no piece there.
    const center = (color: string) =>
      SOLVED.find((c) => c.stickers.length === 1 && c.stickers[0]!.color === color)!
    const meet = [0, 1, 2].map(
      (a) => center('Y').position[a]! + center('R').position[a]! + center('B').position[a]!,
    )
    expect(SOLVED.some((c) => c.position.join() === meet.join())).toBe(false)
  })

  it('draws each sticker on its face, a corner’s three and a center’s leaf', () => {
    for (const cubie of SOLVED) {
      const stickers = ivyPolygons(cubie).filter((p) => p.paint !== 'body')
      expect(new Set(stickers.map((p) => p.ni)).size).toBe(cubie.stickers.length)
      for (const p of stickers) {
        for (const point of p.points) {
          for (const x of point) expect(Math.abs(x)).toBeLessThanOrEqual(1.5 * 1.01)
        }
      }
    }
  })
})

const ORDER = ['stepIvyFirstFace', 'stepIvyOppositeFace', 'stepIvyCenters']
