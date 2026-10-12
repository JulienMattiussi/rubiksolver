import { describe, expect, it } from 'vitest'
import { isSolved, solvedCube, stateKey } from '@/lib/cube'
import { formatMoves, NOTATION_FR, NOTATION_US, simplifyMoves } from '@/lib/moves'
import { parsePyraMoves, pyraTurnsOf } from '@/lib/pyraminx'
import { applyMoves, turnedBy } from '@/lib/turn'
import type { Cube, Cubie } from '@/lib/types'
import { validateCube } from '@/lib/validate'

const SOLVED = solvedCube('pyra')
const play = (text: string, from: Cube = SOLVED) =>
  applyMoves(from, parsePyraMoves(text, NOTATION_FR))

/** The edges fan2cube names by the two faces they join: (A)vant, (G)auche,
 *  (D)roite, (B)as. */
const EDGE_NAMES: Record<string, string> = {
  '0,0,2': 'AG',
  '2,0,0': 'AD',
  '0,2,0': 'GD',
  '0,-2,0': 'BA',
  '-2,0,0': 'BG',
  '0,0,-2': 'BD',
}

/** What a formula does from solved: each piece that moves, as `from->to`,
 *  and each one turned in its place, as `name°`. */
function effect(text: string): string[] {
  const after = play(text)
  return after.flatMap((c, i) => {
    const before = SOLVED[i]!
    const from = EDGE_NAMES[before.position.join()] ?? before.position.join()
    const to = EDGE_NAMES[c.position.join()] ?? c.position.join()
    const home = SOLVED.find((s) => s.position.join() === c.position.join())!
    const right = c.stickers.every((s) =>
      home.stickers.some((h) => h.color === s.color && h.normal.join() === s.normal.join()),
    )
    // Flipped or not only means something for a piece back in its own place.
    if (from === to) return right ? [] : [`${from}°`]
    return [`${from}->${to}`]
  })
}

describe('Pyraminx model', () => {
  it('turns a layer (tip, center, three edges) or a tip alone, by thirds', () => {
    for (const move of pyraTurnsOf('pyra')) {
      const turned = SOLVED.filter((_, i) => turnedBy(SOLVED, move)(i)).length
      expect(turned).toBe(move.tip ? 1 : 5)
      const there = applyMoves(SOLVED, [move])
      expect(isSolved(there)).toBe(false)
      expect(stateKey(applyMoves(there, [move, move]))).toBe(stateKey(SOLVED))
    }
  })
})

describe('Pyraminx notation', () => {
  it("writes fan2cube's in French (tips uppercase) and the WCA's in English (layers uppercase)", () => {
    const moves = parsePyraMoves("g d' H P'", NOTATION_FR)
    expect(formatMoves(moves, NOTATION_FR)).toBe("g d' H P'")
    expect(formatMoves(moves, NOTATION_US)).toBe("L R' u b'")
    expect(parsePyraMoves("L R' u b'", NOTATION_US)).toEqual(moves)
  })

  it('reads commutators, ² and packed formulas', () => {
    expect(formatMoves(parsePyraMoves("[gd']", NOTATION_FR), NOTATION_FR)).toBe("g d' g' d")
    expect(parsePyraMoves('g²', NOTATION_FR)).toEqual(parsePyraMoves("g'", NOTATION_FR))
    expect(parsePyraMoves("(hd'g).(hd'g)", NOTATION_FR)).toHaveLength(6)
    expect(() => parsePyraMoves('[g]', NOTATION_FR)).toThrow()
    expect(() => parsePyraMoves('x', NOTATION_FR)).toThrow()
    expect(() => parsePyraMoves('g+d', NOTATION_FR)).toThrow()
  })

  it('merges turns of the same layer, three thirds cancelling', () => {
    expect(
      formatMoves(simplifyMoves(parsePyraMoves('g g h h h G', NOTATION_FR)), NOTATION_FR),
    ).toBe("g' G")
  })
})

describe("fan2cube's formulas (pyraminx2)", () => {
  it("[gd'] = g d' g' d: (AG)->(BA)->(AD)", () => {
    expect(effect("[gd']").sort()).toEqual(['AD->AG', 'AG->BA', 'BA->AD'])
  })

  it("d h d' h d h d': (AG)->(AD)->(GD)", () => {
    expect(effect("dhd'hdhd'").sort()).toEqual(['AD->GD', 'AG->AD', 'GD->AG'])
  })

  it("[gd'][h'd]: (AG)° (AD)°, nothing else", () => {
    expect(effect("[gd'][h'd]").sort()).toEqual(['AD°', 'AG°'])
  })

  it("the extra ones: [dh] (BA)->(AD)->(GD), [dh'][g'h] (AG)° (BA)°, (hd'g)3 the superflip", () => {
    expect(effect('[dh]').sort()).toEqual(['AD->GD', 'BA->AD', 'GD->BA'])
    expect(effect("[dh'][g'h]").sort()).toEqual(['AG°', 'BA°'])
    expect(effect("(hd'g)(hd'g)(hd'g)").sort()).toEqual(
      ['AD°', 'AG°', 'BA°', 'BD°', 'BG°', 'GD°'].sort(),
    )
  })
})

/** The piece at `index` with its sticker colors changed by `recolor`. */
function repaint(cube: Cube, index: number, recolor: (c: Cubie) => Cubie): Cube {
  return cube.map((c, i) => (i === index ? recolor(c) : c))
}
const reversed = (c: Cubie): Cubie => ({
  position: c.position,
  stickers: c.stickers.map((s, k) => ({
    normal: s.normal,
    color: c.stickers[c.stickers.length - 1 - k]!.color,
  })),
})

describe('Pyraminx validation and editor', () => {
  it('rejects a lone flipped edge and a center piece in mirror image', () => {
    const edge = SOLVED.findIndex((c) => c.stickers.length === 2)
    expect(validateCube(repaint(SOLVED, edge, reversed))).toEqual({
      ok: false,
      error: 'impossible',
    })
    const center = SOLVED.findIndex((c) => c.position.every((v) => Math.abs(v) === 1))
    expect(validateCube(repaint(SOLVED, center, reversed))).toEqual({
      ok: false,
      error: 'impossible',
    })
  })
})
