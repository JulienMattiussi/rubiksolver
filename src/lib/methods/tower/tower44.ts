import { faceColorsOf } from '../../core/cube'
import { allTurnsOf } from '../../core/moveSet'
import { parseMoves } from '../../core/moves'
import type { MethodPlan, StepSpec } from '../../solve/solverKit'
import type { Cube, Cubie } from '../../core/types'
import { innerDomino, middleLayer, outerDomino } from './towerLayers'
import {
  byCycles,
  homesByColor,
  homesByColors,
  homesByHand,
  isOdd,
  oddBlocks,
  once,
  placed,
  towerCycles,
  wingEdges,
} from './towerReduce'

/**
 * 4x4x3 and 4x4x5 towers, as fan2cube.fr solves them (tower4432,
 * tower4452): reduced, then solved as the 3x3-wide tower they have become.
 *
 *   0. Parity        an inner layer's half turn, if reduced it would be
 *                    left in a parity (the 4x4x3 page's "étrangetés")
 *   A. Centers       the top and bottom ones (4 each), then on the 4x4x5
 *                    the side ones above and below the middle layer
 *   B. Edges         each top or bottom edge's two wings together
 *   then (towerLayers.ts) the outer Domino, on the 4x4x5 the inner one, and
 *   the middle layer: its side edges, then its centers.
 *
 * The pages finish the middle layer before the outer Domino, and undo the
 * "étrangetés" this leaves after; they are read here before reducing.
 */

const abs = (c: Cubie) => c.position.map(Math.abs) as [number, number, number]
const off = (c: Cubie) => [abs(c)[0], abs(c)[2]].sort().join()

function plan44(shape: '443' | '445'): MethodPlan {
  const top = shape === '443' ? 1 : 2
  const isCenter = (c: Cubie) => abs(c)[1] === top && off(c) === '1,1'
  const isSideCenter = (c: Cubie) => top === 2 && abs(c)[1] === 1 && off(c) === '1,3'
  const isWing = (c: Cubie) => abs(c)[1] === top && off(c) === '1,3'
  const isCorner = (c: Cubie) => c.stickers.length === 3
  const isMiddleEdge = (c: Cubie) => abs(c)[1] === 0 && off(c) === '3,3'

  const centerTable = once(() => towerCycles(shape, isCenter, (c) => !isCenter(c)))
  const sideTable = once(() =>
    towerCycles(shape, isSideCenter, (c) => !isCenter(c) && !isSideCenter(c)),
  )
  const wingTable = once(() =>
    towerCycles(shape, isWing, (c) => !isCenter(c) && !isSideCenter(c) && !isWing(c)),
  )
  const centers = homesByColor(shape, isCenter, centerTable)
  const sideCenters = homesByColor(shape, isSideCenter, sideTable)
  const { colorsOf, homesFor } = wingEdges(shape, isWing)
  const wings = (state: Cube) => homesFor(colorsOf(state))(state)
  /** The wings paired, each edge given its colors once (two edges' swapped
   *  if that makes the wings even). */
  const pairWings = (cube: Cube) => {
    const odd = oddBlocks(homesFor(colorsOf(cube)), wingTable)(cube)
    return byCycles(wingTable, homesFor(colorsOf(cube, odd)))(cube)
  }

  const cornersOdd = (cube: Cube) => isOdd(homesByColors(shape, isCorner)(cube))
  const middleOdd = (cube: Cube) => isOdd(homesByColors(shape, isMiddleEdge)(cube))
  const wingsOdd = oddBlocks(homesByHand(shape, isWing), wingTable)
  /** Whether the middle edges lie turned: their colors of the left and
   *  right faces along z (all four alike: only the middle layer's quarter
   *  turns them, all at once). */
  const middleTurned = (cube: Cube) => {
    const sides = [faceColorsOf(shape).R, faceColorsOf(shape).L]
    const edge = cube.find(isMiddleEdge)!
    return edge.stickers.find((s) => sides.includes(s.color))!.normal[0] === 0
  }
  /**
   * Whether, once reduced, it would be one the Dominos and the middle layer
   * cannot finish: the corners', the wings' (as its edges will be) and the
   * middle edges' permutations, and the middle edges' turn, odd together (a
   * face turn changes two of them, the middle layer's two, an inner layer's
   * the wings' alone). Nothing in the reduction changes it.
   */
  const strange = (cube: Cube) =>
    [cornersOdd, wingsOdd, middleOdd, middleTurned].filter((odd) => odd(cube)).length % 2 === 1

  const all = allTurnsOf(shape)
  const centersDone = (cube: Cube) => placed(centers)(cube) && placed(sideCenters)(cube)
  const sideStep: StepSpec[] =
    top === 2
      ? [
          {
            key: 'stepTowerSideCenters',
            goal: centersDone,
            moves: all,
            phases: [byCycles(sideTable, sideCenters)],
          },
        ]
      : []
  return [
    {
      key: 'stepParity',
      goal: (cube) => !strange(cube),
      moves: all,
      phases: [(cube) => (strange(cube) ? parseMoves('2R2') : [])],
      optional: true,
    },
    {
      key: 'stepTowerTopCenters',
      goal: placed(centers),
      moves: all,
      phases: [byCycles(centerTable, centers)],
    },
    ...sideStep,
    {
      key: 'stepTowerEdges',
      goal: (cube) => centersDone(cube) && placed(wings)(cube),
      moves: all,
      phases: [pairWings],
    },
    ...outerDomino(shape),
    ...(top === 2 ? innerDomino(shape, 1, 2) : []),
    ...middleLayer(shape, top === 1 ? '2U' : '3U'),
  ]
}

export const TOWER443_PLAN = plan44('443')
export const TOWER445_PLAN = plan44('445')
