import { cubeDims, cubeShape } from '@/lib/core/cube'
import { describeMove } from '@/lib/app/moveGuide'
import { turnAllowed } from '@/lib/core/turn'
import { FACE_NORMAL, faceOfNormal, mapVec } from '@/lib/core/geometry'
import {
  advancedMovesFor,
  formatMove,
  FACES,
  layerKindOf,
  layerMove,
  movesFor,
  sameLayer,
  type LayerKind,
} from '@/lib/core/moves'
import type { Face, Move } from '@/lib/core/types'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { TURN_PAIR } from '@/components/ui/styles'
import { LayerTabs } from './LayerTabs'
import { PadButton } from './PadButton'
import { useHeldTurn } from './useHeldTurn'
import { PadHeader } from './PadHeader'

/** A tab of the pad: a kind of layer, or the shape's advanced turns. */
type PadTab = LayerKind | 'advanced'

/**
 * Manual rotation pad, built from the turns the shape allows (`movesFor`):
 * one clockwise + one counter-clockwise button per face, a single half-turn
 * button where the puzzle has no quarter turn (every face of a 1x2x3), and
 * nothing for a face whose axis has a single layer. When the shape has other
 * layer kinds (the outer face, the inner slice: 2R, a 6x6's 3R too, or the
 * face with the layers behind it: Rw, 3Rw, as SHAPE_INNER_TURNS offers
 * them, plus the turns kept apart, `advancedMovesFor`: the 3x3's M, E, S and
 * wide turns), they are stacked, each under its name, when they all fit in
 * six rows; past that, a selector picks the kind the buttons turn, and on a
 * new puzzle the pad opens on the first one where a turn goes. A face
 * without that kind of layer (a slim tower's side) or a turn the state jams
 * (a tower's incomplete end, see `turnAllowed`) stays disabled.
 * Hovering or focusing a button highlights the pieces it would turn. In the
 * tutorial, the pad reads as the puzzle is held for its step
 * (`tutorialStore.hold`): `R` turns the side on your right. With `corners`
 * (the VTO, which turns its corners wide and its tips alone outer), those
 * two come first, named so.
 */
export function MovePad({ disabled, corners }: { disabled: boolean; corners?: boolean }) {
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const shape = useCube((s) => cubeShape(s.cube))
  const cube = useCube((s) => s.cube)
  const dims = cubeDims(cube)
  const held = useHeldTurn()
  const moves = movesFor(shape)
  const advanced = advancedMovesFor(shape)
  const kinds: PadTab[] = [
    ...(
      (corners ? ['wide', 'outer'] : ['outer', 'slice', 'slice3', 'wide', 'wide3']) as LayerKind[]
    ).filter((k) => moves.some((m) => layerKindOf(m) === k)),
    ...(advanced.length ? (['advanced'] as const) : []),
  ]
  /** A tab with a turn the state lets through. */
  const playable = (k: PadTab) =>
    (k === 'advanced' ? advanced : moves.filter((m) => layerKindOf(m) === k)).some((m) =>
      turnAllowed(cube, m),
    )
  const faces = FACES.filter((face) => moves.some((m) => m.face === face))
  const advancedLayers = advanced.filter(
    (m, i) => !advanced.slice(0, i).some((n) => sameLayer(n, m)),
  )
  /** The rows of buttons a tab shows, three layers a row. */
  const rowsOf = (k: PadTab) => Math.ceil((k === 'advanced' ? advancedLayers : faces).length / 3)
  const nameOf = (k: PadTab) =>
    corners && (k === 'outer' || k === 'wide') ? t.vtoLayerKinds[k] : t.layerKinds[k]

  /** A tab's buttons. */
  const grid = (tabShown: PadTab) => {
    const kind: LayerKind = tabShown === 'advanced' ? 'outer' : tabShown
    const turn = (face: Face, amount: 1 | 2 | 3): Move => layerMove(face, amount, kind)
    /** The face has this kind of layer (the slim tower's sides have no wide
     *  turn: their axis is two layers deep). */
    const offered = (face: Face) => moves.some((m) => m.face === face && layerKindOf(m) === kind)
    /** A middle slice is shown once, under the face that names it (2U for
     *  E, not 2D as well). */
    const opposite = (face: Face) => faceOfNormal(mapVec(FACE_NORMAL[face], (v) => -v + 0))
    const named = (face: Face) => offered(face) || !offered(opposite(face))

    const button = (move: Move, exists: boolean, ghost: boolean) => {
      const name = t.faceNames[move.face]
      // Held another way (the tutorial): the button names a side where it
      // stands, and turns that side of the puzzle.
      const played = held(move)
      const jammed = exists && !turnAllowed(cube, played)
      const title = !exists
        ? t.noSuchLayer(name, kind)
        : jammed
          ? t.jammedTurn(name)
          : tabShown === 'advanced'
            ? t.describeMove(describeMove(move, shape))
            : move.amount === 2
              ? t.moveTitleHalf(name)
              : t.moveTitle(name, move.amount === 1, kind)
      return (
        <PadButton
          key={formatMove(move)}
          move={exists ? played : null}
          label={formatMove(move, labels, dims, shape)}
          title={title}
          disabled={disabled || jammed}
          ghost={ghost}
          compact={tabShown !== 'outer'}
        />
      )
    }

    /** One layer's buttons: both quarter turns, or the half turn alone. */
    const pair = (
      key: string,
      layer: (amount: 1 | 2 | 3) => Move,
      quarter: boolean,
      exists: boolean,
    ) => (
      <div key={key} className={TURN_PAIR}>
        {quarter ? (
          <>
            {button(layer(1), exists, false)}
            {button(layer(3), exists, true)}
          </>
        ) : (
          button(layer(2), exists, false)
        )}
      </div>
    )

    return (
      // Labels of four characters (a 6x6's 3Uw') want two pairs a row.
      <div
        className={`grid gap-2 ${
          faces.some((f) => formatMove(turn(f, 3), labels, dims, shape).length > 3)
            ? 'grid-cols-2'
            : 'grid-cols-3'
        }`}
      >
        {tabShown === 'advanced'
          ? advancedLayers.map((layer) =>
              pair(
                formatMove(layer),
                (amount) => ({ ...layer, amount }),
                advanced.some((m) => sameLayer(m, layer) && m.amount === 1),
                true,
              ),
            )
          : faces.filter(named).map((face) =>
              pair(
                face,
                (amount) => turn(face, amount),
                moves.some((m) => m.face === face && m.amount === 1),
                offered(face),
              ),
            )}
      </div>
    )
  }

  return (
    <div>
      <PadHeader />
      <LayerTabs
        shape={shape}
        kinds={kinds}
        rows={rowsOf}
        isOuter={isOuter}
        playable={playable}
        nameOf={nameOf}
        grid={grid}
      />
    </div>
  )
}

/** Whether a kind of layer turns an outer face (alone or with the layers
 *  behind it): the pad's outer tab. */
const isOuter = (k: PadTab) => k === 'outer' || k === 'wide' || k === 'wide3'
