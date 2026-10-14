import { formatMove } from '@/lib/core/moves'
import { cubeShape } from '@/lib/core/cube'
import type { Face, GearMove, Move } from '@/lib/core/types'
import { useCube } from '@/store/cubeStore'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { TURN_PAIR } from '@/components/ui/styles'
import { PadButton } from './PadButton'
import { PadHeader } from './PadHeader'

const FACES: readonly Face[] = ['U', 'D', 'L', 'R', 'F', 'B']

/** Rotation pad of the Gear Cubes: each face a half turn either way, its
 *  opposite face held and the slice between a quarter along (see PadButton).
 *  The Extreme's top and bottom turn a quarter, as a 3x3's. */
export function GearPad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const labels = useI18n(selectMoveLabels)
  const extreme = useCube((s) => cubeShape(s.cube) === 'gearX')
  const quarter = (move: Move, ghost: boolean) => (
    <PadButton
      key={formatMove(move)}
      move={move}
      label={formatMove(move, labels)}
      title={t.moveTitle(t.faceNames[move.face], move.amount === 1)}
      disabled={disabled}
      ghost={ghost}
    />
  )
  const button = (move: GearMove, ghost: boolean) => (
    <PadButton
      key={formatMove(move)}
      move={move}
      label={formatMove(move, labels)}
      title={t.gearTurnTitle(t.faceNames[move.gear], move.amount === 1)}
      disabled={disabled}
      ghost={ghost}
    />
  )
  return (
    <div>
      <PadHeader />
      <div className="grid grid-cols-3 gap-2">
        {FACES.map((face) =>
          extreme && (face === 'U' || face === 'D') ? (
            <div key={face} className={TURN_PAIR}>
              {quarter({ face, amount: 1 }, false)}
              {quarter({ face, amount: 3 }, true)}
            </div>
          ) : (
            <div key={face} className={TURN_PAIR}>
              {button({ gear: face, amount: 1 }, false)}
              {button({ gear: face, amount: 3 }, true)}
            </div>
          ),
        )}
      </div>
    </div>
  )
}
