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
 * each layer (stacked when they fit, in tabs otherwise): the whole layer
 * or the tip alone on the Pyraminx;
 * the tip, the first or second slice, or the opposite face on the Master;
 * the Jing has its halves only (see PadButton).
 */
export function PyraPad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const shape = useCube((s) => cubeShape(s.cube))
  const layers = isPyraminx(shape) ? PYRA_LAYERS[shape] : []
  const [picked, setPicked] = useState<PyraLayer>('corners')
  // The last slice of a Master or a Professor is the face opposite the corner.
  const nameOf = (k: PyraLayer) => (isPyraminx(shape) && isOppositeFace(shape, k) ? 'faces' : k)
  // The Master opens on its first slice, the others on their first layer.
  const layer = layers.includes(picked) ? picked : layers.includes('slice1') ? 'slice1' : layers[0]!

  // Every layer stacked, each under its name, when they all fit (two rows
  // each); tabs otherwise.
  const stacked = layers.length > 1 && layers.length * 2 <= STACKED_ROWS

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
  if (stacked) {
    return (
      <div>
        <PadHeader />
        {layers.map((k) => (
          <div key={k} className="mb-2">
            <p className={`${SECTION_LABEL} mb-1`}>{t.pyraKinds[nameOf(k)]}</p>
            {grid(k)}
          </div>
        ))}
      </div>
    )
  }
  return (
    <div>
      <PadHeader />
      {layers.length > 1 && (
        <div className="mb-2">
          <SegmentedToggle
            size="sm"
            ariaLabel={t.layerLabel}
            value={layer}
            onChange={setPicked}
            options={layers.map((k) => ({
              value: k,
              // Five tabs (the Professor) only fit on one line with the
              // slices numbered short; the full name stays in the tooltip.
              label:
                layers.length > 4 && nameOf(k).startsWith('slice')
                  ? t.sliceShort(Number(k.slice(5)))
                  : t.pyraKinds[nameOf(k)],
              title: t.pyraKinds[nameOf(k)],
            }))}
          />
        </div>
      )}
      {grid(layer)}
    </div>
  )
}
