import { cubeShape } from '@/lib/core/cube'
import {
  isOppositeFace,
  PYRA_LAYERS,
  PYRA_VERTICES,
  pyraTurn,
  type PyraLayer,
} from '@/lib/puzzles/pyramid/pyraminx'
import { type PyraMove } from '@/lib/core/types'
import { isPyraminx } from '@/lib/core/shapes'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { LayerTabs } from './LayerTabs'
import { PadGroups } from './PadGroups'
import { PadHeader } from './PadHeader'
import { useHeldTurn } from './useHeldTurn'
import { useTurnButton } from './useTurnButton'

/**
 * Rotation pad of a Pyraminx: each corner, a third of a turn either way, of
 * each layer (stacked when they fit, otherwise in two tabs, outer and
 * inner): the whole layer or the tip alone on the Pyraminx;
 * the tip, the first or second slice, or the opposite face on the Master;
 * the Jing has its halves only (see PadButton). In the tutorial, it reads
 * as the puzzle is held (useHeldTurn).
 */
export function PyraPad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const turnButton = useTurnButton(disabled)
  const shape = useCube((s) => cubeShape(s.cube))
  const held = useHeldTurn()
  const layers = isPyraminx(shape) ? PYRA_LAYERS[shape] : []
  // The last slice of a Master or a Professor is the face opposite the corner.
  const nameOf = (k: PyraLayer) => (isPyraminx(shape) && isOppositeFace(shape, k) ? 'faces' : k)
  // The outer layers: the tips, the faces opposite the corners; the inner
  // ones: the slices.
  const outer = (k: PyraLayer) => k === 'tips' || k === 'corners' || nameOf(k) === 'faces'

  const grid = (shown: PyraLayer) => {
    const button = (move: PyraMove, ghost: boolean) =>
      turnButton(move, t.pyraTurnTitle(move.vertex, nameOf(shown), move.amount === 1), {
        ghost,
        compact: layers.length > 2,
        // Held another way (the tutorial): the corner where it stands.
        played: held(move),
      })
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
