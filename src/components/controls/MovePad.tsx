import { useEffect, useState } from 'react'
import { cubeShape } from '@/lib/cube'
import { turnAllowed } from '@/lib/turn'
import { formatMove, FACES, layerKindOf, movesFor, type LayerKind } from '@/lib/moves'
import type { Face, Move } from '@/lib/types'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { useView } from '@/store/viewStore'
import { Button } from '@/components/ui/Button'
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'
import { NotationToggle } from './NotationToggle'
import { RecenterButton } from './RecenterButton'
import { SECTION_LABEL } from '@/components/ui/styles'

/**
 * Manual rotation pad, built from the turns the shape allows (`movesFor`):
 * one clockwise + one counter-clockwise button per face, a single half-turn
 * button where the puzzle has no quarter turn (every face of a 1x2x3), and
 * nothing for a face whose axis has a single layer. When the shape has other
 * layer kinds, a selector picks what the buttons turn: the outer face, the
 * inner slice (2R) or both layers together (Rw), as SHAPE_INNER_TURNS
 * offers them. A face without that kind of layer (a slim tower's side) or a
 * turn the state jams (a tower's incomplete end, see `turnAllowed`) stays
 * disabled.
 * Hovering or focusing a button highlights the pieces it would turn.
 */
export function MovePad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const pushMove = useCube((s) => s.pushMove)
  const shape = useCube((s) => cubeShape(s.cube))
  const cube = useCube((s) => s.cube)
  const [layerKind, setLayerKind] = useState<LayerKind>('outer')
  const setPreview = useView((s) => s.setPreview)
  useEffect(() => () => setPreview(null), [setPreview])
  const moves = movesFor(shape)
  const kinds = (['outer', 'slice', 'wide'] as const).filter((k) =>
    moves.some((m) => layerKindOf(m) === k),
  )
  const kind = kinds.includes(layerKind) ? layerKind : 'outer'
  const quarter = (face: Face) => moves.some((m) => m.face === face && m.amount === 1)
  const turn = (face: Face, amount: 1 | 2 | 3): Move =>
    kind === 'slice'
      ? { face, amount, depth: 2 }
      : kind === 'wide'
        ? { face, amount, depth: 2, wide: true }
        : { face, amount }
  /** The face has the selected kind of layer (the slim tower's sides have
   *  no wide turn: their axis is two layers deep). */
  const offered = (face: Face) => moves.some((m) => m.face === face && layerKindOf(m) === kind)
  const button = (face: Face, amount: 1 | 2 | 3, ghost: boolean) => {
    const exists = offered(face)
    const jammed = exists && !turnAllowed(cube, turn(face, amount))
    const title = !exists
      ? t.noSuchLayer(t.faceNames[face], kind)
      : jammed
        ? t.jammedTurn(t.faceNames[face])
        : amount === 2
          ? t.moveTitleHalf(t.faceNames[face])
          : t.moveTitle(t.faceNames[face], amount === 1, kind)
    const show = () => setPreview(exists ? turn(face, amount) : null)
    const hide = () => setPreview(null)
    // The wrapper hears the pointer even while the button is disabled, so the
    // highlight never sticks once a click starts the animation.
    return (
      <div className="flex flex-1" onPointerEnter={show} onPointerLeave={hide}>
        <Button
          disabled={disabled || !exists || jammed}
          onFocus={show}
          onBlur={hide}
          onClick={() => pushMove(turn(face, amount))}
          variant={ghost ? 'ghost' : undefined}
          className={`flex-1 rounded-none whitespace-nowrap ${kind === 'outer' ? 'px-2' : 'px-1 text-xs'}${ghost ? ' border-l border-slate-800 bg-slate-800' : ''}`}
          aria-label={title}
          title={title}
        >
          {formatMove(turn(face, amount), labels)}
        </Button>
      </div>
    )
  }
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className={SECTION_LABEL}>{t.moves}</h2>
        <div className="flex items-center gap-2">
          <RecenterButton />
          <NotationToggle />
        </div>
      </div>
      {kinds.length > 1 && (
        <div className="mb-2">
          <SegmentedToggle
            size="sm"
            ariaLabel={t.layerLabel}
            value={kind}
            onChange={setLayerKind}
            options={kinds.map((k) => ({ value: k, label: t.layerKinds[k] }))}
          />
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {FACES.filter((face) => moves.some((m) => m.face === face)).map((face) => (
          <div key={face} className="flex overflow-hidden rounded-lg">
            {quarter(face) ? (
              <>
                {button(face, 1, false)}
                {button(face, 3, true)}
              </>
            ) : (
              button(face, 2, false)
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
