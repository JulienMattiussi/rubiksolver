import { faceLabel, FACES, NOTATION_FR, NOTATION_US } from '@/lib/moves'
import type { Face, Move } from '@/lib/types'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { Button } from '@/components/ui/Button'
import { NotationToggle } from './NotationToggle'
import { RecenterButton } from './RecenterButton'

/** Manual rotation pad: one clockwise + one counter-clockwise button per face. */
export function MovePad({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const notation = useI18n((s) => s.notation)
  const pushMove = useCube((s) => s.pushMove)
  const labels = notation === 'fr' ? NOTATION_FR : NOTATION_US
  const turn = (face: Face, amount: 1 | 3): Move => ({ face, amount })
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{t.moves}</h2>
        <div className="flex items-center gap-2">
          <RecenterButton />
          <NotationToggle />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {FACES.map((face) => (
          <div key={face} className="flex overflow-hidden rounded-lg">
            <Button
              disabled={disabled}
              onClick={() => pushMove(turn(face, 1))}
              className="flex-1 rounded-none px-2"
              aria-label={t.moveTitle(t.faceNames[face], true)}
              title={t.moveTitle(t.faceNames[face], true)}
            >
              {faceLabel(face, labels)}
            </Button>
            <Button
              disabled={disabled}
              onClick={() => pushMove(turn(face, 3))}
              variant="ghost"
              className="flex-1 rounded-none border-l border-slate-800 bg-slate-800 px-2"
              aria-label={t.moveTitle(t.faceNames[face], false)}
              title={t.moveTitle(t.faceNames[face], false)}
            >
              {faceLabel(face, labels)}&#39;
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
