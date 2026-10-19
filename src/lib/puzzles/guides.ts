import { layerRows, type GuideGroup } from '../core/guide'
import { FACES } from '../core/moves'
import type {
  CubeShape,
  Face,
  GearMove,
  MegaMove,
  PuckMove,
  PuckSteps,
  PyraMove,
  PyraShape,
  RainbowCorner,
  RainbowMove,
  RingMove,
  StarMove,
  StarShape,
} from '../core/types'
import { COPTER_TURNS } from './diagonal/copter'
import { GHOST_TURNS } from './flat/ghost'
import { FTO_TURNS } from './polyhedron/fto'
import { MEGA_FACES } from './polyhedron/megaminx'
import { isOppositeFace, PYRA_LAYERS, PYRA_VERTICES, pyraTurn } from './pyramid/pyraminx'
import { STAR_RINGS } from './round/star'
import { RAINBOW_TRIANGLES } from './shared/rainbow'

/**
 * The move guides of the puzzles that do not turn as a cube, by family:
 * each model says which is its own (`PuzzleModel.guide`). Every layer shows
 * its two directions side by side, then its bigger amounts.
 */

/** A star prism's rings (one, two pieces either way, then three: a half
 *  turn), then its slash. */
export const starGuide = (shape: StarShape): GuideGroup[] => {
  const ring = (r: RingMove['ring'], amount: RingMove['amount']): StarMove => ({ ring: r, amount })
  return [
    {
      section: 'rings',
      rows: STAR_RINGS[shape].flatMap((r) => [
        [ring(r, 1), ring(r, 5)],
        [ring(r, 2), ring(r, 4)],
        [ring(r, 3)],
      ]),
    },
    { section: 'slash', rows: [[{ slash: true }]] },
  ]
}

/** Each kind of layer (the Pyraminx's layers then tips; the Master's tips
 *  then slices), every corner, both ways. */
export const pyraGuide = (shape: PyraShape): GuideGroup[] =>
  PYRA_LAYERS[shape].map((layer) => ({
    // The last slice is a face: under the faces' heading.
    section: isOppositeFace(shape, layer) ? 'faces' : layer,
    rows: PYRA_VERTICES.map((vertex) =>
      ([1, 2] as const).map((amount): PyraMove => pyraTurn(vertex, layer, amount)),
    ),
  }))

/** The Floppy Ghost's sides, each a half turn. */
export const ghostGuide = (): GuideGroup[] => [
  { section: 'sides', rows: GHOST_TURNS.map((turn) => [turn]) },
]

/** A Curvy Copter's edges, each a half turn. */
export const copterGuide = (): GuideGroup[] => [
  { section: 'edges', rows: COPTER_TURNS.map((turn) => [turn]) },
]

/** The Hockey Puck's layers, one to three twelfths either way, then its
 *  slash. */
export const puckGuide = (): GuideGroup[] => {
  const layer = (layer: 'U' | 'D'): PuckMove[][] =>
    [1, 2, 3].map((k): PuckMove[] => [
      { layer, steps: k as PuckSteps },
      { layer, steps: (12 - k) as PuckSteps },
    ])
  return [
    { section: 'rings', rows: [...layer('U'), ...layer('D')] },
    { section: 'slash', rows: [[{ flip: true }]] },
  ]
}

/** A Gear Cube's gears both ways, then each three times in a row (the gears
 *  go round, the cube is back); its `plain` faces, turning as a 3x3's (the
 *  Extreme's top and bottom), first. */
export const gearGuide = (shape: CubeShape, plain: readonly Face[]): GuideGroup[] => {
  const gears = FACES.filter((f) => !plain.includes(f))
  const row = (gear: Face) => ([1, 3] as const).map((amount): GearMove => ({ gear, amount }))
  return [
    ...(plain.length
      ? [
          {
            section: 'faces' as const,
            rows: plain.flatMap((face) => layerRows(shape, { face, amount: 1 })),
          },
        ]
      : []),
    { section: 'gears', rows: gears.map(row) },
    { section: 'gearsThrice', rows: gears.map((gear) => [{ gear, amount: 1, times: 3 }]) },
  ]
}

/** A Megaminx's faces (a Crystal's), a fifth either way, then two. */
export const megaGuide = (crystal: boolean): GuideGroup[] => [
  {
    section: 'faces',
    rows: MEGA_FACES.flatMap((megaFace) =>
      [[1, 4] as const, [2, 3] as const].map((amounts) =>
        amounts.map((amount): MegaMove => ({ megaFace, amount, ...(crystal && { crystal }) })),
      ),
    ),
  },
]

/** A Rainbow-like turn's row: a third either way. */
const thirds = (turn: Omit<RainbowMove, 'amount'>) =>
  ([1, 2] as const).map((amount): RainbowMove => ({ ...turn, amount }))

/** The Rainbow's triangles. */
export const triangleGuide = (): GuideGroup[] => [
  { section: 'triangles', rows: RAINBOW_TRIANGLES.map((triangle) => thirds({ triangle })) },
]

/** The FTO's faces as its pad lays them out (the top face and the three
 *  beside it, the bottom's), then its slices. */
export const ftoGuide = (): GuideGroup[] => {
  const faces: RainbowCorner[] = ['U', 'u', 'R', 'L', 'd', 'D', 'r', 'l']
  return [
    { section: 'faces', rows: faces.map((triangle) => thirds({ triangle, fto: true })) },
    { section: 'middle', rows: FTO_TURNS.filter((m) => m.amount === 1 && m.slice).map(thirds) },
  ]
}

/** The Dino's corners: the top's, then the bottom's (front right first). */
const DINO_CORNERS: readonly RainbowCorner[] = ['U', 'u', 'l', 'L', 'R', 'r', 'd', 'D']

/** A Dino Cube's corners (a Rex Cube's, a Skewb's: `cut`). */
export const dinoGuide = (cut: Pick<RainbowMove, 'rex' | 'skewb'> = {}): GuideGroup[] => [
  {
    section: 'dinoCorners',
    rows: DINO_CORNERS.map((triangle) => thirds({ triangle, dino: true, ...cut })),
  },
]

/** The Master Skewb's corners' outer layers, then its four inner ones. */
export const masterSkewbGuide = (): GuideGroup[] => {
  const turn = (triangle: RainbowCorner, slice?: true) =>
    thirds({ triangle, dino: true, master: true, ...(slice && { slice }) })
  return [
    { section: 'dinoCorners', rows: DINO_CORNERS.map((c) => turn(c)) },
    { section: 'middle', rows: (['D', 'R', 'd', 'r'] as const).map((c) => turn(c, true)) },
  ]
}
