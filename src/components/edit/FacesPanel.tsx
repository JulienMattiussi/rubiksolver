import { X } from 'lucide-react'
import { CANVAS_COUNT } from '@/lib/editor/modes/canvas'
import { useI18n } from '@/i18n/i18nStore'
import { useEditor } from '@/store/editorStore'
import { Button } from '@/components/ui/Button'
import { ErrorAlert } from './ErrorAlert'
import { FacePalette } from './FacePalette'
import { ScanButton } from './scan/ScanButton'

/** Entering a shape face by face (faceCanvases.ts): the hint,
 *  which face, the palette; the arrows tilting the puzzle are over the
 *  scene, above and below the canvas (FaceArrows). */
export function FacesPanel() {
  const t = useI18n((s) => s.t)
  const faceAt = useEditor((s) => s.faceAt)
  const count = useEditor((s) => s.faces.length)
  const error = useEditor((s) => s.error)
  const cancel = useEditor((s) => s.cancel)
  return (
    <div className="flex flex-col gap-5">
      {/* Its faces read by the camera, rather than painted. */}
      <ScanButton />
      <p className="text-xs leading-relaxed text-slate-400">
        {/* Past its four faces, a side asked for (sides.ts). */}
        {faceAt < CANVAS_COUNT ? t.editHintFaces : t.editHintSide}
      </p>
      <span className="text-sm font-medium text-slate-200">{t.faceStep(faceAt + 1, count)}</span>
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
