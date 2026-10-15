import { cubeShape } from '../core/cube'
import { hasColoredClips, isGear, type Cube, type CubeShape } from '../core/types'
import { parseVecKey } from '../core/geometry'
import { barsTurned, faceKeyAt } from '../puzzles/bandaged/roadblock'
import type { EntryMarks } from '../puzzles/model'
import { boxCuts, cutsOf, entersCuts, type Cuts } from './cutsEditor'
import type { EditStickers } from './editor'
import { tablesFor } from './editorTables'
import { spinMates, spinsOf, turnedOf, type GearColors, type Spins } from './gearEditor'
import { entersJoints, fixedJoints, jointsOf, type Joint } from './jointsEditor'

/**
 * What some puzzles' entry sets before their colors, clicking the puzzle in
 * 3D, then accepting: a bandaged puzzle's joints (jointsEditor.ts), the
 * Fashion-V's halves (cutsEditor.ts), the RoadBlock-I's bars (which way
 * each face's lie) and a Gear Cube's gears (how far each is pivoted). The
 * colors are painted next, on the puzzle as set.
 */
export type Setup = 'joints' | 'cuts' | 'bars' | 'gears'

/** The setup a puzzle's entry starts with, if any. */
export function setupOf(shape: CubeShape): Setup | null {
  if (entersJoints(shape)) return 'joints'
  if (entersCuts(shape)) return 'cuts'
  if (shape === 'roadblock') return 'bars'
  return isGear(shape) ? 'gears' : null
}

/** What a click while setting turns, by key (lit up together under the
 *  pointer): a Fashion-V's cell's halves (by cell), a RoadBlock-I's face's
 *  centers, the gears pivoting together (`spinMates`); a bandaged puzzle's
 *  joints, the one clicked. */
export function setupTargets(setup: Setup, shape: CubeShape, key: string): readonly string[] {
  if (setup === 'gears') return spinMates(shape, key)
  if (setup !== 'bars') return [key]
  const face = faceKeyAt(parseVecKey(key))
  return tablesFor(shape)
    .slots.filter((s) => isBarCenter(s.position) && faceKeyAt(s.position) === face)
    .map((s) => s.key)
}

/** Whether a RoadBlock-I's slot is a center (one coordinate at the edge of
 *  its 5x5x5): a click on it turns its face's bars. */
export const isBarCenter = (position: readonly number[]): boolean =>
  position.filter((v) => Math.abs(v) === 2).length === 1

/** What the entry holds besides its colors. */
export interface Settings {
  /** A bandaged puzzle's joints. */
  readonly joints: readonly Joint[]
  /** The Fashion-V's cells, how their halves stand. */
  readonly cuts: Cuts
  /** Slots turned: a Z-Twist's side centers a quarter off, a Quarter
   *  Cube's faces a quarter on, by slot; a RoadBlock-I's faces whose bars
   *  lie a quarter off, by their middle center's slot. */
  readonly twisted: readonly string[]
  /** A Gear Cube's gears' pivots. */
  readonly spins: Spins
}

/** A fresh entry's settings: as solved. */
export function startSettings(shape: CubeShape): Settings {
  return {
    joints: entersJoints(shape) ? fixedJoints(shape) : [],
    cuts: entersCuts(shape) ? boxCuts() : {},
    twisted: [],
    spins: {},
  }
}

/** A state's settings, to enter it as it stands. */
export function settingsOf(cube: Cube): Settings {
  const shape = cubeShape(cube)
  return {
    joints: entersJoints(shape) ? jointsOf(cube) : [],
    cuts: entersCuts(shape) ? cutsOf(cube) : {},
    twisted:
      shape === 'roadblock'
        ? barsTurned(cube)
        : cube
            .filter((c) => c.spin === 1 && c.stickers.length === 1)
            .map((c) => c.position.join(',')),
    spins: isGear(shape) ? spinsOf(cube) : {},
  }
}

/** The marks an entry builds its state with (`buildCube`): its slots
 *  turned (an Ultimate's gears over on their clips, read from their colors)
 *  and its gears' pivots; null when a gear is not its clips' colors. */
export function marksOf(
  shape: CubeShape,
  settings: Settings,
  edit: EditStickers,
  gear: GearColors,
): EntryMarks | null {
  const turned = hasColoredClips(shape) ? turnedOf(gear, edit, shape) : settings.twisted
  return turned && { turned, spins: settings.spins }
}
