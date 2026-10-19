import { describe, expect, it } from 'vitest'
import { solvedCube } from '@/lib/core/cube'
import { applyMoves } from '@/lib/core/turn'
import { parseMoves } from '@/lib/core/notation'
import {
  ANTISUNE,
  CMLL_ADJACENT,
  CORNER_CYCLE,
  CORNER_TWIST_PAIR,
  INSERT_RIGHT,
  INSERT_RIGHT_BACK,
  OLL_EDGE_TURN,
  PLL_UB,
  SUNE_BACK,
  NIKLAS,
  OLL_EDGE,
  PLL_AA,
  PLL_AB,
  PLL_T,
  PLL_UA,
  PLL_Y,
  SUNE,
} from '@/lib/methods/standard/algs'
import { edgesOriented, pieceInSlot, pieces, piecesHome } from '@/lib/methods/standard/pieces3'

const SOLVED = solvedCube('3')
const run = (alg: string) => applyMoves(SOLVED, parseMoves(alg))

const F2L = pieces('D F B L R DF DB DL DR FL FR BL BR DFL DFR DBL DBR')
const ROUX_BLOCKS = pieces('L R DL FL BL DFL DBL DR FR BR DFR DBR')
const U_CORNERS = pieces('UFL UFR UBL UBR')
const U_EDGES = pieces('UF UB UL UR')

describe('algorithm catalogue', () => {
  it('every last-layer algorithm keeps the first two layers', () => {
    for (const alg of [OLL_EDGE, SUNE, ANTISUNE, PLL_AA, PLL_UA, PLL_T, PLL_Y, NIKLAS]) {
      expect(piecesHome(run(alg), F2L)).toBe(true)
    }
  })

  it('CMLL algorithms keep both Roux blocks', () => {
    for (const alg of [CMLL_ADJACENT, PLL_Y, SUNE, ANTISUNE]) {
      expect(piecesHome(run(alg), ROUX_BLOCKS)).toBe(true)
    }
  })

  it('Niklas cycles corners only, leaving every edge home', () => {
    const cube = run(NIKLAS)
    expect(piecesHome(cube, U_EDGES)).toBe(true)
    expect(piecesHome(cube, U_CORNERS)).toBe(false)
  })

  it('the PLLs and Niklas keep edges oriented (Petrus, ZZ last layer)', () => {
    for (const alg of [SUNE, ANTISUNE, PLL_AA, PLL_UA, NIKLAS]) {
      expect(edgesOriented(run(alg))).toBe(true)
    }
  })

  it('Ab-perm cycles the top corners but the back left one, white kept up', () => {
    const cube = run(PLL_AB)
    expect(piecesHome(cube, F2L)).toBe(true)
    expect(piecesHome(cube, pieces('UBL UF UR UB UL'))).toBe(true)
    // Front left to front right to back right: each where the next was.
    expect(['ULF', 'UFR', 'URB'].map((n) => pieceInSlot(cube, n))).toEqual([false, false, false])
    expect(
      cube
        .filter((c) => c.position[1] === 1)
        .every(
          (c) =>
            c.stickers.some((s) => s.color === 'W' && s.normal[1] === 1) || c.stickers.length === 1,
        ),
    ).toBe(true)
  })

  it('Aa-perm moves corners between slots, Ua-perm only edges', () => {
    expect(U_CORNERS.every((n) => pieceInSlot(run(PLL_AA), n))).toBe(false)
    expect(piecesHome(run(PLL_UA), U_CORNERS)).toBe(true)
  })

  it("Petrus edge flips F' U F and B U B' keep the 2x2x3 and flip edges", () => {
    const block = pieces('DL DB BL DBL DF FL DFL')
    for (const alg of ["F' U F", "F' U2 F", "B U B'", "B U' B'"]) {
      const cube = run(alg)
      expect(piecesHome(cube, block)).toBe(true)
      expect(edgesOriented(cube)).toBe(false)
    }
  })

  it('the shared cube formulas: last-layer ones keep the first two layers', () => {
    for (const alg of [PLL_UB, SUNE_BACK, OLL_EDGE_TURN, CORNER_CYCLE, CORNER_TWIST_PAIR]) {
      expect(piecesHome(run(alg), F2L)).toBe(true)
    }
    // Ub cycles edges only; the corner formulas move corners only.
    expect(piecesHome(run(PLL_UB), U_CORNERS)).toBe(true)
    for (const alg of [CORNER_CYCLE, CORNER_TWIST_PAIR]) {
      expect(piecesHome(run(alg), U_EDGES)).toBe(true)
    }
    // Two corners twisted, none moved: both twice back home.
    expect(
      piecesHome(run(`${CORNER_TWIST_PAIR} ${CORNER_TWIST_PAIR} ${CORNER_TWIST_PAIR}`), U_CORNERS),
    ).toBe(true)
  })

  it('the inserts keep the first layer', () => {
    const FIRST = pieces('D DF DB DL DR DFL DFR DBL DBR')
    for (const alg of [INSERT_RIGHT, INSERT_RIGHT_BACK])
      expect(piecesHome(run(alg), FIRST)).toBe(true)
  })
})
