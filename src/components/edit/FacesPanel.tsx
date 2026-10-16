import { X } from 'lucide-react'
import { FACES } from '@/lib/puzzles/shared/faceViews'
import { useI18n } from '@/i18n/i18nStore'
import { useEditor } from '@/store/editorStore'
import { Button } from '@/components/ui/Button'
import { ErrorAlert } from './ErrorAlert'
import { FacePalette } from './FacePalette'

/** Entering a shape face by face (faceCanvases.ts): the hint,
 *  which face, the palette; the arrows tilting the puzzle are over the
 *  scene, above and below the canvas (FaceArrows). */
export function FacesPanel() {
  const t = useI18n((s) => s.t)
  const faceAt = useEditor((s) => s.faceAt)
  const error = useEditor((s) => s.error)
  const cancel = useEditor((s) => s.cancel)
  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs leading-relaxed text-slate-400">{t.editHintFaces}</p>
      <span className="text-sm font-medium text-slate-200">
        {t.faceStep(faceAt + 1, FACES.length)}
      </span>
      <FacePalette />
      {error === 'faces' && <ErrorAlert>{t.errorFaces}</ErrorAlert>}
      {error === 'facesShape' && <ErrorAlert>{t.errorFacesShape}</ErrorAlert>}
      <Button onClick={cancel}>
        <X className="size-4" aria-hidden />
        {t.cancel}
      </Button>
    </div>
  )
}
