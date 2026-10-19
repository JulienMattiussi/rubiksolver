import { MEGA_FACES, megaAround } from '../../puzzles/polyhedron/megaminx'
import type { MegaFace, MegaMove } from '../../core/types'

/**
 * The Megaminx's and the Pyraminx Crystal's formulas, in fan2cube's letters
 * (megaminx2, pyraminxcrystal2; `A'2` the page's A'², `H3` its H³), read by
 * `megaFormula`, from every way of holding the puzzle. Each effect is asserted in
 * tests/unit/puzzles/polyhedron/megaminx.test.ts and crystal.test.ts.
 */

/** 1: A², A.H'DH */
export const STAR = ['A2', "A H' D H"]
/** 2: D'B'D = (BAD) -> (HDA); (HDA)° = D'BD.ABA' */
export const CORNER = ["D' B' D", "D' B D A B A'"]
/** 3, 5: (HD)->(AD) = [H'A'][HD]; (HA)->(AD) = [HD][H'A'] */
export const EQUATOR = ["H' A' H A H D H' D'", "H D H' D' H' A' H A"]
/** 4: the left corner, the right one, the last one (taken or twisted). */
export const SIDE_CORNERS = ["H' A'2 H A2", "H' A' H2 A", "H D2 H' D'2", "H D H'2 D'", "H D H' D'"]
/** 6: A[HD]A' = (HA)->(HP)->(HD) */
export const TOP_EDGES = ["A H D H' D' A'"]
/** 7: (HA)+(HD)+ = A[HD]HA'HA.H³A' */
export const TOP_FLIP = ["A H D H' D' H A' H A H3 A'"]
/** 8: (HDA)->(HPD)->(H B P) = [HA].P'[AH]P (B underlined) */
export const TOP_CORNERS = ["H A H' A' P' A H A' H' P"]
/** 9: (HAG)°(HDA)° = (D'BDABA').H'(AB'A'D'B'D)H */
export const TOP_TWIST = ["D' B D A B A' H' A B' A' D' B' D H"]

// The Crystal's, named; its page lists them in this order.
/** A corner taken up: D'BD. */
const TAKE_UP = "D' B D"
/** It twisted: D'BD.ABA'. */
const TWIST_UP = "D' B D A B A'"
/** A low corner: A'²HA'². */
const LOW_CORNER = "A'2 H A'2"
/** A high one: [HD]. */
const HIGH_CORNER = "H D H' D'"
/** Three top corners: [HA].P'[AH]P (the Megaminx's 8, too). */
export const CORNER_CYCLE = TOP_CORNERS[0]!
/** Two top corners twisted: D'BDABA'.H'.AB'A'D'B'D.H (the Megaminx's 9). */
export const CORNER_TWIST = TOP_TWIST[0]!
/** Three top edges: [G'P]. */
export const EDGE_CYCLE = "G' P G P'"
/** Two top edges flipped: ([G'P]H')².([PG']H)². */
export const EDGE_FLIP = "G' P G P' H' G' P G P' H' P G' P' G H P G' P' G H"

/** The Crystal's formulas, in its page's order. */
export const CRYSTAL_FORMULAS = [
  TAKE_UP,
  TWIST_UP,
  LOW_CORNER,
  HIGH_CORNER,
  CORNER_CYCLE,
  CORNER_TWIST,
  EDGE_CYCLE,
  EDGE_FLIP,
]

/** The top's 3-cycles undone. */
export const EDGE_CYCLE_BACK = "P G' P' G"
export const CORNER_CYCLE_BACK = "P' H A H' A' P A H A' H'"

/** A formula in the page's letters (`A'2` the page's A'², `H3` its H³),
 *  played from one way of holding the puzzle. */
type Letters = Record<'H' | 'A' | 'D' | 'G' | 'B' | 'P', MegaFace>

/** The page's letters held with `top` up and `front` in front. */
function holding(top: MegaFace, front: MegaFace): Letters {
  const around = megaAround(front)
  const at = around.indexOf(top)
  const [H, D, B, , G] = [0, 1, 2, 3, 4].map((k) => around[(at + k) % 5]!)
  // P: behind H and D, the third face at their far corner.
  const ring = megaAround(top)
  const i = ring.indexOf(D!)
  const P = ring[(i + 1) % 5] === front ? ring[(i + 4) % 5]! : ring[(i + 1) % 5]!
  return { H: H!, A: front, D: D!, G: G!, B: B!, P }
}

/** Every way of holding it: each face up, each of its neighbors in front. */
export const HOLDINGS: readonly Letters[] = MEGA_FACES.flatMap((top) =>
  megaAround(top).map((front) => holding(top, front)),
)

/** A formula's turns, held one way. */
export function megaFormula(formula: string, held: Letters = holding('U', 'F')): MegaMove[] {
  return formula
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const match = /^([HADGBP])('?)([23]?)$/.exec(token)
      if (!match) throw new Error(`megaFormula: ${token}`)
      const n = match[3] ? Number(match[3]) : 1
      const amount = (match[2] ? 5 - n : n) as MegaMove['amount']
      return { megaFace: held[match[1] as keyof Letters], amount }
    })
}
