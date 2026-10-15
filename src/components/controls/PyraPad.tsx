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
import { LayerTabs } from './LayerTabs'
import { PadButton } from './PadButton'
import { PadGroups } from './PadGroups'
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
  // The last slice of a Master or a Professor is the face opposite the corner.
  const nameOf = (k: PyraLayer) => (isPyraminx(shape) && isOppositeFace(shape, k) ? 'faces' : k)
  // The outer layers: the tips, the faces opposite the corners; the inner
  // ones: the slices.
  const outer = (k: PyraLayer) => k === 'tips' || k === 'corners' || nameOf(k) === 'faces'

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
      <PadGroups
        groups={[{ key: shown, layers: PYRA_VERTICES }]}
        layerKey={(vertex) => vertex}
        pair={(vertex) => (
          <>
            {button(pyraTurn(vertex, shown, 1), false)}
            {button(pyraTurn(vertex, shown, 2), true)}
          </>
        )}
      />
    )
  }
  return (
    <div>
      <PadHeader />
      <LayerTabs
        shape={shape}
        kinds={layers}
        rows={() => 2}
        isOuter={outer}
        nameOf={(k) => t.pyraKinds[nameOf(k)]}
        grid={grid}
      />
    </div>
  )
}
