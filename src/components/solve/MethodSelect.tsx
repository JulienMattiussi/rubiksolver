import type { MethodId } from '@/lib/solver'
import { useI18n } from '@/i18n/i18nStore'
import { useCube } from '@/store/cubeStore'

const METHOD_IDS: readonly MethodId[] = ['beginner', 'cfop']

/** Method dropdown plus the selected method's description. */
export function MethodSelect({ disabled }: { disabled: boolean }) {
  const t = useI18n((s) => s.t)
  const method = useCube((s) => s.method)
  const setMethod = useCube((s) => s.setMethod)
  return (
    <div>
      <label
        htmlFor="method"
        className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400"
      >
        {t.methodLabel}
      </label>
      <select
        id="method"
        value={method}
        disabled={disabled}
        onChange={(e) => setMethod(e.target.value as MethodId)}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-semibold text-white transition hover:border-slate-500 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
      >
        {METHOD_IDS.map((id) => (
          <option key={id} value={id}>
            {t.methods[id].name}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{t.methods[method].desc}</p>
    </div>
  )
}
