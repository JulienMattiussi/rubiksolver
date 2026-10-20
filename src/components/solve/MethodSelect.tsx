import { ChevronDown, ChevronUp, GraduationCap } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import { cubeShape } from '@/lib/core/cube'
import { methodsFor, type MethodId } from '@/lib/solve/solver'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { Select } from '@/components/ui/Select'
import { tutorialFor } from '@/lib/tutorials/registry'

/** Method dropdown (its label says how many; a method with a tutorial
 *  wears its icon) plus the selected method's description (two lines, all
 *  of it on a click of its arrow). */
export function MethodSelect({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const shape = useCube((s) => cubeShape(s.cube))
  const method = useCube((s) => s.method)
  const setMethod = useCube((s) => s.setMethod)
  const methods = methodsFor(shape)
  return (
    <div>
      <Select
        id="method"
        label={`${t.methodLabel} (${methods.length})`}
        value={method}
        disabled={disabled}
        onChange={(value) => setMethod(value as MethodId)}
        options={methods.map(({ id }) => ({
          value: id,
          label: t.methods[id].name,
          // The methods a tutorial teaches, marked as in the picker.
          ...(tutorialFor(shape, id) && {
            badge: {
              icon: <GraduationCap className="size-4" aria-hidden />,
              title: t.withTutorial,
            },
          }),
        }))}
      />
      {/* Folded again for another method or language. */}
      <MethodDesc key={method + t.methods[method].desc} text={t.methods[method].desc} />
    </div>
  )
}

/** Two lines at most, and an arrow that unfolds the rest when there is
 *  more (folds it back once open). */
function MethodDesc({ text }: { text: string }) {
  const t = useI18n((s) => s.t)
  const ref = useRef<HTMLParagraphElement>(null)
  const [open, setOpen] = useState(false)
  const [longer, setLonger] = useState(false)
  useLayoutEffect(() => {
    const p = ref.current
    if (p) setLonger(p.scrollHeight > p.clientHeight + 1)
  }, [text])
  return (
    <div className="mt-2 text-xs leading-relaxed text-slate-400">
      <p ref={ref} className={open ? '' : 'line-clamp-2'}>
        {text}
      </p>
      {(longer || open) && (
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          title={open ? t.showLess : t.showMore}
          aria-label={open ? t.showLess : t.showMore}
          className="rounded px-1 font-semibold text-slate-300 hover:text-white focus-visible:outline-2 focus-visible:outline-sky-400"
        >
          {open ? (
            <ChevronUp className="size-4" aria-hidden />
          ) : (
            <ChevronDown className="size-4" aria-hidden />
          )}
        </button>
      )}
    </div>
  )
}
