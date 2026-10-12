import { cubeShape } from '@/lib/cube'
import { methodsFor, type MethodId } from '@/lib/solver'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'
import { Select } from '@/components/ui/Select'

/** Method dropdown plus the selected method's description (three lines,
 *  all of it on hover). */
export function MethodSelect({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const shape = useCube((s) => cubeShape(s.cube))
  const method = useCube((s) => s.method)
  const setMethod = useCube((s) => s.setMethod)
  return (
    <div>
      <Select
        id="method"
        label={t.methodLabel}
        value={method}
        disabled={disabled}
        onChange={(value) => setMethod(value as MethodId)}
      >
        {methodsFor(shape).map(({ id }) => (
          <option key={id} value={id}>
            {t.methods[id].name}
          </option>
        ))}
      </Select>
      {/* Three lines at most; the whole text on hover (or focus). */}
      <p
        tabIndex={0}
        className="mt-2 line-clamp-3 rounded text-xs leading-relaxed text-slate-400 hover:line-clamp-none focus:line-clamp-none focus-visible:outline-2 focus-visible:outline-sky-400"
      >
        {t.methods[method].desc}
      </p>
    </div>
  )
}
