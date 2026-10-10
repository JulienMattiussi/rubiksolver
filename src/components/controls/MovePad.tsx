import { useState } from 'react'
import { cubeShape, turnAllowed } from '@/lib/cube'
import { formatMove, FACES, movesFor, NOTATION_FR, NOTATION_US } from '@/lib/moves'
import type { Face, Move } from '@/lib/types'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { Button } from '@/components/ui/Button'
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'
import { NotationToggle } from './NotationToggle'
import { RecenterButton } from './RecenterButton'

type LayerKind = 'outer' | 'slice' | 'wide'

/**
 * Manual rotation pad, built from the turns the shape allows (`movesFor`):
 * one clockwise + one counter-clockwise button per face, a single half-turn
 * button where the puzzle has no quarter turn (every face of a 1x2x3), and
 * nothing for a face whose axis has a single layer. When the shape has other
 * layer kinds, a selector picks what the buttons turn: the outer face, the
 * inner slice (2R, 4x4 only) or both layers together (Rw). A turn the state
 * jams (a tower's incomplete end, see `turnAllowed`) stays disabled.
 */

const KIND_OF = (m: Move): LayerKind => (m.wide ? 'wide' : m.depth ? 'slice' : 'outer')

export function MovePad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const notation = useI18n((s) => s.notation)
  const pushMove = useCube((s) => s.pushMove)
  const shape = useCube((s) => cubeShape(s.cube))
  const cube = useCube((s) => s.cube)
  const [layerKind, setLayerKind] = useState<LayerKind>('outer')
  const labels = notation === 'fr' ? NOTATION_FR : NOTATION_US
  const moves = movesFor(shape)
  const kinds = (['outer', 'slice', 'wide'] as const).filter((k) =>
    moves.some((m) => KIND_OF(m) === k),
  )
  const kind = kinds.includes(layerKind) ? layerKind : 'outer'
  const quarter = (face: Face) => moves.some((m) => m.face === face && m.amount === 1)
  const turn = (face: Face, amount: 1 | 2 | 3): Move =>
    kind === 'slice'
      ? { face, amount, depth: 2 }
      : kind === 'wide'
        ? { face, amount, depth: 2, wide: true }
        : { face, amount }
  const button = (face: Face, amount: 1 | 2 | 3, ghost: boolean) => {
    const jammed = !turnAllowed(cube, turn(face, amount))
    const title = jammed
      ? t.jammedTurn(t.faceNames[face])
      : amount === 2
        ? t.moveTitleHalf(t.faceNames[face])
        : t.moveTitle(t.faceNames[face], amount === 1, kind)
    return (
      <Button
        disabled={disabled || jammed}
        onClick={() => pushMove(turn(face, amount))}
        variant={ghost ? 'ghost' : undefined}
        className={`flex-1 rounded-none px-2${ghost ? ' border-l border-slate-800 bg-slate-800' : ''}`}
        aria-label={title}
        title={title}
      >
        {formatMove(turn(face, amount), labels)}
      </Button>
    )
  }
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.moves}</h2>
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
            value={layerKind}
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
