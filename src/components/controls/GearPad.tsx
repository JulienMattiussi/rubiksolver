import { cubeShape } from '@/lib/core/cube'
import { plainFaces } from '@/lib/puzzles/gear/gear'
import type { Face, GearMove, Move } from '@/lib/core/types'
import { useCube } from '@/store/cubeStore'
import { useI18n } from '@/i18n/i18nStore'
import { TURN_PAIR } from '@/components/ui/styles'
import { PadHeader } from './PadHeader'
import { useTurnButton } from './useTurnButton'

const FACES: readonly Face[] = ['U', 'D', 'L', 'R', 'F', 'B']

/** Rotation pad of the Gear Cubes: each face a half turn either way, its
 *  opposite face held and the slice between a quarter along (see PadButton).
 *  Its plain faces (the Extreme's top and bottom) turn a quarter, as a
 *  3x3's. */
export function GearPad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const plain = plainFaces(useCube((s) => cubeShape(s.cube)))
  const turnButton = useTurnButton(disabled)
  const quarter = (move: Move, ghost: boolean) =>
    turnButton(move, t.moveTitle(t.faceNames[move.face], move.amount === 1), { ghost })
  const button = (move: GearMove, ghost: boolean) =>
    turnButton(move, t.gearTurnTitle(t.faceNames[move.gear], move.amount === 1), { ghost })
  return (
    <div>
      <PadHeader />
      <div className="grid grid-cols-3 gap-2">
        {FACES.map((face) =>
          plain.includes(face) ? (
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
