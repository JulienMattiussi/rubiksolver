import { useState } from 'react'
import { cubeSize } from '@/lib/cube'
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
 * Manual rotation pad: one clockwise + one counter-clockwise button per face.
 * Cubes with inner layers (4x4) get a selector for what the buttons turn:
 * the outer face, the inner slice (2R) or both layers together (Rw).
 */
export function MovePad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const notation = useI18n((s) => s.notation)
  const pushMove = useCube((s) => s.pushMove)
  const size = useCube((s) => cubeSize(s.cube))
  const [layerKind, setLayerKind] = useState<LayerKind>('outer')
  const labels = notation === 'fr' ? NOTATION_FR : NOTATION_US
  const kind = size >= 4 ? layerKind : 'outer'
  const turn = (face: Face, amount: 1 | 3): Move =>
    kind === 'slice'
      ? { face, amount, depth: 2 }
      : kind === 'wide'
        ? { face, amount, depth: 2, wide: true }
        : { face, amount }
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.moves}</h2>
        <div className="flex items-center gap-2">
          <RecenterButton />
          <NotationToggle />
        </div>
      </div>
      {size >= 4 && (
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
        {FACES.map((face) => (
          <div key={face} className="flex overflow-hidden rounded-lg">
            <Button
              disabled={disabled}
              onClick={() => pushMove(turn(face, 1))}
              className="flex-1 rounded-none px-2"
              aria-label={t.moveTitle(t.faceNames[face], true, kind)}
              title={t.moveTitle(t.faceNames[face], true, kind)}
            >
              {formatMove(turn(face, 1), labels)}
            </Button>
            <Button
              disabled={disabled}
              onClick={() => pushMove(turn(face, 3))}
              variant="ghost"
              className="flex-1 rounded-none border-l border-slate-800 bg-slate-800 px-2"
              aria-label={t.moveTitle(t.faceNames[face], false, kind)}
              title={t.moveTitle(t.faceNames[face], false, kind)}
            >
              {formatMove(turn(face, 3), labels)}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
