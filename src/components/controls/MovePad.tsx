import { useEffect, useState } from 'react'
import { cubeDims, cubeShape } from '@/lib/cube'
import { describeMove } from '@/lib/moveGuide'
import { turnAllowed } from '@/lib/turn'
import {
  advancedMovesFor,
  formatMove,
  FACES,
  layerKindOf,
  movesFor,
  sameLayer,
  type LayerKind,
} from '@/lib/moves'
import type { Face, Move } from '@/lib/types'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { useView } from '@/store/viewStore'
import { Button } from '@/components/ui/Button'
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'
import { TURN_PAIR } from '@/components/ui/styles'
import { PadHeader } from './PadHeader'

/** A tab of the pad: a kind of layer, or the shape's advanced turns. */
type PadTab = LayerKind | 'advanced'

/**
 * Manual rotation pad, built from the turns the shape allows (`movesFor`):
 * one clockwise + one counter-clockwise button per face, a single half-turn
 * button where the puzzle has no quarter turn (every face of a 1x2x3), and
 * nothing for a face whose axis has a single layer. When the shape has other
 * layer kinds, a selector picks what the buttons turn: the outer face, the
 * inner slice (2R) or both layers together (Rw), as SHAPE_INNER_TURNS
 * offers them, plus an "advanced" tab for the turns kept apart
 * (`advancedMovesFor`: the 3x3's M, E, S and wide turns). A face without
 * that kind of layer (a slim tower's side) or a turn the state jams (a
 * tower's incomplete end, see `turnAllowed`) stays disabled.
 * Hovering or focusing a button highlights the pieces it would turn.
 */
export function MovePad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const pushMove = useCube((s) => s.pushMove)
  const shape = useCube((s) => cubeShape(s.cube))
  const cube = useCube((s) => s.cube)
  const dims = cubeDims(cube)
  const [tab, setTab] = useState<PadTab>('outer')
  const setPreview = useView((s) => s.setPreview)
  useEffect(() => () => setPreview(null), [setPreview])
  const moves = movesFor(shape)
  const advanced = advancedMovesFor(shape)
  const tabs: PadTab[] = [
    ...(['outer', 'slice', 'wide'] as const).filter((k) => moves.some((m) => layerKindOf(m) === k)),
    ...(advanced.length ? (['advanced'] as const) : []),
  ]
  const current = tabs.includes(tab) ? tab : 'outer'
  const kind: LayerKind = current === 'advanced' ? 'outer' : current
  const turn = (face: Face, amount: 1 | 2 | 3): Move =>
    kind === 'slice'
      ? { face, amount, depth: 2 }
      : kind === 'wide'
        ? { face, amount, depth: 2, wide: true }
        : { face, amount }
  /** The face has the selected kind of layer (the slim tower's sides have
   *  no wide turn: their axis is two layers deep). */
  const offered = (face: Face) => moves.some((m) => m.face === face && layerKindOf(m) === kind)

  const button = (move: Move, exists: boolean, ghost: boolean) => {
    const name = t.faceNames[move.face]
    const jammed = exists && !turnAllowed(cube, move)
    const title = !exists
      ? t.noSuchLayer(name, kind)
      : jammed
        ? t.jammedTurn(name)
        : current === 'advanced'
          ? t.describeMove(describeMove(move, shape))
          : move.amount === 2
            ? t.moveTitleHalf(name)
            : t.moveTitle(name, move.amount === 1, kind)
    const show = () => setPreview(exists ? move : null)
    const hide = () => setPreview(null)
    const compact = current !== 'outer'
    // The wrapper hears the pointer even while the button is disabled, so the
    // highlight never sticks once a click starts the animation.
    return (
      <div className="flex flex-1" onPointerEnter={show} onPointerLeave={hide}>
        <Button
          disabled={disabled || !exists || jammed}
          onFocus={show}
          onBlur={hide}
          onClick={() => pushMove(move)}
          variant={ghost ? 'ghost' : undefined}
          className={`flex-1 rounded-none whitespace-nowrap ${compact ? 'px-1 text-xs' : 'px-2'}`}
          aria-label={title}
          title={title}
        >
          {formatMove(move, labels, dims)}
        </Button>
      </div>
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

  const advancedLayers = advanced.filter(
    (m, i) => !advanced.slice(0, i).some((n) => sameLayer(n, m)),
  )
  return (
    <div>
      <PadHeader />
      {tabs.length > 1 && (
        <div className="mb-2">
          <SegmentedToggle
            size="sm"
            ariaLabel={t.layerLabel}
            value={current}
            onChange={setTab}
            options={tabs.map((k) => ({ value: k, label: t.layerKinds[k] }))}
          />
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {current === 'advanced'
          ? advancedLayers.map((layer) =>
              pair(
                formatMove(layer),
                (amount) => ({ ...layer, amount }),
                advanced.some((m) => sameLayer(m, layer) && m.amount === 1),
                true,
              ),
            )
          : FACES.filter((face) => moves.some((m) => m.face === face)).map((face) =>
              pair(
                face,
                (amount) => turn(face, amount),
                moves.some((m) => m.face === face && m.amount === 1),
                offered(face),
              ),
            )}
      </div>
    </div>
  )
}
