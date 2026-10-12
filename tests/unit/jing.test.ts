import { describe, expect, it } from 'vitest'
import { cubeOrientations, solvedCube, stateKey } from '@/lib/cube'
import { formatMoves, NOTATION_FR, NOTATION_US } from '@/lib/moves'
import { parsePyraMoves, pyraTurnsOf } from '@/lib/pyraminx'
import { applyMoves, turnedBy } from '@/lib/turn'
import type { Cube, Cubie } from '@/lib/types'
import { validateCube } from '@/lib/validate'

const SOLVED = solvedCube('jing')
const parse = (text: string) => parsePyraMoves(text, NOTATION_FR, 2)
const play = (text: string, from: Cube = SOLVED) => applyMoves(from, parse(text))

/** fan2cube's names: corners by their letter, edges by their two faces,
 *  centers by their face in parentheses. */
const NAMES: Record<string, string> = {
  '1,1,1': 'H',
  '-1,-1,1': 'G',
  '1,-1,-1': 'D',
  '-1,1,-1': 'P',
  '0,0,1': 'AG',
  '1,0,0': 'AD',
  '0,1,0': 'GD',
  '0,-1,0': 'BA',
  '-1,0,0': 'BG',
  '0,0,-1': 'BD',
  '1,-1,1': '(A)',
  '-1,-1,-1': '(B)',
  '-1,1,1': '(G)',
  '1,1,-1': '(D)',
}

/** What a formula does from solved: each piece moved, `from->to`, and each
 *  one turned in place, `name°`. */
function effect(text: string): string[] {
  const after = play(text)
  const normals = (c: Cubie) => c.stickers.map((s) => s.normal).join('|')
  return SOLVED.flatMap((c, i) => {
    const [from, to] = [NAMES[c.position.join()]!, NAMES[after[i]!.position.join()]!]
    if (from !== to) return [`${from}->${to}`]
    return normals(c) === normals(after[i]!) ? [] : [`${from}°`]
  }).sort()
}

describe('Pyraminx Jing model', () => {
  it('turns half the puzzle: a corner, its three edges and the three centers around it', () => {
    for (const move of pyraTurnsOf('jing')) {
      expect(SOLVED.filter((_, i) => turnedBy(SOLVED, move)(i))).toHaveLength(7)
      expect(stateKey(applyMoves(SOLVED, [move, move, move]))).toBe(stateKey(SOLVED))
    }
    expect(cubeOrientations(SOLVED)).toHaveLength(12)
  })

  it('writes its turns in uppercase in both notations', () => {
    const moves = parse("D H' G P")
    expect(formatMoves(moves, NOTATION_FR)).toBe("D H' G P")
    expect(formatMoves(moves, NOTATION_US)).toBe("R U' L B")
    expect(() => parse('d')).toThrow()
  })
})

describe("fan2cube's formulas (pyraminxjing2)", () => {
  it('[DH]: (BA)->(AD)->(GD), the centers swapped (B,A)(G,D)', () => {
    expect(effect('[DH]')).toEqual(
      ['AD->GD', 'BA->AD', 'GD->BA', '(A)->(B)', '(B)->(A)', '(D)->(G)', '(G)->(D)'].sort(),
    )
  })

  it("G[DH]G': (AG)->(AD)->(GD); [GD']: (AD)->(AG)->(BA)", () => {
    expect(effect("G[DH]G'").filter((e) => !e.startsWith('('))).toEqual(
      ['AD->GD', 'AG->AD', 'GD->AG'].sort(),
    )
    expect(effect("[GD']").filter((e) => !e.startsWith('('))).toEqual(
      ['AD->AG', 'AG->BA', 'BA->AD'].sort(),
    )
  })

  it("[DH'][G'H]: (AG)° (BA)°; [GD'][H'D]: (AG)° (AD)°", () => {
    expect(effect("[DH'][G'H]").filter((e) => !e.startsWith('('))).toEqual(['AG°', 'BA°'])
    expect(effect("[GD'][H'D]").filter((e) => !e.startsWith('('))).toEqual(['AD°', 'AG°'])
  })

  it("[DH]³ swaps the centers (B,A)(G,D), (DHD'H)² twists H and cycles (A,D,B)", () => {
    expect(effect('[DH][DH][DH]')).toEqual(['(A)->(B)', '(B)->(A)', '(D)->(G)', '(G)->(D)'].sort())
    expect(effect("DHD'H DHD'H")).toEqual(['(A)->(D)', '(B)->(A)', '(D)->(B)', 'H°'].sort())
  })
})

/** The piece at `index` with its colors changed by `recolor`. */
const repaint = (cube: Cube, index: number, recolor: (c: Cubie) => Cubie): Cube =>
  cube.map((c, i) => (i === index ? recolor(c) : c))
/** Its colors moved one sticker along (a corner twisted, an edge flipped). */
const rolled = (c: Cubie): Cubie => ({
  position: c.position,
  stickers: c.stickers.map((s, k) => ({
    normal: s.normal,
    color: c.stickers[(k + 1) % c.stickers.length]!.color,
  })),
})

describe('Pyraminx Jing validation and editor', () => {
  it('rejects a lone flipped edge, a lone twisted corner and two centers swapped', () => {
    const impossible = { ok: false, error: 'impossible' }
    const edge = SOLVED.findIndex((c) => c.stickers.length === 2)
    expect(validateCube(repaint(SOLVED, edge, rolled))).toEqual(impossible)
    // The twist law: with the centers in place, the corners' twists add up to 0.
    expect(validateCube(repaint(SOLVED, 0, rolled))).toEqual(impossible)
    const [a, b] = SOLVED.flatMap((c, i) => (c.stickers.length === 1 ? [i] : []))
    const swapped = SOLVED.map((c, i) =>
      i === a || i === b
        ? {
            position: c.position,
            stickers: [
              {
                normal: c.stickers[0]!.normal,
                color: SOLVED[i === a ? b! : a!]!.stickers[0]!.color,
              },
            ],
          }
        : c,
    )
    expect(validateCube(swapped)).toEqual(impossible)
  })
})
