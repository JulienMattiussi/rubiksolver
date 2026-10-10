import { ArchiveRestore, Bookmark, Pencil, RotateCcw, Shuffle, Square } from 'lucide-react'
import { useState } from 'react'
import { cubeShape, isSolved } from '@/lib/cube'
import { encodeCube } from '@/lib/snapshot'
import { CUBE_CATEGORIES, CUBE_KINDS, cubeCategory, cubeKindId, SHAPE_LABEL } from '@/lib/types'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { useSaved } from '@/store/savedStore'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Select } from '@/components/ui/Select'
import { MovePad } from './MovePad'
import { SpeedSlider } from './SpeedSlider'
import { StatusBadge } from './StatusBadge'

/** Setup block: cube choice + status on one line, scramble/reset/edit actions,
 *  save/restore a state (one per shape, kept across reloads), speed, move pad. */
export function SetupSection() {
  const t = useI18n((s) => s.t)
  const cube = useCube((s) => s.cube)
  const active = useCube((s) => s.active)
  const queue = useCube((s) => s.queue)
  const scramble = useCube((s) => s.scramble)
  const shape = useCube((s) => cubeShape(s.cube))
  const setShape = useCube((s) => s.setShape)
  const variant = useCube((s) => s.variant)
  const setVariant = useCube((s) => s.setVariant)
  const reset = useCube((s) => s.reset)
  const stop = useCube((s) => s.stop)
  const enterEdit = useEditor((s) => s.enter)
  const enterFromCurrent = useEditor((s) => s.enterFromCurrent)
  const locale = useI18n((s) => s.locale)
  const saved = useSaved((s) => s.saved[shape])
  const save = useSaved((s) => s.save)
  const restore = useSaved((s) => s.restore)

  const [confirmReplace, setConfirmReplace] = useState(false)
  const busy = active !== null || queue.length > 0
  const solved = isSolved(cube)
  const alreadySaved = saved?.cube === encodeCube(cube)
  const savedTime = saved
    ? new Date(saved.savedAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <section
      aria-label={t.sectionSetup}
      className="flex flex-col gap-3 rounded-xl border border-slate-700/60 bg-slate-950/30 p-4"
    >
      <Select
        id="cube-size"
        label={t.sizeLabel}
        value={cubeKindId({ shape, variant })}
        disabled={busy}
        onChange={(value) => {
          const kind = CUBE_KINDS.find((k) => cubeKindId(k) === value)
          if (!kind) return
          setShape(kind.shape)
          setVariant(kind.variant)
        }}
        trailing={<StatusBadge />}
      >
        {CUBE_CATEGORIES.map((category) => (
          <optgroup key={category} label={t.cubeCategories[category]}>
            {CUBE_KINDS.filter((kind) => cubeCategory(kind) === category).map((kind) => (
              <option key={cubeKindId(kind)} value={cubeKindId(kind)}>
                {t.cubeKind(SHAPE_LABEL[kind.shape], kind.variant === 'mirror')}
              </option>
            ))}
          </optgroup>
        ))}
      </Select>

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
      <MovePad disabled={busy} />
    </section>
  )
}
