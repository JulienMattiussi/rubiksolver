import type { ComponentType } from 'react'
import type { CubeShape } from '@/lib/core/types'
import type { IsoDrawing } from '@/three/core/isoKit'
import type { OwnPieceProps } from '@/three/core/Cubie'
import { GearEditView } from './gear/GearEditView'
import { GearPiece } from './gear/GearPiece'
import { gearThumbnail } from './gear/gearThumbnail'

/**
 * The puzzles drawn from their own pieces rather than plain cubies or
 * polygons, each from its folder: what the scene shows them with (their
 * edit view), the piece each cubie is drawn as (`piece`, in Cubie), and
 * their thumbnail.
 */
interface OwnViews {
  readonly edit: ComponentType
  readonly piece: ComponentType<OwnPieceProps>
  readonly thumbnail: (shape: CubeShape) => IsoDrawing
}

const GEARS: OwnViews = { edit: GearEditView, piece: GearPiece, thumbnail: gearThumbnail }

const OWN_VIEWS: Partial<Record<CubeShape, OwnViews>> = {
  gearCube: GEARS,
  gearU: GEARS,
  gearX: GEARS,
}

/** A puzzle's own views, if it has them. */
export const ownViewsOf = (shape: CubeShape): OwnViews | undefined => OWN_VIEWS[shape]
