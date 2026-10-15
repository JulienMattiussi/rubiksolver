import type { ReactNode } from 'react'
import { SHAPE_PAD, type CubeShape } from '@/lib/core/types'
import type { PadKind } from '@/lib/puzzles/entry'
import { FtoPad } from './FtoPad'
import { GearPad } from './GearPad'
import { GhostPad } from './GhostPad'
import { CopterPad } from './CopterPad'
import { FashionPad } from './FashionPad'
import { MegaPad } from './MegaPad'
import { MovePad } from './MovePad'
import { PuckPad } from './PuckPad'
import { PyraPad } from './PyraPad'
import { RainbowPad } from './RainbowPad'
import { StarPad } from './StarPad'

/** Each kind of pad (a puzzle's card says which it shows). */
const PADS: Record<PadKind, (disabled: boolean) => ReactNode> = {
  faces: (disabled) => <MovePad disabled={disabled} />,
  star: (disabled) => <StarPad disabled={disabled} />,
  pyra: (disabled) => <PyraPad disabled={disabled} />,
  ghost: (disabled) => <GhostPad disabled={disabled} />,
  copter: (disabled) => <CopterPad disabled={disabled} />,
  fashion: (disabled) => <FashionPad disabled={disabled} />,
  puck: (disabled) => <PuckPad disabled={disabled} />,
  mega: (disabled) => <MegaPad disabled={disabled} />,
  crystal: (disabled) => <MegaPad disabled={disabled} crystal />,
  fto: (disabled) => <FtoPad disabled={disabled} />,
  rainbow: (disabled) => <RainbowPad disabled={disabled} />,
  dino: (disabled) => <RainbowPad disabled={disabled} dino />,
  rex: (disabled) => <RainbowPad disabled={disabled} rex />,
  skewb: (disabled) => <RainbowPad disabled={disabled} skewb />,
  masterSkewb: (disabled) => <RainbowPad disabled={disabled} master />,
  gear: (disabled) => <GearPad disabled={disabled} />,
}

/** The pad of turns of a shape. */
export const padFor = (shape: CubeShape, disabled: boolean): ReactNode =>
  PADS[SHAPE_PAD[shape]](disabled)
