import { useState } from 'react'
import { cubeDims, cubeShape } from '@/lib/core/cube'
import { describeMove } from '@/lib/app/moveGuide'
import { turnAllowed } from '@/lib/core/turn'
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
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'
import { SECTION_LABEL, TURN_PAIR } from '@/components/ui/styles'
import { PadButton } from './PadButton'
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
 * Hovering or focusing a button highlights the pieces it would turn.
 */
export function MovePad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const shape = useCube((s) => cubeShape(s.cube))
  const cube = useCube((s) => s.cube)
  const dims = cubeDims(cube)
  const moves = movesFor(shape)
  const advanced = advancedMovesFor(shape)
  // The VTO turns its corners wide, its tips alone outer: corners first.
  const vto = shape === 'vto'
  const tabs: PadTab[] = [
    ...(
      (vto ? ['wide', 'outer'] : ['outer', 'slice', 'slice3', 'wide', 'wide3']) as LayerKind[]
    ).filter((k) => moves.some((m) => layerKindOf(m) === k)),
    ...(advanced.length ? (['advanced'] as const) : []),
  ]
  /** A tab with a turn the state lets through. */
  const playable = (k: PadTab) =>
    (k === 'advanced' ? advanced : moves.filter((m) => layerKindOf(m) === k)).some((m) =>
      turnAllowed(cube, m),
    )
  // On a new puzzle, the first tab where something turns (a tab may hold
  // only turns the state jams).
  const [picked, setPicked] = useState<{ shape: string; tab: PadTab | null }>({
    shape: '',
    tab: null,
  })
  if (picked.shape !== shape) setPicked({ shape, tab: tabs.find(playable) ?? null })
  const tab = picked.shape === shape ? picked.tab : null
  const setTab = (next: PadTab) => setPicked({ shape, tab: next })
  const current = tab && tabs.includes(tab) ? tab : tabs[0]!
  const faces = FACES.filter((face) => moves.some((m) => m.face === face))
  const advancedLayers = advanced.filter(
    (m, i) => !advanced.slice(0, i).some((n) => sameLayer(n, m)),
  )
  /** The rows of buttons a tab shows, three layers a row. */
  const rowsOf = (k: PadTab) => Math.ceil((k === 'advanced' ? advancedLayers : faces).length / 3)
  // Every kind of layer stacked, each under its name, when they all fit
  // (as many rows as the Megaminx's pad); tabs otherwise.
  const stacked = tabs.length > 1 && tabs.reduce((n, k) => n + rowsOf(k), 0) <= STACKED_ROWS
  const nameOf = (k: PadTab) =>
    vto && (k === 'outer' || k === 'wide') ? t.vtoLayerKinds[k] : t.layerKinds[k]

  /** A tab's buttons. */
  const grid = (tabShown: PadTab) => {
    const kind: LayerKind = tabShown === 'advanced' ? 'outer' : tabShown
    const turn = (face: Face, amount: 1 | 2 | 3): Move => layerMove(face, amount, kind)
    /** The face has this kind of layer (the slim tower's sides have no wide
     *  turn: their axis is two layers deep). */
    const offered = (face: Face) => moves.some((m) => m.face === face && layerKindOf(m) === kind)

    const button = (move: Move, exists: boolean, ghost: boolean) => {
      const name = t.faceNames[move.face]
      const jammed = exists && !turnAllowed(cube, move)
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
          move={exists ? move : null}
          label={formatMove(move, labels, dims)}
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
      <div className="grid grid-cols-3 gap-2">
        {tabShown === 'advanced'
          ? advancedLayers.map((layer) =>
              pair(
                formatMove(layer),
                (amount) => ({ ...layer, amount }),
                advanced.some((m) => sameLayer(m, layer) && m.amount === 1),
                true,
              ),
            )
          : faces.map((face) =>
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

  if (stacked) {
    return (
      <div>
        <PadHeader />
        {tabs.map((k) => (
          <div key={k} className="mb-2">
            <p className={`${SECTION_LABEL} mb-1`}>{nameOf(k)}</p>
            {grid(k)}
          </div>
        ))}
      </div>
    )
  }
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
            options={tabs.map((k) => {
              const name = nameOf(k)
              // Five kinds (a 6x6's) only fit written as turns: R, 2R, 3R, Rw, 3Rw.
              return tabs.length > 4 && k !== 'advanced'
                ? {
                    value: k,
                    label: formatMove(layerMove('R', 1, k), labels),
                    title: name,
                    literal: true,
                  }
                : { value: k, label: name }
            })}
          />
        </div>
      )}
      {grid(current)}
    </div>
  )
}

/** Rows of buttons a pad stacks at most, every kind of layer at once (as
 *  many as the Megaminx's): past them, the kinds go in tabs. */
export const STACKED_ROWS = 6
