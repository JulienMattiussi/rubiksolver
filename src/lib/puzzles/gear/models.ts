import { faceColorsOf, solvedCube } from '../../core/cube'
import { faceOfNormal } from '../../core/geometry'
import { hasColoredClips, type CubeShape } from '../../core/types'
import type { PuzzleModel } from '../model'
import { gearTurnsOf, scrambleGear, withGears, withTurnedGears } from './gear'

/** A 3x3 in its own colors, its edges gears. */
const gears = (shape: CubeShape): PuzzleModel => ({
  solved: () => {
    const colors = faceColorsOf(shape)
    return withGears(
      solvedCube('3').map((c) => ({
        ...c,
        stickers: c.stickers.map((s) => ({ ...s, color: colors[faceOfNormal(s.normal)] })),
      })),
      !hasColoredClips(shape),
      shape,
    )
  },
  turns: () => gearTurnsOf(shape),
  scramble: (length, rng) => scrambleGear(shape, length, rng),
  // Entered in the cube's shape: its gears at rest, some maybe turned over
  // on their clips.
  entry: {
    built: (cube, turned) =>
      hasColoredClips(shape) ? withTurnedGears(cube, turned, shape) : withGears(cube, true, shape),
  },
})

export const GEAR_MODELS = {
  gearCube: gears('gearCube'),
  gearU: gears('gearU'),
  gearX: gears('gearX'),
} satisfies Partial<Record<CubeShape, PuzzleModel>>
