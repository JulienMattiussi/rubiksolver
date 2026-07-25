import { Pencil, RotateCcw, Shuffle, Square } from 'lucide-react'
import { isSolved } from '@/lib/cube'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { Button } from '@/components/ui/Button'
import { MovePad } from './MovePad'
import { SpeedSlider } from './SpeedSlider'
import { StatusBadge } from './StatusBadge'

/** "Initialisation" block: status, scramble/reset/edit actions, speed, move pad. */
export function SetupSection() {
  const t = useI18n((s) => s.t)
  const cube = useCube((s) => s.cube)
  const active = useCube((s) => s.active)
  const queue = useCube((s) => s.queue)
  const scramble = useCube((s) => s.scramble)
  const reset = useCube((s) => s.reset)
  const stop = useCube((s) => s.stop)
  const enterEdit = useEditor((s) => s.enter)
  const enterFromCurrent = useEditor((s) => s.enterFromCurrent)

  const busy = active !== null || queue.length > 0
  const solved = isSolved(cube)

  return (
    <section
      aria-label={t.sectionSetup}
      className="flex flex-col gap-3 rounded-xl border border-slate-700/60 bg-slate-950/30 p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t.sectionSetup}
        </h2>
        <StatusBadge />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={scramble} disabled={busy}>
          <Shuffle className="size-4" aria-hidden />
          {t.scramble}
        </Button>
        {busy ? (
          <Button onClick={stop}>
            <Square className="size-4" aria-hidden />
            {t.stop}
          </Button>
        ) : (
          <Button onClick={reset} disabled={solved}>
            <RotateCcw className="size-4" aria-hidden />
            {t.reset}
          </Button>
        )}
        <Button onClick={enterEdit} disabled={busy} variant="ghost">
          <Pencil className="size-4" aria-hidden />
          {t.editCube}
        </Button>
        <Button onClick={enterFromCurrent} disabled={busy} variant="ghost">
          {t.fromCurrent}
        </Button>
      </div>

      <SpeedSlider />
      <MovePad disabled={busy} />
    </section>
  )
}
