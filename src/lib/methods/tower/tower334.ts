import type { MethodPlan } from '../../solve/solverKit'
import { innerDomino, outerDomino } from './towerLayers'

/**
 * 3x3x4 tower, "double Domino", as fan2cube.fr solves it (tower3342): two
 * Dominos sharing their sides, an outer one (its top and bottom layers, H
 * and B) and an inner one (its two middle layers, h and b), each with the
 * Domino's formulas on its own layers (towerLayers.ts).
 *
 *   A. Outer corners  the outer Domino's corners, bottom then top
 *   B. Outer edges    its edges, bottom then top
 *   C. Inner corners  the inner Domino's corners, with h and b for H and B
 *   D. Inner edges    its edges
 */
export const TOWER334_PLAN: MethodPlan = [...outerDomino('334'), ...innerDomino('334', 1, 2)]
