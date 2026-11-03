import { ChevronLeft, RotateCcw, RotateCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cubeShape } from '@/lib/core/cube'
import type { FormPick, FormStages } from '@/lib/editor/entry'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { useEditor } from '@/store/editorStore'
import { Button } from '@/components/ui/Button'
import { IconButton } from '@/components/ui/IconButton'
import { SECTION_LABEL } from '@/components/ui/styles'
import { FromAbove } from './FromAbove'

/**
 * A form chosen in stages (lib/editor/entry.ts, `FormStages`: a Square-1's
 * top, bottom and middle), when its forms are too many for thumbnails: each
 * stage's choices seen from above, the one picked turned round till it
 * stands as the puzzle's does, the whole form shown in 3D meanwhile; the
 * last stage goes on to its pieces. Back from its colors, it starts from
 * the form being entered (`FormStages.of`).
 */
export function StagedFormPicker({ stages }: { stages: FormStages }) {
  const t = useI18n((s) => s.t)
  const shape = useCube((s) => cubeShape(s.cube))
  const pickForm = useEditor((s) => s.pickForm)
  const setPreview = useEditor((s) => s.setPreview)
  const [stage, setStage] = useState(0)
  const entered = useEditor((s) => s.form)
  const [picks, setPicks] = useState<readonly FormPick[]>(() => (entered ? stages.of(entered) : []))
  const name = stages.stages[stage]!
  const options = stages.options(stage, picks.slice(0, stage))
  const picked = picks[stage]
  const ways = options.find((o) => o.key === picked?.key)?.ways ?? 1
  const texts = t.formStages[name]
  // The form as picked so far, in 3D.
  useEffect(() => setPreview(stages.form(picks)), [picks, stages, setPreview])
  useEffect(() => () => setPreview(undefined), [setPreview])

  const pick = (next: FormPick) => setPicks([...picks.slice(0, stage), next])
  const turn = (by: number) => picked && pick({ ...picked, way: (picked.way + by + ways) % ways })
  const last = stage === stages.stages.length - 1

  return (
    <div className="flex flex-col gap-3">
      <p className={SECTION_LABEL}>{t.formStageOf(stage + 1, stages.stages.length)}</p>
      <p className="text-sm font-medium text-slate-200">{texts.title}</p>
      <p className="text-xs leading-relaxed text-slate-400">{texts.hint}</p>
      <div className="grid max-h-[40vh] grid-cols-5 gap-2 overflow-y-auto pr-1">
        {options.map((option, i) => {
          const on = picked?.key === option.key
          const shown: FormPick = on ? picked : { key: option.key, way: 0 }
          const label = texts.choice(i + 1, option.key)
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => pick(shown)}
              aria-pressed={on}
              aria-label={label}
              title={label}
              className={`rounded-lg border p-1 focus-visible:outline-2 focus-visible:outline-sky-400 ${
                on ? 'border-sky-400 bg-sky-500/10' : 'border-slate-700/60 hover:border-sky-400'
              }`}
            >
              <FromAbove
                shape={shape}
                pieces={stages.picture(stage, [...picks.slice(0, stage), shown])}
                cut={stages.cut}
                className="aspect-square w-full"
              />
            </button>
          )
        })}
      </div>
      {picked && ways > 1 && (
        <div className="flex items-center justify-center gap-3">
          <IconButton label={t.formTurn(false)} onClick={() => turn(-1)}>
            <RotateCcw className="size-5" aria-hidden />
          </IconButton>
          <span className="text-xs text-slate-400">{t.formTurnHint}</span>
          <IconButton label={t.formTurn(true)} onClick={() => turn(1)}>
            <RotateCw className="size-5" aria-hidden />
          </IconButton>
        </div>
      )}
      <div className="flex gap-2">
        {stage > 0 && (
          <Button onClick={() => setStage(stage - 1)} className="flex-1">
            <ChevronLeft className="size-4" aria-hidden />
            {t.formBack}
          </Button>
        )}
        <Button
          variant="solve"
          disabled={!picked}
          onClick={() => (last ? pickForm(stages.form(picks)) : setStage(stage + 1))}
          className="flex-1"
        >
          {last ? t.formDone : t.formNext}
        </Button>
      </div>
    </div>
  )
}
