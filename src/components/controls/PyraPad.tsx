import { useState } from 'react'
import { cubeShape } from '@/lib/core/cube'
import { formatMove } from '@/lib/core/moves'
import {
  isOppositeFace,
  PYRA_LAYERS,
  PYRA_VERTICES,
  pyraTurn,
  type PyraLayer,
} from '@/lib/puzzles/pyramid/pyraminx'
import { isPyraminx, type PyraMove } from '@/lib/core/types'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'
import { SECTION_LABEL, TURN_PAIR } from '@/components/ui/styles'
import { STACKED_ROWS } from './MovePad'
import { PadButton } from './PadButton'
import { PadHeader } from './PadHeader'

/**
 * Rotation pad of a Pyraminx: each corner, a third of a turn either way, of
 * each layer (stacked when they fit, otherwise in two tabs, outer and
 * inner): the whole layer or the tip alone on the Pyraminx;
 * the tip, the first or second slice, or the opposite face on the Master;
 * the Jing has its halves only (see PadButton).
 */
export function PyraPad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const shape = useCube((s) => cubeShape(s.cube))
  const layers = isPyraminx(shape) ? PYRA_LAYERS[shape] : []
  const [picked, setPicked] = useState<'outer' | 'inner'>('outer')
  // The last slice of a Master or a Professor is the face opposite the corner.
  const nameOf = (k: PyraLayer) => (isPyraminx(shape) && isOppositeFace(shape, k) ? 'faces' : k)

  // Every layer stacked, each under its name, when they all fit (two rows
  // each); otherwise two tabs, each stacked: the outer layers (the tips,
  // the faces opposite the corners), then the inner ones (the slices).
  const outer = (k: PyraLayer) => k === 'tips' || k === 'corners' || nameOf(k) === 'faces'
  const stacked = layers.length * 2 <= STACKED_ROWS
  const groups = stacked
    ? [{ key: 'outer' as const, layers }]
    : (['outer', 'inner'] as const)
        .map((key) => ({ key, layers: layers.filter((k) => outer(k) === (key === 'outer')) }))
        .filter((g) => g.layers.length > 0)
  const current = groups.find((g) => g.key === picked) ?? groups[0]!

  const grid = (shown: PyraLayer) => {
    const button = (move: PyraMove, ghost: boolean) => (
      <PadButton
        key={formatMove(move)}
        move={move}
        label={formatMove(move, labels)}
        title={t.pyraTurnTitle(move.vertex, nameOf(shown), move.amount === 1)}
        disabled={disabled}
        ghost={ghost}
        compact={layers.length > 2}
      />
    )
    return (
      <div className="grid grid-cols-2 gap-2">
        {PYRA_VERTICES.map((vertex) => (
          <div key={vertex} className={TURN_PAIR}>
            {button(pyraTurn(vertex, shown, 1), false)}
            {button(pyraTurn(vertex, shown, 2), true)}
          </div>
        ))}
      </div>
    )
  }
  return (
    <div>
      <PadHeader />
      {groups.length > 1 && (
        <div className="mb-2">
          <SegmentedToggle
            size="sm"
            ariaLabel={t.layerLabel}
            value={current.key}
            onChange={setPicked}
            options={groups.map((g) => ({ value: g.key, label: t.layerGroups[g.key] }))}
          />
        </div>
      )}
      {current.layers.length > 1
        ? current.layers.map((k) => (
            <div key={k} className="mb-2">
              <p className={`${SECTION_LABEL} mb-1`}>{t.pyraKinds[nameOf(k)]}</p>
              {grid(k)}
            </div>
          ))
        : grid(current.layers[0]!)}
    </div>
  )
}
