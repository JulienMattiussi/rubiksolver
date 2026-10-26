import { faceColorsOf, solvedCube } from '../../core/cube'
import { faceOfNormal } from '../../core/geometry'
import { hasColoredClips, type CubeShape } from '../../core/shapes'
import type { PuzzleModel } from '../model'
import { gearGuide } from '../guides'
import { gearTurnsOf, plainFaces, scrambleGear, withGears } from './gear'
import { gearEntry } from './gearEntry'

/** A 3x3 in its own colors, its edges gears. */
const gears = (shape: CubeShape, wholeSlices: boolean): PuzzleModel => ({
  // Scanned its gears lined up (its card's `scanBefore`): as a 3x3, its
  // edges read on their gears; on their clips too when these bear colors.
  scan: hasColoredClips(shape) ? 'gears' : 'grid',
  guide: () => gearGuide(shape, plainFaces(shape)),
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
  // Entered in the cube's shape: its gears pivoted as entered, some maybe
  // turned over on their clips (gearEntry.ts).
  entry: {
    ...gearEntry(shape, wholeSlices),
    ...(wholeSlices && { wholeSlices: true }),
  },
})

export const GEAR_MODELS = {
  gearCube: gears('gearCube', true),
  gearU: gears('gearU', true),
  // Its slices move its centers off the top and bottom, which its middle
  // layer, never moving, holds where they are; its gears go each on their own.
  gearX: gears('gearX', false),
} satisfies Partial<Record<CubeShape, PuzzleModel>>
