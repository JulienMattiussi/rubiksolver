import { useState } from 'react'
import { cubeShape } from '@/lib/cube'
import { formatMove } from '@/lib/moves'
import { PYRA_LAYERS, PYRA_VERTICES, pyraTurn, type PyraLayer } from '@/lib/pyraminx'
import { isPyraminx, type PyraMove } from '@/lib/types'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'
import { TURN_PAIR } from '@/components/ui/styles'
import { PadButton } from './PadButton'
import { PadHeader } from './PadHeader'

/**
 * Rotation pad of a Pyraminx: each corner, a third of a turn either way, of
 * the layer its tab picks: the whole layer or the tip alone on the Pyraminx;
 * the tip, the first or second slice, or the opposite face on the Master
 * (see PadButton).
 */
export function PyraPad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const shape = useCube((s) => cubeShape(s.cube))
  const layers = isPyraminx(shape) ? PYRA_LAYERS[shape] : []
  const [picked, setPicked] = useState<PyraLayer>('corners')
  // The Master opens on its first slice (the Pyraminx's layer has no twin there).
  const layer = layers.includes(picked) ? picked : (layers.find((l) => l === 'slice1') ?? 'tips')

  const button = (move: PyraMove, ghost: boolean) => (
    <PadButton
      key={formatMove(move)}
      move={move}
      label={formatMove(move, labels)}
      title={t.pyraTurnTitle(move.vertex, layer, move.amount === 1)}
      disabled={disabled}
      ghost={ghost}
      compact={layers.length > 2}
    />
  )
  return (
    <div>
      <PadHeader />
      <div className="mb-2">
        <SegmentedToggle
          size="sm"
          ariaLabel={t.layerLabel}
          value={layer}
          onChange={setPicked}
          options={layers.map((k) => ({ value: k, label: t.pyraKinds[k] }))}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {PYRA_VERTICES.map((vertex) => (
          <div key={vertex} className={TURN_PAIR}>
            {button(pyraTurn(vertex, layer, 1), false)}
            {button(pyraTurn(vertex, layer, 2), true)}
          </div>
        ))}
      </div>
    </div>
  )
}
