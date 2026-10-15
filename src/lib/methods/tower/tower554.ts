import { moveSet } from '../../core/moveSet'
import { parseMoves } from '../../core/moves'
import { projectPlan, type MethodPlan } from '../../solve/solverKit'
import type { Cube, Cubie } from '../../core/types'
import { TOWER334_PLAN } from './tower334'
import {
  byCycles,
  homesByColor,
  oddBlocks,
  placed,
  towerCycles,
  wingsToMiddles,
} from './towerReduce'
import { once } from '../../solve/once'

/**
 * 5x5x4 tower, as fan2cube.fr solves it (tower5542): "le but est de
 * transformer la Tour 5x5x4 en 3x3x4 et le résoudre normalement".
 *
 *   0. Parity                  an inner layer's half turn, if the wings
 *                              stand an odd permutation from their middles
 *   A. Top and bottom centers  their "x" centers, then their "+" ones
 *   B. Side centers            the middle column's, then the others
 *   C. Edges                   each top or bottom edge's two wings beside
 *                              its middle
 *   then the 3x3x4 it has become (tower334.ts): its corners, the edges'
 *   middles, the middle centers, the side edges and the middle column's
 *   side centers.
 *
 * Every piece by a pure 3-cycle of its kind (towerReduce.ts); each kind
 * may disturb the kinds after it, never those before.
 */

const SHAPE = '554'

const abs = (c: Cubie) => c.position.map(Math.abs) as [number, number, number]
const isTop = (c: Cubie) => abs(c)[1] === 3
/** Off the faces' middle lines, along x and z. */
const off = (c: Cubie) => [abs(c)[0], abs(c)[2]]

const isTopX = (c: Cubie) => isTop(c) && off(c).every((v) => v === 1)
const isTopPlus = (c: Cubie) => isTop(c) && off(c).sort().join() === '0,1'
const isSideMiddle = (c: Cubie) => !isTop(c) && off(c).sort().join() === '0,2'
const isSideOff = (c: Cubie) => !isTop(c) && off(c).sort().join() === '1,2'
const isWing = (c: Cubie) => isTop(c) && off(c).sort().join() === '1,2'
const isMiddle = (c: Cubie) => isTop(c) && off(c).sort().join() === '0,2'

const KINDS = [isTopX, isTopPlus, isSideMiddle, isSideOff, isWing]
/** A kind's step may move the kinds after it, and what the 3x3x4 solves. */
const laterThan = (kind: (c: Cubie) => boolean) => {
  const later = KINDS.slice(KINDS.indexOf(kind) + 1)
  return (c: Cubie) => later.some((k) => k(c)) || !KINDS.some((k) => k(c))
}

const table = (kind: (c: Cubie) => boolean) => once(() => towerCycles(SHAPE, kind, laterThan(kind)))

const TABLES = {
  topX: table(isTopX),
  topPlus: table(isTopPlus),
  sideMiddle: table(isSideMiddle),
  sideOff: table(isSideOff),
  wings: table(isWing),
}

const HOMES = {
  topX: homesByColor(SHAPE, isTopX, TABLES.topX),
  topPlus: homesByColor(SHAPE, isTopPlus, TABLES.topPlus),
  sideMiddle: homesByColor(SHAPE, isSideMiddle, TABLES.sideMiddle),
  sideOff: homesByColor(SHAPE, isSideOff, TABLES.sideOff),
  wings: wingsToMiddles(SHAPE, isWing, isMiddle),
}

const kindStep = (name: keyof typeof HOMES) => byCycles(TABLES[name], HOMES[name])

const ALL = moveSet('U 2U Uw D 2D Dw R2 2R2 Rw2 L2 2L2 Lw2 F2 2F2 Fw2 B2 2B2 Bw2')

/** The 3x3x4 it has become: its pieces on the faces' middle lines and at
 *  their ends, two grid steps to one. */
const to334 = (cube: Cube): Cube =>
  cube
    .filter((c) => off(c).every((v) => v !== 1))
    .map((c) => ({
      ...c,
      position: [c.position[0] / 2, c.position[1], c.position[2] / 2],
    }))

/** The wings' parity against the middles: an inner layer's half turn swaps
 *  a wing in each block and no middle (3-cycles change neither). */
const wingsOdd = oddBlocks(HOMES.wings, TABLES.wings)

export const TOWER554_PLAN: MethodPlan = [
  {
    key: 'stepParity',
    goal: (cube) => !wingsOdd(cube),
    moves: ALL,
    phases: [(cube) => (wingsOdd(cube) ? parseMoves('2R2') : [])],
    optional: true,
  },
  {
    key: 'stepTowerTopCenters',
    goal: (cube) => placed(HOMES.topX)(cube) && placed(HOMES.topPlus)(cube),
    moves: ALL,
    phases: [kindStep('topX'), kindStep('topPlus')],
  },
  {
    key: 'stepTowerSideCenters',
    goal: (cube) =>
      placed(HOMES.topX)(cube) &&
      placed(HOMES.topPlus)(cube) &&
      placed(HOMES.sideMiddle)(cube) &&
      placed(HOMES.sideOff)(cube),
    moves: ALL,
    phases: [kindStep('sideMiddle'), kindStep('sideOff')],
  },
  {
    key: 'stepTowerEdges',
    goal: (cube) => Object.values(HOMES).every((homes) => placed(homes)(cube)),
    moves: ALL,
    phases: [kindStep('wings')],
  },
  ...projectPlan(TOWER334_PLAN, to334),
]
