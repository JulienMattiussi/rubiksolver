import type { CubeShape } from '../core/types'
import { DIAGONAL_MODELS } from './diagonal/models'
import { FLAT_MODELS } from './flat/models'
import { GEAR_MODELS } from './gear/models'
import { HOLEY_MODELS } from './holey/models'
import type { PuzzleModel } from './model'
import { POLYHEDRON_MODELS } from './polyhedron/models'
import { PYRAMID_MODELS } from './pyramid/models'
import { ROUND_MODELS } from './round/models'
import { STANDARD_MODELS } from './standard/models'
import { TOWER_MODELS } from './tower/models'
import { TWISTED_MODELS } from './twisted/models'

/** Each puzzle's model, where it has one (a plain cuboid has none). */
export const MODELS: Partial<Record<CubeShape, PuzzleModel>> = {
  ...STANDARD_MODELS,
  ...TOWER_MODELS,
  ...FLAT_MODELS,
  ...PYRAMID_MODELS,
  ...POLYHEDRON_MODELS,
  ...ROUND_MODELS,
  ...GEAR_MODELS,
  ...DIAGONAL_MODELS,
  ...HOLEY_MODELS,
  ...TWISTED_MODELS,
}
