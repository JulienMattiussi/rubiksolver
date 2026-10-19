import { ArrowDown, ArrowUp, Cog, Search } from 'lucide-react'
import { CANVAS_COUNT } from '@/lib/editor/modes/canvas'
import { useI18n } from '@/i18n/i18nStore'
import { useEditor } from '@/store/editorStore'

/** Where the arrows stand, from the scene's top and bottom: just off the
 *  canvas toward us (the camera straight in front, see FACE_ON_POSITION,
 *  it fills the middle three fifths). */
const EDGE = 'calc(20% - 3.75rem)'

const ARROW =
  'pointer-events-auto absolute left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-xl px-5 py-3 text-base font-semibold whitespace-nowrap shadow-lg transition disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400'

/** Over the scene while a puzzle's faces are copied (faceCanvases.ts):
 *  above the canvas, back to the face before; below it, tilting the puzzle
 *  toward us to the next face, or past the last, its shape searched. */
export function FaceArrows() {
  const t = useI18n((s) => s.t)
  const copying = useEditor((s) => s.mode === 'edit' && s.phase === 'canvas')
  const faceAt = useEditor((s) => s.faceAt)
  const finding = useEditor((s) => s.finding)
  const tiltFace = useEditor((s) => s.tiltFace)
  if (!copying) return null
  const last = faceAt === CANVAS_COUNT - 1
  const Next = finding ? Cog : last ? Search : ArrowDown
  return (
    <div className="pointer-events-none absolute inset-0">
      <button
        type="button"
        onClick={() => tiltFace(-1)}
        disabled={faceAt === 0 || finding}
        className={`${ARROW} bg-slate-700 text-slate-100 hover:bg-slate-600`}
        style={{ top: EDGE }}
      >
        <ArrowUp className="size-5" aria-hidden />
        {t.tiltUp}
      </button>
      <button
        type="button"
        onClick={() => tiltFace(1)}
        disabled={finding}
        aria-busy={finding}
        className={`${ARROW} bg-sky-500 text-white hover:bg-sky-400`}
        style={{ bottom: EDGE }}
      >
        <Next className={`size-5 ${finding ? 'motion-safe:animate-spin' : ''}`} aria-hidden />
        {finding ? t.findingShape : last ? t.findShape : t.tiltDown}
      </button>
    </div>
  )
}
