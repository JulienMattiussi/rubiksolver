import type { CubeCategory, CubeShape } from '../core/types'
import { STANDARD } from './standard/catalog'
import { TOWER } from './tower/catalog'
import { FLAT } from './flat/catalog'
import { PYRAMID } from './pyramid/catalog'
import { POLYHEDRON } from './polyhedron/catalog'
import { ROUND } from './round/catalog'
import { GEAR } from './gear/catalog'
import { DIAGONAL } from './diagonal/catalog'
import { HOLEY } from './holey/catalog'
import { TWISTED } from './twisted/catalog'
import { BANDAGED } from './bandaged/catalog'

/**
 * Every puzzle the app knows, in the picker's order, each category's from
 * its folder's catalog.ts (see entry.ts for what a card holds). A new puzzle
 * adds a line there; its shape id is the line's key.
 */
const FAMILIES = {
  standard: STANDARD,
  tower: TOWER,
  flat: FLAT,
  pyramid: PYRAMID,
  polyhedron: POLYHEDRON,
  round: ROUND,
  gear: GEAR,
  diagonal: DIAGONAL,
  holey: HOLEY,
  twisted: TWISTED,
  bandaged: BANDAGED,
}

export const CATALOG = {
  ...STANDARD,
  ...TOWER,
  ...FLAT,
  ...PYRAMID,
  ...POLYHEDRON,
  ...ROUND,
  ...GEAR,
  ...DIAGONAL,
  ...HOLEY,
  ...TWISTED,
  ...BANDAGED,
}

/** The picker group of each puzzle: its folder's (a mirror's is 'mirror'). */
export const CATEGORY_OF = Object.fromEntries(
  Object.entries(FAMILIES).flatMap(([category, entries]) =>
    Object.keys(entries).map((shape) => [shape, category]),
  ),
) as Record<CubeShape, CubeCategory>
