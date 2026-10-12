import { useState } from 'react'
import { cubeShape } from '@/lib/cube'
import { formatMoves } from '@/lib/moves'
import { formsOf, type Form } from '@/lib/forms'
import { selectMoveLabels, useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { SECTION_LABEL } from '@/components/ui/styles'
import { PuzzleIcon } from '@/components/picker/PuzzleIcon'

/**
 * First step of entering a shape-shifting puzzle (the tower): the forms it
 * can stand in (forms.ts), as thumbnails grouped by how many small cubes
 * stick out alone (when that tells them apart). Hovering (or focusing) one shows it in 3D; picking one
 * goes on to its colors.
 */
export function FormPicker() {
  const t = useI18n((s) => s.t)
  const shape = useCube((s) => cubeShape(s.cube))
  const pickForm = useEditor((s) => s.pickForm)
  const setPreview = useEditor((s) => s.setPreview)
  const labels = useI18n(selectMoveLabels)
  // The form hovered, to tell the turns that reach it.
  const [hovered, setHovered] = useState<Form | undefined>()
  const forms = formsOf(shape)
  const groups = new Map<number, { form: Form; n: number }[]>()
  forms.forEach((form, i) => {
    groups.set(form.tips, [...(groups.get(form.tips) ?? []), { form, n: i + 1 }])
  })
  // A few forms, all alike (the Pyramorphinx's): no groups to tell apart.
  const grouped = groups.size > 1
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-slate-200">{t.chooseForm}</p>
      <p className="text-xs leading-relaxed text-slate-400">
        {t.chooseFormHint} {grouped && t.formSortHint}
      </p>
      <div className="max-h-[55vh] overflow-y-auto pr-1">
        {[...groups].map(([tips, members]) => (
          <section key={tips} className="mb-3">
            {grouped && <h3 className={`${SECTION_LABEL} mb-2`}>{t.formGroup(tips)}</h3>}
            <div className="grid grid-cols-4 gap-2">
              {members.map(({ form, n }) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => pickForm(form.cube)}
                  onPointerEnter={() => {
                    setPreview(form.cube)
                    setHovered(form)
                  }}
                  onPointerLeave={() => {
                    setPreview(undefined)
                    setHovered(undefined)
                  }}
                  onFocus={() => {
                    setPreview(form.cube)
                    setHovered(form)
                  }}
                  onBlur={() => {
                    setPreview(undefined)
                    setHovered(undefined)
                  }}
                  className="rounded-lg border border-slate-700/60 p-1.5 hover:border-sky-400 focus-visible:outline-2 focus-visible:outline-sky-400"
                  aria-label={t.formTile(n, tips)}
                  title={t.formTile(n, tips)}
                >
                  <PuzzleIcon
                    shape={shape}
                    variant="classic"
                    form={form.cube}
                    className="h-14 w-full"
                  />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
      {/* The turns that reach the form hovered, to try on the real puzzle. */}
      <p className="min-h-8 font-mono text-xs text-slate-300">
        {hovered && hovered.moves.length > 0 && t.formReachedBy(formatMoves(hovered.moves, labels))}
      </p>
    </div>
  )
}
