import { describe, expect, it } from 'vitest'
import { cubeShape, isSolved, solvedCube } from '@/lib/core/cube'
import { parseMoves } from '@/lib/core/notation'
import { applyMoves } from '@/lib/core/turn'
import { methodsFor } from '@/lib/solve/solver'
import { colorsOf, poseOf } from '@/lib/core/pieces'
import { isMark, type Color, type Cube, type Cubie } from '@/lib/core/types'
import { MIDDLE_LINE, U_PERM, WHITE_LINE } from '@/lib/methods/twisted/impossible'
import {
  lensOf,
  lineToggles,
  linesOff,
  withoutLines,
  withTurnedLines,
} from '@/lib/puzzles/twisted/impossible'
import { linesRefused, settled } from '@/lib/puzzles/twisted/impossibleEntry'

const SOLVED = solvedCube('impossible')
const play = (alg: string, from: Cube = SOLVED) => applyMoves(from, parseMoves(alg))

/** Each piece's tiles, as the guide writes them: dominant then secondary. */
const tiles = (cube: Cube) =>
  cube.map((c) => {
    const lenses = lensOf(c)
    return c.stickers
      .filter((s) => !isMark(s))
      .map((s, i) => s.color + (lenses[i]!.secondary ?? '-'))
      .sort()
      .join(' ')
  })

/** Whether the pieces `which` picks (by their colors) are all home. */
const home = (cube: Cube, which: (c: Cubie) => boolean) => {
  const at = new Map(SOLVED.map((c) => [colorsOf(c), poseOf(c) + c.position.join()]))
  return cube.filter(which).every((c) => at.get(colorsOf(c)) === poseOf(c) + c.position.join())
}
const hasWhite = (c: Cubie) => c.stickers.some((s) => s.color === 'W')

describe("Rubik's Impossible", () => {
  it('is a 3x3 told by its centers’ lines', () => {
    expect(cubeShape(SOLVED)).toBe('impossible')
    expect(isSolved(SOLVED)).toBe(true)
    expect(isSolved(play('U'))).toBe(false)
    expect(isSolved(play('U U U U'))).toBe(true)
  })

  it('wears the guide’s tiles', () => {
    const all = tiles(SOLVED).filter(Boolean)
    // Fifteen anchors: the six centers, six tiles and a whole corner.
    expect(all.flatMap((t) => t.split(' ')).filter((t) => t.endsWith('-'))).toHaveLength(15)
    expect(all).toContain('G- R- W-')
    // The three ambiguous edges: blue and orange both ways, and twice a
    // red/green tile with a blue/orange one.
    expect(all).toContain('BO OB')
    expect(all.filter((t) => t === 'BO RG' || t === 'GR OB')).toHaveLength(2)
    // The yellow edge both of whose tiles show yellow.
    expect(all).toContain('RY YB')
  })

  it('carries each tile’s colors and ridges with its piece', () => {
    const turned = play("R U F'")
    expect(tiles(turned).sort()).toEqual(tiles(SOLVED).sort())
    // A quarter turn of the top: its tiles' ridges, along x, now along z.
    const corner = play('U').find((c) => c.position.join() === '1,1,1')!
    expect(lensOf(corner).map((l) => l.ridges.map(Math.abs).join())).toContain('0,0,1')
  })

  it('turns a center’s line by the guide’s formulas', () => {
    // The white cross kept, the white center's line turned (and the
    // front's, set later with the middle layer's).
    const white = play(WHITE_LINE)
    expect(home(white, (c) => c.stickers.length === 2 && hasWhite(c))).toBe(true)
    expect(linesOff(white)).toEqual(['F', 'U'])
    // The white layer kept, the front center's line turned.
    const middle = play(MIDDLE_LINE)
    expect(home(middle, hasWhite)).toBe(true)
    expect(linesOff(middle)).toEqual(['F'])
  })

  it('cycles three edges of the last layer, every line kept', () => {
    const cycled = play(U_PERM)
    expect(home(cycled, (c) => c.position[1] !== 1 || c.stickers.length !== 2)).toBe(true)
    expect(home(cycled, () => true)).toBe(false)
    expect(linesOff(cycled)).toEqual([])
  })

  it('is solved by its guide’s method', () => {
    const [method] = methodsFor('impossible')
    for (const alg of ["R U F' L2 D B' R2 U' F D2 L B2 U R' D'", WHITE_LINE + ' ' + MIDDLE_LINE]) {
      const steps = method!.solve(play(alg))
      expect(
        isSolved(
          applyMoves(
            play(alg),
            steps.flatMap((s) => [...s.moves]),
          ),
        ),
      ).toBe(true)
    }
  })
})

describe('Rubik’s Impossible entry, settled', () => {
  const SCRAMBLED = play("R U F' L2 D B R' U2 F D' L B2 U R")
  const named = (cube: Cube, colors: string) => cube.find((c) => colorsOf(c) === colors)!
  /** The cube with the stickers of some pieces recolored in place (as
   *  entered by the colors they show). */
  const recolor = (cube: Cube, map: Record<string, Record<string, Color>>) =>
    cube.map((c) => {
      const by = map[colorsOf(c)]
      return by
        ? { ...c, stickers: c.stickers.map((s) => ({ ...s, color: by[s.color] ?? s.color })) }
        : c
    })

  it('keeps a state that can be reached as it is', () => {
    expect(settled(SCRAMBLED)).toEqual(SCRAMBLED)
  })

  it('turns the blue-orange edge the way that can be reached', () => {
    const flipped = recolor(SCRAMBLED, { BO: { B: 'O', O: 'B' } })
    expect(named(flipped, 'BO')).not.toEqual(named(SCRAMBLED, 'BO'))
    expect(settled(flipped)).toEqual(SCRAMBLED)
  })

  it('tells the orange-green edge from the red-blue one', () => {
    // Each shows blue/orange on one tile, green/red on the other: entered
    // the other way, each stands where the other is.
    const swapped = recolor(SCRAMBLED, { GO: { O: 'B', G: 'R' }, BR: { B: 'O', R: 'G' } })
    expect(settled(swapped)).toEqual(SCRAMBLED)
  })
})

describe('Rubik’s Impossible entry, its lines', () => {
  it('refuses a center’s line that cannot go with the corners', () => {
    const scrambled = play("R U F' L2 D B R' U2 F D' L B2 U R")
    expect(linesRefused(scrambled)).toBeNull()
    // The green center's line turned a quarter on its own.
    const green = scrambled
      .find((c) => c.stickers.some(isMark) && c.stickers[0]!.color === 'G')!
      .position.join()
    const turned = Object.keys(lineToggles.of(scrambled))
    const toggled = turned.includes(green) ? turned.filter((k) => k !== green) : [...turned, green]
    expect(linesRefused(withTurnedLines(withoutLines(scrambled), toggled))).toBe('lines')
  })
})
