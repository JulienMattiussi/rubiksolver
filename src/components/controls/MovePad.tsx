import { useState } from 'react'
import { cubeDims, faceAxis, faceLayers, quarterTurnFits } from '@/lib/cube'
import { formatMove, FACES, NOTATION_FR, NOTATION_US } from '@/lib/moves'
import type { Face, Move } from '@/lib/types'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { Button } from '@/components/ui/Button'
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'
import { NotationToggle } from './NotationToggle'
import { RecenterButton } from './RecenterButton'

type LayerKind = 'outer' | 'slice' | 'wide'

/**
 * Manual rotation pad, built from the turns the shape actually allows: one
 * clockwise + one counter-clockwise button per face, a single half-turn button
 * where quarter turns would not fit (every face of a 1x2x3), and nothing at
 * all for a face whose axis has a single layer. Cubes with inner layers (4x4)
 * get a selector for what the buttons turn: the outer face, the inner slice
 * (2R) or both layers together (Rw).
 */
export function MovePad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const notation = useI18n((s) => s.notation)
  const pushMove = useCube((s) => s.pushMove)
  const dims = useCube((s) => cubeDims(s.cube))
  const [layerKind, setLayerKind] = useState<LayerKind>('outer')
  const labels = notation === 'fr' ? NOTATION_FR : NOTATION_US
  const hasInnerLayers = dims.some((n) => n >= 4)
  const kind = hasInnerLayers ? layerKind : 'outer'
  const turn = (face: Face, amount: 1 | 2 | 3): Move =>
    kind === 'slice'
      ? { face, amount, depth: 2 }
      : kind === 'wide'
        ? { face, amount, depth: 2, wide: true }
        : { face, amount }
  const button = (face: Face, amount: 1 | 2 | 3, ghost: boolean) => {
    const title =
      amount === 2
        ? t.moveTitleHalf(t.faceNames[face])
        : t.moveTitle(t.faceNames[face], amount === 1, kind)
    return (
      <Button
        disabled={disabled}
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
      {hasInnerLayers && (
        <div className="mb-2">
          <SegmentedToggle
            size="sm"
            ariaLabel={t.layerLabel}
            value={layerKind}
            onChange={setLayerKind}
            options={[
              { value: 'outer', label: t.layerKinds.outer },
              { value: 'slice', label: t.layerKinds.slice },
              { value: 'wide', label: t.layerKinds.wide },
            ]}
          />
        </div>
      )}
      <div className="grid grid-cols-3 gap-2">
        {FACES.filter((face) => faceLayers(dims, face) >= 2).map((face) => (
          <div key={face} className="flex overflow-hidden rounded-lg">
            {quarterTurnFits(dims, faceAxis(face)) ? (
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
