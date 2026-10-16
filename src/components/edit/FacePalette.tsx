import { cubeShape, shapeColors } from '@/lib/core/cube'
import type { FaceCell } from '@/lib/editor/faceCanvases'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { SECTION_LABEL } from '@/components/ui/styles'
import { ABSENT_HEX, COLOR_HEX } from '@/three/core/colors'

/** What a click paints on a face being copied (faceCanvases.ts): the puzzle's
 *  colors, or "absent" where no sticker shows. No counts: the faces show
 *  some stickers only. */
export function FacePalette() {
  const t = useI18n((s) => s.t)
  const shape = useCube((s) => cubeShape(s.cube))
  const selected = useEditor((s) => s.faceColor)
  const setFaceColor = useEditor((s) => s.setFaceColor)
  // Every color its faces show (the Purple's violet too, which painting
  // leaves out: its big cubes come painted).
  const cells: FaceCell[] = [...shapeColors(shape), 'absent']
  return (
    <div>
      <h2 className={`mb-2 ${SECTION_LABEL}`}>{t.palette}</h2>
      <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t.palette}>
        {cells.map((cell) => {
          const name = cell === 'absent' ? t.faceAbsent : t.colors[cell]
          return (
            <button
              key={cell}
              role="radio"
              aria-checked={selected === cell}
              aria-label={name}
              title={name}
              onClick={() => setFaceColor(cell)}
              className={`h-9 rounded-lg border-2 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${
                selected === cell ? 'border-white' : 'border-transparent hover:border-slate-500'
              } ${cell === 'absent' ? 'text-slate-300' : ''}`}
              style={{ backgroundColor: cell === 'absent' ? ABSENT_HEX : COLOR_HEX[cell] }}
            >
              {cell === 'absent' && name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
