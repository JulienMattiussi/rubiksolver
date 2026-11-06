import { cubeDims, cubeShape } from '@/lib/core/cube'
import { describeMove } from '@/lib/app/moveGuide'
import { turnAllowed } from '@/lib/core/turn'
import {
  advancedMovesFor,
  FACES,
  layerKindOf,
  layerMove,
  movesFor,
  sameLayer,
  type LayerKind,
} from '@/lib/core/moves'
import { formatMove } from '@/lib/core/notation'
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
 * new puzzle the pad opens on the first one where a turn goes. Each kind
 * shows only the faces that have that kind of layer (no button for a turn
 * the model does not make: a slim tower's sides have no slice); a turn the
 * state jams (a tower's incomplete end, see `turnAllowed`) stays disabled.
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
  const unlocked = useCube((s) => s.unlocked)
  const moves = movesFor(shape, unlocked)
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
  /** The faces a kind of layer turns: its buttons, and only them. */
  const facesOf = (kind: LayerKind) =>
    FACES.filter((face) => moves.some((m) => m.face === face && layerKindOf(m) === kind))
  const advancedLayers = advanced.filter(
    (m, i) => !advanced.slice(0, i).some((n) => sameLayer(n, m)),
  )
  /** The rows of buttons a tab shows, three layers a row. */
  const rowsOf = (k: PadTab) =>
    Math.ceil((k === 'advanced' ? advancedLayers : facesOf(k)).length / 3)
  /** The third layer is the middle one (a 5x5's 3R): named by R, U and F
   *  only, never by their opposite faces. */
  const middle = !moves.some((m) => layerKindOf(m) === 'slice3' && ['L', 'D', 'B'].includes(m.face))
  const nameOf = (k: PadTab) =>
    corners && (k === 'outer' || k === 'wide')
      ? t.vtoLayerKinds[k]
      : k === 'slice3' && middle
        ? t.layerKinds.middle
        : t.layerKinds[k]

  /** A tab's buttons. */
  const grid = (tabShown: PadTab) => {
    const kind: LayerKind = tabShown === 'advanced' ? 'outer' : tabShown
    const turn = (face: Face, amount: 1 | 2 | 3): Move => layerMove(face, amount, kind)
    const faces = facesOf(kind)

    const button = (move: Move, ghost: boolean) => {
      const name = t.faceNames[move.face]
      // Held another way (the tutorial): the button names a side where it
      // stands, and turns that side of the puzzle.
      const played = held(move)
      const jammed = !turnAllowed(cube, played)
      const title = jammed
        ? t.jammedTurn(name)
        : tabShown === 'advanced'
          ? t.describeMove(describeMove(move, shape))
          : move.amount === 2
            ? t.moveTitleHalf(name)
            : t.moveTitle(name, move.amount === 1, kind)
      return (
        <PadButton
          key={formatMove(move)}
          move={played}
          label={formatMove(move, labels, dims, shape)}
          title={title}
          disabled={disabled || jammed}
          ghost={ghost}
          compact={tabShown !== 'outer'}
        />
      )
    }

    // Labels of four characters (a 6x6's 3Uw') want two pairs a row.
    const wide = faces.some((f) => formatMove(turn(f, 3), labels, dims, shape).length > 3)

    /** One layer's buttons: both quarter turns, the one written without a
     *  prime first (a slice named otherwise than its face: the slim tower's
     *  M is its 2U'), or the half turn alone; a column wide at least, a
     *  row not full stretched to the pad's width (justified). */
    const pair = (key: string, layer: (amount: 1 | 2 | 3) => Move, quarter: boolean) => {
      const primed = formatMove(layer(1), labels, dims, shape).endsWith("'")
      const [first, second] = primed ? [layer(3), layer(1)] : [layer(1), layer(3)]
      return (
        <div key={key} className={`${TURN_PAIR} ${wide ? HALF_ROW : THIRD_ROW}`}>
          {quarter ? (
            <>
              {button(first, false)}
              {button(second, true)}
            </>
          ) : (
            button(layer(2), false)
          )}
        </div>
      )
    }

    return (
      <div className="flex flex-wrap gap-2">
        {tabShown === 'advanced'
          ? advancedLayers.map((layer) =>
              pair(
                formatMove(layer),
                (amount) => ({ ...layer, amount }),
                advanced.some((m) => sameLayer(m, layer) && m.amount === 1),
              ),
            )
          : faces.map((face) =>
              pair(
                face,
                (amount) => turn(face, amount),
                moves.some((m) => m.face === face && layerKindOf(m) === kind && m.amount === 1),
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

/** A pair's width: a third (or a half) of the row, less the gaps between,
 *  grown to fill a row not full. */
const THIRD_ROW = 'grow basis-[calc((100%-1rem)/3)]'
const HALF_ROW = 'grow basis-[calc((100%-0.5rem)/2)]'

/** Whether a kind of layer turns an outer face (alone or with the layers
 *  behind it): the pad's outer tab. */
const isOuter = (k: PadTab) => k === 'outer' || k === 'wide' || k === 'wide3'
