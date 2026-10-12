import { ArchiveRestore, Bookmark, RotateCcw, Shuffle, Square } from 'lucide-react'
import { useState } from 'react'
import { cubeShape } from '@/lib/cube'
import { isPyraminx, isStar } from '@/lib/types'
import { encodeCube } from '@/lib/snapshot'
import { useI18n } from '@/i18n/i18nStore'
import { selectBusy, selectSolved, useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { useSaved } from '@/store/savedStore'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { CubePicker } from '@/components/picker/CubePicker'
import { SECTION_BOX } from '@/components/ui/styles'
import { FEATURE_ICON } from '@/components/ui/features'
import { MovePad } from './MovePad'
import { GhostPad } from './GhostPad'
import { RainbowPad } from './RainbowPad'
import { PyraPad } from './PyraPad'
import { StarPad } from './StarPad'
import { SpeedSlider } from './SpeedSlider'
import { StatusBadge } from './StatusBadge'

/** Setup block: cube choice (picker) + status on one line, scramble/reset/edit actions,
 *  save/restore a state (one per shape, kept across reloads), speed, move pad. */
export function SetupSection() {
  const t = useI18n((s) => s.t)
  const cube = useCube((s) => s.cube)
  const scramble = useCube((s) => s.scramble)
  const shape = useCube((s) => cubeShape(s.cube))
  const reset = useCube((s) => s.reset)
  const stop = useCube((s) => s.stop)
  const enterEdit = useEditor((s) => s.enter)
  const enterFromCurrent = useEditor((s) => s.enterFromCurrent)
  const locale = useI18n((s) => s.locale)
  const saved = useSaved((s) => s.saved[shape])
  const save = useSaved((s) => s.save)
  const restore = useSaved((s) => s.restore)

  const [confirmReplace, setConfirmReplace] = useState(false)
  const busy = useCube(selectBusy)
  // A solution playing is paused from its own panel (SolvePanel).
  const solving = useCube((s) => s.solving)
  const solved = useCube(selectSolved)
  const alreadySaved = saved?.cube === encodeCube(cube)
  const savedTime = saved
    ? new Date(saved.savedAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <section aria-label={t.sectionSetup} className={SECTION_BOX}>
      <CubePicker disabled={busy} trailing={<StatusBadge />} />

      <div className="grid grid-cols-2 gap-2">
        <Button onClick={scramble} disabled={busy}>
          <Shuffle className="size-4" aria-hidden />
          {t.scramble}
        </Button>
        {busy && !solving ? (
          <Button onClick={stop}>
            <Square className="size-4" aria-hidden />
            {t.stop}
          </Button>
        ) : (
          <Button onClick={reset} disabled={solved || busy}>
            <RotateCcw className="size-4" aria-hidden />
            {t.reset}
          </Button>
        )}
        {/* The Violet has no entry yet: its pieces are all alike. */}
        {shape !== 'violet' && (
          <>
            <Button onClick={enterEdit} disabled={busy} variant="edit">
              <FEATURE_ICON.edit className="size-4" aria-hidden />
              {t.editCube}
            </Button>
            <Button onClick={enterFromCurrent} disabled={busy} variant="ghost">
              {t.fromCurrent}
            </Button>
          </>
        )}
        <Button
          // Overwriting another memorized state asks first; a first save does not.
          onClick={() => (saved ? setConfirmReplace(true) : save(cube))}
          disabled={busy || alreadySaved}
          variant="ghost"
          title={alreadySaved ? t.savedAlready : t.saveStateTitle}
        >
          <Bookmark className="size-4" aria-hidden />
          {t.saveState}
        </Button>
        <Button
          onClick={() => restore(shape)}
          disabled={busy || !saved || alreadySaved}
          variant="ghost"
          title={saved ? t.restoreStateTitle(savedTime) : t.nothingSaved}
        >
          <ArchiveRestore className="size-4" aria-hidden />
          {t.restoreState}
        </Button>
      </div>

      {confirmReplace && (
        <ConfirmDialog
          title={t.replaceSavedTitle}
          message={t.replaceSavedMessage(savedTime)}
          confirmLabel={t.replaceSaved}
          cancelLabel={t.cancel}
          onConfirm={() => {
            save(cube)
            setConfirmReplace(false)
          }}
          onCancel={() => setConfirmReplace(false)}
        />
      )}

      <SpeedSlider />
      {isStar(shape) ? (
        <StarPad disabled={busy} />
      ) : isPyraminx(shape) ? (
        <PyraPad disabled={busy} />
      ) : shape === 'ghost' ? (
        <GhostPad disabled={busy} />
      ) : shape === 'rainbow' ? (
        <RainbowPad disabled={busy} />
      ) : (
        <MovePad disabled={busy} />
      )}
    </section>
  )
}
